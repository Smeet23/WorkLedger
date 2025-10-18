import { Octokit } from '@octokit/rest'
import { App } from '@octokit/app'
import { config } from '@/lib/config'
import { githubTokenManager, GitHubTokenType } from '@/lib/github-token-manager'
import {
  ExternalServiceError,
  RateLimitError,
  NotFoundError,
  AuthenticationError
} from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { db } from '@/lib/db'

export class EnhancedGitHubService {
  private app: App
  private logger = loggers.external('github')

  constructor() {
    // Debug: Check if credentials are loaded
    this.logger.info('Initializing GitHub App', {
      appId: config.github.app.id,
      hasPrivateKey: !!config.github.app.privateKey,
      privateKeyLength: config.github.app.privateKey?.length || 0,
      privateKeyStart: config.github.app.privateKey?.substring(0, 50) || '',
      hasClientId: !!config.github.app.clientId,
      hasClientSecret: !!config.github.app.clientSecret,
    })

    this.app = new App({
      appId: config.github.app.id,
      privateKey: config.github.app.privateKey,
      clientId: config.github.app.clientId,
      clientSecret: config.github.app.clientSecret,
    })
  }

  /**
   * Get GitHub client for a company using App Installation
   */
  async getCompanyClient(companyId: string): Promise<Octokit> {
    try {
      // First try to get existing tokens
      let tokenData = await githubTokenManager.getCompanyTokens(
        companyId,
        GitHubTokenType.APP_INSTALLATION
      )

      // If token is null (expired/missing), refresh it using the installation
      if (!tokenData) {
        this.logger.info('Token expired or missing, refreshing from installation...', { companyId })

        // Get installation ID from github_installations table
        const installation = await db.gitHubInstallation.findFirst({
          where: { companyId, isActive: true }
        })

        if (!installation) {
          throw new AuthenticationError('No GitHub App installation found for company')
        }

        this.logger.info('Found installation, generating new token', {
          companyId,
          installationId: installation.installationId.toString()
        })

        // Generate new installation token
        const installationOctokit = await this.app.getInstallationOctokit(Number(installation.installationId))
        const { data: newToken } = await installationOctokit.request('POST /app/installations/{installation_id}/access_tokens', {
          installation_id: Number(installation.installationId)
        })

        // Store the new token
        tokenData = {
          accessToken: newToken.token,
          expiresAt: new Date(newToken.expires_at),
          tokenType: GitHubTokenType.APP_INSTALLATION,
          metadata: {
            installationId: Number(installation.installationId),
            permissions: newToken.permissions
          }
        }

        await githubTokenManager.storeCompanyTokens(
          companyId,
          tokenData,
          installation.accountLogin,
          installation.installationId
        )

        this.logger.info('✅ Successfully refreshed GitHub App token', {
          companyId,
          expiresAt: tokenData.expiresAt
        })
      }

      const octokit = new Octokit({
        auth: tokenData.accessToken,
        userAgent: `${config.app.name}/1.0.0`,
      })

      // Add rate limit handling
      octokit.hook.error('request', async (error, options) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
          const response = (error as any).response
          if (response?.headers?.['x-ratelimit-remaining'] === '0') {
            const resetTime = parseInt(response.headers['x-ratelimit-reset'] || '0') * 1000
            const retryAfter = Math.max(resetTime - Date.now(), 0)
            throw new RateLimitError('GitHub API', retryAfter)
          }
        }
        throw error
      })

      return octokit
    } catch (error) {
      this.logger.error('Failed to create company GitHub client', error, { companyId })
      throw error
    }
  }

  /**
   * Get GitHub client for an employee using OAuth
   */
  async getEmployeeClient(employeeId: string): Promise<Octokit> {
    try {
      const tokenData = await githubTokenManager.getEmployeeTokens(employeeId)

      if (!tokenData) {
        throw new AuthenticationError('No GitHub connection found for employee')
      }

      return new Octokit({
        auth: tokenData.accessToken,
        userAgent: `${config.app.name}/1.0.0`,
      })
    } catch (error) {
      this.logger.error('Failed to create employee GitHub client', error, { employeeId })
      throw error
    }
  }

  /**
   * Sync organization repositories using company app installation
   */
  async syncOrganizationRepositories(companyId: string): Promise<{
    repositories: number
    newRepositories: number
    updatedRepositories: number
  }> {
    const companyLogger = this.logger.withCompany(companyId)
    let newCount = 0
    let updatedCount = 0

    try {
      const octokit = await this.getCompanyClient(companyId)

      // Get ALL repositories accessible to the installation (WITH PAGINATION)
      companyLogger.info('Fetching ALL organization repositories with pagination...')
      const allRepos = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { data: installationRepos } = await octokit.rest.apps.listReposAccessibleToInstallation({
          per_page: 100,
          page
        })

        allRepos.push(...installationRepos.repositories)
        companyLogger.info(`  Page ${page}: Found ${installationRepos.repositories.length} repos (total: ${allRepos.length})`)

        // If we got less than 100, we've reached the end
        if (installationRepos.repositories.length < 100) {
          hasMore = false
        } else {
          page++
        }
      }

      companyLogger.info('Fetched organization repositories', {
        totalRepositories: allRepos.length
      })

      // Process each repository
      for (const repo of allRepos) {
        try {
          companyLogger.info(`Processing repository: ${repo.full_name}`)

          // Check if repository already exists
          const existingRepo = await db.repository.findUnique({
            where: { githubRepoId: String(repo.id) }
          })

          companyLogger.info(`Existing repo check: ${existingRepo ? 'EXISTS' : 'NEW'}`, {
            repoId: repo.id,
            repoName: repo.full_name
          })

          const repoData = {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || null,
            homepage: repo.homepage || null,
            defaultBranch: repo.default_branch || 'main',
            isPrivate: repo.private || false,
            isFork: repo.fork || false,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            watchers: repo.watchers_count || 0,
            size: repo.size || 0,
            openIssues: repo.open_issues_count || 0,
            primaryLanguage: repo.language || null,
            githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
            updatedAt: new Date()
          }

          if (existingRepo) {
            // Update existing repository
            companyLogger.info(`Updating existing repository: ${repo.full_name}`)
            await db.repository.update({
              where: { id: existingRepo.id },
              data: repoData
            })
            updatedCount++
            companyLogger.info(`✅ Updated repository: ${repo.full_name}`)
          } else {
            // Create new repository
            companyLogger.info(`Creating new repository: ${repo.full_name}`)
            await db.repository.create({
              data: {
                githubRepoId: String(repo.id),
                companyId,
                ...repoData
              }
            })
            newCount++
            companyLogger.info(`✅ Created repository: ${repo.full_name}`)
          }

          // Fetch and store languages
          try {
            const { data: languages } = await octokit.rest.repos.listLanguages({
              owner: repo.owner.login,
              repo: repo.name
            })

            // Update repository with languages
            await db.repository.update({
              where: { githubRepoId: String(repo.id) },
              data: { languages }
            })
            companyLogger.info(`✅ Updated languages for: ${repo.full_name}`)
          } catch (languageError) {
            companyLogger.warn('Failed to fetch languages for repository', {
              repository: repo.full_name,
              error: languageError
            })
          }

        } catch (repoError) {
          companyLogger.error('❌ Failed to process repository', repoError, {
            repository: repo.full_name,
            errorMessage: repoError instanceof Error ? repoError.message : 'Unknown error',
            errorStack: repoError instanceof Error ? repoError.stack : undefined
          })
          // Continue with next repo instead of failing completely
        }
      }

      companyLogger.info('Organization repository sync completed', {
        totalRepositories: allRepos.length,
        newRepositories: newCount,
        updatedRepositories: updatedCount
      })

      return {
        repositories: allRepos.length,
        newRepositories: newCount,
        updatedRepositories: updatedCount
      }

    } catch (error) {
      companyLogger.error('Organization repository sync failed', error)
      throw new ExternalServiceError('GitHub', 'Failed to sync organization repositories')
    }
  }

  /**
   * Match employee contributions to organization repositories
   */
  async matchEmployeeContributions(employeeId: string): Promise<{
    matchedRepositories: number
    totalCommits: number
  }> {
    const employeeLogger = this.logger.withEmployee(employeeId)
    let matchedRepos = 0
    let totalCommits = 0

    try {
      // Get employee details
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
        include: {
          company: true,
          githubConnection: true
        }
      })

      if (!employee?.githubConnection?.githubUsername) {
        throw new NotFoundError('GitHub connection', employeeId)
      }

      const employeeClient = await this.getEmployeeClient(employeeId)
      const companyClient = await this.getCompanyClient(employee.companyId)

      // Get organization repositories
      const orgRepositories = await db.repository.findMany({
        where: { companyId: employee.companyId }
      })

      employeeLogger.info('Matching employee contributions', {
        githubUsername: employee.githubConnection.githubUsername,
        organizationRepositories: orgRepositories.length
      })

      // For each organization repository, check employee contributions
      for (const repo of orgRepositories) {
        try {
          const [owner, repoName] = repo.fullName.split('/')

          // Get commits by this employee
          const { data: commits } = await companyClient.rest.repos.listCommits({
            owner,
            repo: repoName,
            author: employee.githubConnection.githubUsername,
            per_page: 100
          })

          if (commits.length > 0) {
            matchedRepos++
            totalCommits += commits.length

            // Create employee-repository link
            await db.employeeRepository.upsert({
              where: {
                employeeId_repositoryId: {
                  employeeId,
                  repositoryId: repo.id
                }
              },
              update: {
                commitCount: commits.length,
                lastActivityAt: commits[0]?.commit.author?.date
                  ? new Date(commits[0].commit.author.date)
                  : new Date(),
                updatedAt: new Date()
              },
              create: {
                employeeId,
                repositoryId: repo.id,
                commitCount: commits.length,
                lastActivityAt: commits[0]?.commit.author?.date
                  ? new Date(commits[0].commit.author.date)
                  : new Date()
              }
            })

            employeeLogger.info('Matched employee to repository', {
              repository: repo.fullName,
              commits: commits.length
            })
          }

        } catch (repoError) {
          employeeLogger.warn('Failed to check contributions for repository', {
            repository: repo.fullName,
            error: repoError
          })
        }
      }

      employeeLogger.info('Employee contribution matching completed', {
        matchedRepositories: matchedRepos,
        totalCommits
      })

      return {
        matchedRepositories: matchedRepos,
        totalCommits
      }

    } catch (error) {
      employeeLogger.error('Employee contribution matching failed', error)
      throw new ExternalServiceError('GitHub', 'Failed to match employee contributions')
    }
  }

  /**
   * Install GitHub App for a company
   */
  async handleAppInstallation(installationId: number, companyId: string): Promise<void> {
    try {
      this.logger.info('Getting installation Octokit', { installationId, companyId })

      const installation = await this.app.getInstallationOctokit(installationId)

      this.logger.info('Installation Octokit retrieved', {
        hasRest: !!(installation as any)?.rest,
        hasApps: !!(installation as any)?.apps,
        installationType: typeof installation,
        installationKeys: installation ? Object.keys(installation).slice(0, 10) : []
      })

      if (!installation) {
        throw new Error(`Failed to get installation Octokit. Installation object: ${JSON.stringify({
          hasInstallation: !!installation,
          type: typeof installation
        })}`)
      }

      // The installation object from @octokit/app is already an Octokit instance
      // It should have the REST API methods directly
      if (typeof installation !== 'object' || !installation.request) {
        throw new Error(`Invalid installation Octokit. Expected Octokit instance, got: ${typeof installation}`)
      }

      // Get installation details using the app's octokit instance
      const { data: installationData } = await this.app.octokit.request('GET /app/installations/{installation_id}', {
        installation_id: installationId
      })

      // Validate account exists and has required properties
      if (!installationData.account) {
        throw new Error('Installation account data is missing')
      }

      // Type guard for account with login property (User or Organization, not Enterprise)
      const account = installationData.account as { login: string; id: number; type?: string }

      if (!account.login || !account.id) {
        throw new Error('Installation account missing required properties')
      }

      // Store installation data (convert to BigInt for database)
      await db.gitHubInstallation.upsert({
        where: { installationId: BigInt(installationId) },
        update: {
          companyId,
          accountLogin: account.login,
          accountId: BigInt(account.id),
          permissions: installationData.permissions,
          events: installationData.events,
          repositorySelection: installationData.repository_selection,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          installationId: BigInt(installationId),
          companyId,
          accountLogin: account.login,
          accountId: BigInt(account.id),
          accountType: account.type || 'Organization',
          permissions: installationData.permissions,
          events: installationData.events,
          repositorySelection: installationData.repository_selection,
          isActive: true
        }
      })

      // Generate and store installation access token using the app's octokit instance
      const { data: tokenData } = await this.app.octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installationId
      })

      await githubTokenManager.storeCompanyTokens(
        companyId,
        {
          accessToken: tokenData.token,
          expiresAt: new Date(tokenData.expires_at),
          tokenType: GitHubTokenType.APP_INSTALLATION,
          metadata: {
            installationId,
            permissions: tokenData.permissions
          }
        },
        account.login,
        BigInt(installationId) // Pass installationId as BigInt
      )

      this.logger.info('GitHub App installation completed', {
        companyId,
        installationId,
        organization: account.login
      })

    } catch (error) {
      this.logger.error('GitHub App installation failed', error, {
        companyId,
        installationId
      })
      throw new ExternalServiceError('GitHub', 'Failed to complete app installation')
    }
  }
}

export const enhancedGitHubService = new EnhancedGitHubService()
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
      const tokenData = await githubTokenManager.getCompanyTokens(
        companyId,
        GitHubTokenType.APP_INSTALLATION
      )

      if (!tokenData) {
        throw new AuthenticationError('No GitHub App installation found for company')
      }

      const octokit = new Octokit({
        auth: tokenData.accessToken,
        userAgent: `${config.app.name}/1.0.0`,
      })

      // Add rate limit handling
      octokit.hook.error('request', async (error, options) => {
        if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
          const resetTime = parseInt(error.response.headers['x-ratelimit-reset'] || '0') * 1000
          const retryAfter = Math.max(resetTime - Date.now(), 0)
          throw new RateLimitError('GitHub API', retryAfter)
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

      // Get all repositories accessible to the installation
      const { data: installationRepos } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100
      })

      companyLogger.info('Fetched organization repositories', {
        totalRepositories: installationRepos.total_count
      })

      // Process each repository
      for (const repo of installationRepos.repositories) {
        try {
          // Check if repository already exists
          const existingRepo = await db.repository.findUnique({
            where: { githubRepoId: String(repo.id) }
          })

          const repoData = {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            homepage: repo.homepage,
            defaultBranch: repo.default_branch,
            isPrivate: repo.private,
            isFork: repo.fork,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            size: repo.size,
            openIssues: repo.open_issues_count,
            primaryLanguage: repo.language,
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
            updatedAt: new Date()
          }

          if (existingRepo) {
            // Update existing repository
            await db.repository.update({
              where: { id: existingRepo.id },
              data: repoData
            })
            updatedCount++
          } else {
            // Find the company's employees to potentially link repositories
            const companyEmployees = await db.employee.findMany({
              where: { companyId }
            })

            // For now, we'll create unlinked repositories
            // Later, we'll match them to employees based on contributions
            await db.repository.create({
              data: {
                githubRepoId: String(repo.id),
                companyId, // Link to company instead of individual employee
                ...repoData
              }
            })
            newCount++
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
          } catch (languageError) {
            companyLogger.warn('Failed to fetch languages for repository', {
              repository: repo.full_name,
              error: languageError
            })
          }

        } catch (repoError) {
          companyLogger.error('Failed to process repository', repoError, {
            repository: repo.full_name
          })
        }
      }

      companyLogger.info('Organization repository sync completed', {
        totalRepositories: installationRepos.total_count,
        newRepositories: newCount,
        updatedRepositories: updatedCount
      })

      return {
        repositories: installationRepos.total_count,
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
          gitHubConnection: true
        }
      })

      if (!employee?.gitHubConnection?.githubUsername) {
        throw new NotFoundError('GitHub connection', employeeId)
      }

      const employeeClient = await this.getEmployeeClient(employeeId)
      const companyClient = await this.getCompanyClient(employee.companyId)

      // Get organization repositories
      const orgRepositories = await db.repository.findMany({
        where: { companyId: employee.companyId }
      })

      employeeLogger.info('Matching employee contributions', {
        githubUsername: employee.gitHubConnection.githubUsername,
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
            author: employee.gitHubConnection.githubUsername,
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
      const installation = await this.app.getInstallationOctokit(installationId)

      // Get installation details
      const { data: installationData } = await installation.rest.apps.getInstallation({
        installation_id: installationId
      })

      // Store installation data
      await db.gitHubInstallation.upsert({
        where: { installationId },
        update: {
          companyId,
          accountLogin: installationData.account.login,
          accountId: installationData.account.id,
          permissions: installationData.permissions,
          events: installationData.events,
          repositorySelection: installationData.repository_selection,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          installationId,
          companyId,
          accountLogin: installationData.account.login,
          accountId: installationData.account.id,
          accountType: installationData.account.type,
          permissions: installationData.permissions,
          events: installationData.events,
          repositorySelection: installationData.repository_selection,
          isActive: true
        }
      })

      // Generate and store installation access token
      const { data: tokenData } = await installation.rest.apps.createInstallationAccessToken({
        installation_id: installationId
      })

      await githubTokenManager.storeCompanyTokens(companyId, {
        accessToken: tokenData.token,
        expiresAt: new Date(tokenData.expires_at),
        tokenType: GitHubTokenType.APP_INSTALLATION,
        metadata: {
          installationId,
          permissions: tokenData.permissions
        }
      }, installationData.account.login)

      this.logger.info('GitHub App installation completed', {
        companyId,
        installationId,
        organization: installationData.account.login
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
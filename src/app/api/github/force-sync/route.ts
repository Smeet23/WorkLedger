import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { App } from '@octokit/app'
import { config } from '@/lib/config'
import { githubTokenManager, GitHubTokenType } from '@/lib/github-token-manager'
import { Octokit } from '@octokit/rest'

// POST /api/github/force-sync
// Forces token refresh and syncs repositories
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/force-sync')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can force sync')
  }

  logger.info('Force sync requested', { userId: session.user.id })

  // Get user's company
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyId = employee.company.id
  const companyLogger = logger.withCompany(companyId)

  try {
    // STEP 1: Get GitHub installation
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId, isActive: true }
    })

    if (!installation) {
      return apiResponse.error('No GitHub App installation found', 404)
    }

    const installationId = Number(installation.installationId)
    companyLogger.info('Found installation', { installationId })

    // STEP 2: Generate FRESH installation token
    companyLogger.info('Generating fresh installation token')

    const app = new App({
      appId: config.github.app.id,
      privateKey: config.github.app.privateKey,
    })

    const { data: tokenData } = await app.octokit.request(
      'POST /app/installations/{installation_id}/access_tokens',
      { installation_id: installationId }
    )

    companyLogger.info('Fresh token generated', {
      expiresAt: tokenData.expires_at,
      hasPermissions: !!tokenData.permissions
    })

    // STEP 3: Store the new token
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
      installation.accountLogin,
      installation.installationId
    )

    companyLogger.info('Token stored successfully')

    // STEP 4: Create Octokit with fresh token
    const octokit = new Octokit({
      auth: tokenData.token,
      userAgent: `${config.app.name}/1.0.0`,
    })

    // STEP 5: Fetch repositories from GitHub
    companyLogger.info('Fetching repositories from GitHub')

    const { data: reposData } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100
    })

    companyLogger.info('Repositories fetched from GitHub', {
      totalCount: reposData.total_count,
      fetchedCount: reposData.repositories.length
    })

    if (reposData.total_count === 0) {
      return apiResponse.error('No repositories accessible to this installation. Please configure repository access in GitHub App settings.', 400)
    }

    // STEP 6: Save repositories to database
    let newCount = 0
    let updatedCount = 0

    for (const repo of reposData.repositories) {
      try {
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
          githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
          lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
          updatedAt: new Date()
        }

        if (existingRepo) {
          await db.repository.update({
            where: { id: existingRepo.id },
            data: repoData
          })
          updatedCount++
        } else {
          await db.repository.create({
            data: {
              githubRepoId: String(repo.id),
              companyId,
              ...repoData
            }
          })
          newCount++
        }

        // Fetch languages
        try {
          const { data: languages } = await octokit.rest.repos.listLanguages({
            owner: repo.owner.login,
            repo: repo.name
          })

          await db.repository.update({
            where: { githubRepoId: String(repo.id) },
            data: { languages }
          })
        } catch (langError) {
          companyLogger.warn('Failed to fetch languages', {
            repo: repo.full_name,
            error: langError
          })
        }

      } catch (repoError) {
        companyLogger.error('Failed to process repository', repoError, {
          repo: repo.full_name
        })
      }
    }

    companyLogger.info('Repository sync completed', {
      total: reposData.total_count,
      new: newCount,
      updated: updatedCount
    })

    return apiResponse.success({
      success: true,
      repositories: reposData.total_count,
      newRepositories: newCount,
      updatedRepositories: updatedCount,
      tokenRefreshed: true,
      message: `Successfully synced ${reposData.total_count} repositories (${newCount} new, ${updatedCount} updated)`
    })

  } catch (error: any) {
    companyLogger.error('Force sync failed', error)
    return apiResponse.error(
      `Sync failed: ${error.message}`,
      500,
      { error: error.message, stack: error.stack }
    )
  }
})

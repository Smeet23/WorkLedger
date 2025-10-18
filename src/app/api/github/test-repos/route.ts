import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

// GET /api/github/test-repos
// Test endpoint to verify GitHub API connection and fetch repositories
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/test-repos')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can test repository sync')
  }

  logger.info('Testing GitHub repository fetch', { userId: session.user.id })

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
    // Check if GitHub App is installed
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId, isActive: true }
    })

    if (!installation) {
      return apiResponse.notFound('GitHub App installation')
    }

    companyLogger.info('Testing GitHub API connection', {
      installationId: installation.installationId.toString()
    })

    // Get company client (this uses the installation token)
    const octokit = await enhancedGitHubService.getCompanyClient(companyId)

    companyLogger.info('Got Octokit client, fetching repositories...')

    // Try to fetch repositories from GitHub
    const { data: installationRepos } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 10
    })

    companyLogger.info('Successfully fetched repositories from GitHub', {
      totalCount: installationRepos.total_count,
      repositoriesReturned: installationRepos.repositories.length
    })

    // Return detailed information
    return apiResponse.success({
      success: true,
      installation: {
        id: installation.installationId.toString(),
        accountLogin: installation.accountLogin,
        accountType: installation.accountType
      },
      github: {
        totalRepositories: installationRepos.total_count,
        fetchedCount: installationRepos.repositories.length,
        repositories: installationRepos.repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          url: repo.html_url
        }))
      },
      database: {
        currentRepoCount: await db.repository.count({ where: { companyId } })
      },
      message: 'GitHub API connection is working! Found repositories from your organization.'
    })

  } catch (error: any) {
    companyLogger.error('GitHub API test failed', error)

    return apiResponse.error(error, {
      operation: 'test-repos',
      companyId: companyId
    })
  }
})

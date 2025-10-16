import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

// POST /api/github/sync-all-repositories
// Syncs all repositories from GitHub for a company
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/sync-all-repositories')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  const body = await request.json()
  const { companyId } = body

  if (!companyId) {
    throw new ValidationError('companyId is required')
  }

  logger.info('Syncing all repositories', { userId: session.user.id, companyId })

  // Verify user belongs to this company and has admin role
  const employee = await db.employee.findFirst({
    where: {
      email: session.user.email,
      companyId: companyId
    }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  // Check if user is admin
  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can sync repositories')
  }

  try {
    // Check if GitHub App is installed
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId, isActive: true }
    })

    if (!installation) {
      throw new NotFoundError('GitHub App installation', companyId)
    }

    logger.info('Starting repository sync', {
      companyId,
      installationId: installation.installationId.toString()
    })

    // Sync organization repositories
    const syncResult = await enhancedGitHubService.syncOrganizationRepositories(companyId)

    logger.info('Repository sync completed successfully', {
      companyId,
      ...syncResult
    })

    return apiResponse.success({
      repositories: syncResult.repositories,
      newRepositories: syncResult.newRepositories,
      updatedRepositories: syncResult.updatedRepositories,
      message: `Synced ${syncResult.repositories} repositories (${syncResult.newRepositories} new, ${syncResult.updatedRepositories} updated)`
    })
  } catch (error) {
    logger.error('Failed to sync repositories', error, { companyId })
    throw error
  }
})

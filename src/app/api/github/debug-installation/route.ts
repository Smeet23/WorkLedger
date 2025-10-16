import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'

// GET /api/github/debug-installation
// Debug endpoint to check installation and token status
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/debug-installation')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  logger.info('Debugging GitHub installation', { userId: session.user.id })

  // Get user's company
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyId = employee.company.id

  try {
    // Check GitHub installation
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId, isActive: true }
    })

    // Check GitHub integration (old table)
    const integration = await db.gitHubIntegration.findFirst({
      where: { companyId }
    })

    // Check for any tokens in GitHubConnection table
    const connections = await db.gitHubConnection.findMany({
      where: {
        employee: {
          companyId: companyId
        }
      }
    })

    // Check repositories
    const repositories = await db.repository.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        fullName: true,
        githubRepoId: true,
        createdAt: true
      },
      take: 10
    })

    return apiResponse.success({
      companyId,
      installation: installation ? {
        id: installation.id,
        installationId: installation.installationId.toString(),
        accountLogin: installation.accountLogin,
        accountType: installation.accountType,
        isActive: installation.isActive,
        installedAt: installation.installedAt,
        permissions: installation.permissions,
        events: installation.events
      } : null,
      integration: integration ? {
        id: integration.id,
        organizationName: integration.organizationName,
        hasAccessToken: !!integration.accessToken
      } : null,
      connections: {
        count: connections.length,
        items: connections.map(c => ({
          employeeId: c.employeeId,
          githubUsername: c.githubUsername,
          hasAccessToken: !!c.accessToken,
          hasRefreshToken: !!c.refreshToken
        }))
      },
      repositories: {
        count: repositories.length,
        items: repositories
      }
    })

  } catch (error: any) {
    logger.error('Debug failed', error)
    throw error
  }
})

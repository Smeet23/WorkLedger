import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitLabService } from '@/services/gitlab/client'
import { db } from '@/lib/db'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

/**
 * GET /api/gitlab/status
 * Get GitLab connection status for current user
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return apiResponse.unauthorized('Authentication required')
    }

    // Find employee
    const employee = await db.employee.findUnique({
      where: { email: session.user.email || '' },
    })

    if (!employee) {
      return apiResponse.notFound('Employee')
    }

    // Get GitLab connection
    const connection = await GitLabService.getConnection(employee.id)

    if (!connection) {
      return apiResponse.success({
        connected: false,
        integration: null,
      })
    }

    // Try to fetch user info to verify token is still valid
    try {
      const gitlabService = new GitLabService(connection.accessToken)
      const gitlabUser = await gitlabService.getAuthenticatedUser()

      // Get skill count
      const skillCount = await db.skillRecord.count({
        where: {
          employeeId: employee.id,
          source: 'gitlab',
        },
      })

      return apiResponse.success({
        connected: true,
        integration: {
          id: connection.id,
          type: connection.type,
          isActive: connection.isActive,
          lastSync: connection.lastSync,
          config: connection.config,
          user: {
            id: gitlabUser.id,
            username: gitlabUser.username,
            name: gitlabUser.name,
            email: gitlabUser.email,
            avatarUrl: gitlabUser.avatar_url,
          },
          stats: {
            skillsDetected: skillCount,
          },
        },
      })
    } catch (error) {
      // Token might be invalid
      logger.warn('GitLab token validation failed', {
        employeeId: employee.id,
        error,
      })

      return apiResponse.success({
        connected: true,
        integration: {
          id: connection.id,
          type: connection.type,
          isActive: false,
          lastSync: connection.lastSync,
          tokenValid: false,
        },
      })
    }
  } catch (error) {
    logger.error('GitLab status check failed', error)
    return apiResponse.error(error)
  }
}

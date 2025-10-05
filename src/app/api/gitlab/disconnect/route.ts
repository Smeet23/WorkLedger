import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitLabService } from '@/services/gitlab/client'
import { db } from '@/lib/db'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const apiResponse = createApiResponse()

/**
 * POST /api/gitlab/disconnect
 * Disconnect GitLab integration for current user
 */
export async function POST(request: Request) {
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
      return apiResponse.badRequest('GitLab is not connected')
    }

    // Deactivate the integration (don't delete to preserve historical data)
    await db.integration.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    logger.info('GitLab integration disconnected', {
      employeeId: employee.id,
      integrationId: connection.id,
    })

    return apiResponse.success({
      message: 'GitLab integration disconnected successfully',
    })
  } catch (error) {
    logger.error('GitLab disconnect failed', error)
    return apiResponse.error(error)
  }
}

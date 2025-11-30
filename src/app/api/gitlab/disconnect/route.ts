import { GitLabService } from '@/services/gitlab/client'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const apiResponse = createApiResponse()

export const POST = withAuth(async (request, { employee }) => {
  try {
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

    return apiResponse.success(
      { disconnected: true },
      'GitLab integration disconnected successfully'
    )
  } catch (error) {
    logger.error('GitLab disconnect failed', error)
    return apiResponse.internalError('Failed to disconnect GitLab')
  }
})

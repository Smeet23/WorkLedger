import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

export const POST = withAuth(async (request, { employee }) => {
  try {
    // Check if connected
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId: employee.id }
    })

    if (!connection) {
      return apiResponse.notFound('GitHub connection')
    }

    // Soft delete the connection (mark as inactive)
    await db.gitHubConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Clear GitHub info from employee
    await db.employee.update({
      where: { id: employee.id },
      data: {
        githubUsername: null,
        githubId: null
      }
    })

    return apiResponse.success(
      { disconnected: true },
      'Successfully disconnected from GitHub'
    )
  } catch (error) {
    console.error('GitHub disconnect error:', error)
    return apiResponse.internalError('Failed to disconnect GitHub')
  }
})

import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withAuth(async (request, { employee }) => {
  try {
    // Check GitHub connection
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId: employee.id },
      select: {
        id: true,
        githubUsername: true,
        isActive: true,
        lastSync: true,
        connectedAt: true
      }
    })

    if (!connection || !connection.isActive) {
      return apiResponse.success({
        connected: false,
        connection: null
      })
    }

    // Get repository count (via employee-repository junction)
    const repositoryCount = await db.employeeRepository.count({
      where: { employeeId: employee.id }
    })

    // Get skill count from GitHub
    const skillRecords = await db.skillRecord.count({
      where: {
        employeeId: employee.id,
        source: 'github'
      }
    })

    return apiResponse.success({
      connected: true,
      connection: {
        ...connection,
        repositoryCount,
        skillCount: skillRecords
      }
    })
  } catch (error) {
    console.error('GitHub status error:', error)
    return apiResponse.internalError('Failed to get GitHub status')
  }
})

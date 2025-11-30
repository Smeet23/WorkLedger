import { JiraService } from '@/services/jira/client'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

export const POST = withAuth(async (request, { companyId }) => {
  try {
    // Disconnect integration
    await JiraService.disconnectIntegration(companyId)

    console.log('Jira integration disconnected for company:', companyId)

    return apiResponse.success(
      { disconnected: true },
      'Jira integration disconnected successfully'
    )
  } catch (error) {
    console.error('Error disconnecting Jira:', error)
    return apiResponse.internalError('Failed to disconnect Jira')
  }
})

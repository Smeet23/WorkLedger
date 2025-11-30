import { SlackService } from '@/services/slack/client'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

export const POST = withAuth(async (request, { companyId }) => {
  try {
    // Disconnect integration
    await SlackService.disconnectIntegration(companyId)

    console.log('Slack integration disconnected for company:', companyId)

    return apiResponse.success(
      { disconnected: true },
      'Slack integration disconnected successfully'
    )
  } catch (error) {
    console.error('Error disconnecting Slack:', error)
    return apiResponse.internalError('Failed to disconnect Slack')
  }
})

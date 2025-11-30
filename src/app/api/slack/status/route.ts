import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withAuth(async (request, { companyId }) => {
  try {
    // Get Slack integration
    const integration = await db.slackIntegration.findFirst({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        workspace: true,
      },
    })

    if (!integration) {
      return apiResponse.success({
        connected: false,
        workspace: null,
        lastSync: null,
      })
    }

    // Get stats
    const [userCount, channelCount, messageCount] = await Promise.all([
      db.slackUser.count({
        where: {
          companyId,
          isDeleted: false,
        },
      }),
      db.slackChannel.count({
        where: {
          companyId,
          isArchived: false,
        },
      }),
      db.slackMessage.count({
        where: {
          companyId,
        },
      }),
    ])

    return apiResponse.success({
      connected: true,
      workspace: {
        teamId: integration.teamId,
        teamName: integration.teamName,
        teamDomain: integration.teamDomain,
        icon: integration.workspace?.teamIcon,
      },
      stats: {
        users: userCount,
        channels: channelCount,
        messages: messageCount,
      },
      lastSync: integration.lastSync,
      createdAt: integration.createdAt,
    })
  } catch (error) {
    console.error('Error checking Slack status:', error)
    return apiResponse.internalError('Failed to check Slack status')
  }
})

import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withAuth(async (request, { companyId }) => {
  try {
    // Get Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return apiResponse.success({
        connected: false,
        site: null,
        lastSync: null,
      })
    }

    // Get stats
    const [projectCount, userCount, issueCount] = await Promise.all([
      db.jiraProject.count({
        where: {
          companyId,
          isArchived: false,
        },
      }),
      db.jiraUser.count({
        where: {
          companyId,
          isActive: true,
        },
      }),
      db.jiraIssue.count({
        where: {
          companyId,
        },
      }),
    ])

    // Get completed issues count
    const completedIssues = await db.jiraIssue.count({
      where: {
        companyId,
        statusCategory: 'done',
      },
    })

    return apiResponse.success({
      connected: true,
      site: {
        cloudId: integration.cloudId,
        name: integration.siteName,
        url: integration.siteUrl,
      },
      stats: {
        projects: projectCount,
        users: userCount,
        issues: issueCount,
        completedIssues,
      },
      lastSync: integration.lastSync,
      createdAt: integration.createdAt,
    })
  } catch (error) {
    console.error('Error checking Jira status:', error)
    return apiResponse.internalError('Failed to check Jira status')
  }
})

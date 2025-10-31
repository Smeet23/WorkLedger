/**
 * Jira Connection Status Route
 * Returns the current Jira integration status for a company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json({
        connected: false,
        site: null,
        lastSync: null,
      })
    }

    // Get stats
    const [projectCount, userCount, issueCount] = await Promise.all([
      db.jiraProject.count({
        where: {
          companyId: user.companyId,
          isArchived: false,
        },
      }),
      db.jiraUser.count({
        where: {
          companyId: user.companyId,
          isActive: true,
        },
      }),
      db.jiraIssue.count({
        where: {
          companyId: user.companyId,
        },
      }),
    ])

    // Get completed issues count
    const completedIssues = await db.jiraIssue.count({
      where: {
        companyId: user.companyId,
        statusCategory: 'done',
      },
    })

    return NextResponse.json({
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
    console.error('❌ Error checking Jira status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check Jira status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

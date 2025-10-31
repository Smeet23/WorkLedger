/**
 * Slack Connection Status Route
 * Returns the current Slack integration status for a company
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

    // Get Slack integration
    const integration = await db.slackIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        workspace: true,
      },
    })

    if (!integration) {
      return NextResponse.json({
        connected: false,
        workspace: null,
        lastSync: null,
      })
    }

    // Get stats
    const [userCount, channelCount, messageCount] = await Promise.all([
      db.slackUser.count({
        where: {
          companyId: user.companyId,
          isDeleted: false,
        },
      }),
      db.slackChannel.count({
        where: {
          companyId: user.companyId,
          isArchived: false,
        },
      }),
      db.slackMessage.count({
        where: {
          companyId: user.companyId,
        },
      }),
    ])

    return NextResponse.json({
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
    console.error('❌ Error checking Slack status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check Slack status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

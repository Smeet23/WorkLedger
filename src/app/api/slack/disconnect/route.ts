/**
 * Slack Disconnect Route
 * Disconnects Slack integration for a company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { SlackService } from '@/services/slack/client'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
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

    // Disconnect integration
    await SlackService.disconnectIntegration(user.companyId)

    console.log('✅ Slack integration disconnected for company:', user.companyId)

    return NextResponse.json({
      success: true,
      message: 'Slack integration disconnected successfully',
    })
  } catch (error) {
    console.error('❌ Error disconnecting Slack:', error)
    return NextResponse.json(
      {
        error: 'Failed to disconnect Slack',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

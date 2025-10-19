/**
 * Slack OAuth Connect Route
 * Initiates the OAuth flow by redirecting to Slack authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { SlackService } from '@/services/slack/client'
import { db } from '@/lib/db'

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
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const companyId = user.companyId

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        companyId,
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64')

    // Get Slack OAuth URL
    const oauthUrl = SlackService.getOAuthUrl(state)

    console.log('🔗 Redirecting to Slack OAuth:', oauthUrl)

    // Redirect to Slack authorization page
    return NextResponse.redirect(oauthUrl)
  } catch (error) {
    console.error('❌ Error initiating Slack OAuth:', error)
    return NextResponse.json(
      {
        error: 'Failed to connect to Slack',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

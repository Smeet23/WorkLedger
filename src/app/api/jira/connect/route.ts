/**
 * Jira OAuth Connect Route
 * Initiates the OAuth flow by redirecting to Atlassian authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { JiraService } from '@/services/jira/client'
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

    // Get Jira OAuth URL
    const oauthUrl = JiraService.getOAuthUrl(state)

    console.log('🔗 Redirecting to Jira OAuth:', oauthUrl)

    // Redirect to Atlassian authorization page
    return NextResponse.redirect(oauthUrl)
  } catch (error) {
    console.error('❌ Error initiating Jira OAuth:', error)
    return NextResponse.json(
      {
        error: 'Failed to connect to Jira',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

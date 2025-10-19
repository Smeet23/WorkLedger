/**
 * Slack OAuth Callback Route
 * Handles the OAuth callback from Slack after user authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { SlackService } from '@/services/slack/client'
import { SlackSyncService } from '@/services/slack/sync'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('❌ Slack OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?slack_error=${encodeURIComponent(error)}`
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Decode and validate state
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    const { companyId, userId, timestamp } = stateData

    // Validate state timestamp (prevent replay attacks - 10 min expiry)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.json(
        { error: 'State expired - please try again' },
        { status: 400 }
      )
    }

    console.log('🔄 Exchanging code for token...')

    // Exchange code for access token
    const tokenData = await SlackService.exchangeCodeForToken(code)

    console.log('✅ Token received for team:', tokenData.team.name)

    // Save integration to database
    const integration = await SlackService.saveIntegration(
      companyId,
      tokenData
    )

    console.log('✅ Integration saved:', integration.id)

    // Start background sync
    console.log('🔄 Starting initial sync...')
    const slackService = new SlackService(tokenData.access_token)
    const syncService = new SlackSyncService(slackService, companyId)

    // Run sync in background (don't await)
    syncService.fullSync().catch((error) => {
      console.error('❌ Error during background sync:', error)
    })

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?slack_connected=true&team=${encodeURIComponent(tokenData.team.name)}`
    )
  } catch (error) {
    console.error('❌ Error in Slack OAuth callback:', error)

    // Redirect to dashboard with error
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?slack_error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`
    )
  }
}

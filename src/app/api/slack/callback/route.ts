/**
 * Slack OAuth Callback Route
 * Handles the OAuth callback from Slack after user authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { SlackService } from '@/services/slack/client'
import { SlackSyncService } from '@/services/slack/sync'
import { slackOAuthStateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('❌ Slack OAuth error:', error)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url
      return NextResponse.redirect(
        new URL(`/dashboard?slack_error=${encodeURIComponent(error)}`, baseUrl)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Decode and validate state with Zod
    let stateData
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
      stateData = slackOAuthStateSchema.parse(decodedState)
    } catch (parseError) {
      if (parseError instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid state parameter', details: parseError.errors },
          { status: 400 }
        )
      }
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
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url
    return NextResponse.redirect(
      new URL(`/dashboard?slack_connected=true&team=${encodeURIComponent(tokenData.team.name)}`, baseUrl)
    )
  } catch (error) {
    console.error('❌ Error in Slack OAuth callback:', error)

    // Redirect to dashboard with error
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url
    return NextResponse.redirect(
      new URL(`/dashboard?slack_error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`, baseUrl)
    )
  }
}

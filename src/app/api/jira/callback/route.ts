/**
 * Jira OAuth Callback Route
 * Handles the OAuth callback from Atlassian
 */

import { NextRequest, NextResponse } from 'next/server'
import { JiraService } from '@/services/jira/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${error}`, baseUrl)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=missing_params', baseUrl)
      )
    }

    // Verify state token
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { companyId, userId, timestamp } = stateData

    // Check if state is expired (5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=state_expired', baseUrl)
      )
    }

    console.log('📥 Jira OAuth callback received')
    console.log('Company ID:', companyId)

    // Exchange code for tokens
    const tokenData = await JiraService.exchangeCodeForToken(code)

    console.log('✅ Tokens received')

    // Get accessible resources (Jira sites)
    const resources = await JiraService.getAccessibleResources(tokenData.access_token)

    if (resources.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_jira_sites', baseUrl)
      )
    }

    // Use the first site (or let user choose if multiple)
    const site = resources[0]
    console.log('📍 Jira site:', site.name)

    // Get current user info
    const jiraService = new JiraService(tokenData.access_token, site.id)
    const currentUser = await jiraService.getCurrentUser()

    // Store integration
    await JiraService.storeIntegration({
      companyId,
      cloudId: site.id,
      siteUrl: site.url,
      siteName: site.name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      accountId: currentUser.accountId,
      accountEmail: currentUser.emailAddress,
    })

    console.log('✅ Jira integration stored')

    // Auto-register webhook for real-time updates
    try {
      const webhookUrl = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/api/jira/webhooks`

      const webhook = await jiraService.registerWebhook({
        url: webhookUrl,
        events: [
          'jira:issue_created',
          'jira:issue_updated',
          'jira:issue_deleted',
        ],
        jqlFilter: 'project IS NOT EMPTY', // Required for OAuth 2.0 webhooks
      })

      console.log('✅ Webhook auto-registered:', webhook)
    } catch (webhookError) {
      // Don't fail the whole flow if webhook registration fails
      console.warn('⚠️  Webhook registration failed (non-critical):', webhookError)
    }

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL('/dashboard/integrations/jira?success=true', baseUrl)
    )
  } catch (error) {
    console.error('❌ Error in Jira OAuth callback:', error)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'callback_failed'
        )}`,
        baseUrl
      )
    )
  }
}

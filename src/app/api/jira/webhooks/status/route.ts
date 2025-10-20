/**
 * Jira Webhook Status Route (No Auth Required)
 * Check webhook registration status
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all Jira integrations
    const integrations = await db.jiraIntegration.findMany({
      where: { isActive: true },
      select: {
        id: true,
        siteName: true,
        siteUrl: true,
        companyId: true,
      },
    })

    if (integrations.length === 0) {
      return NextResponse.json({
        status: 'no_integrations',
        message: 'No active Jira integrations found',
      })
    }

    // Get webhook events (incoming webhooks from Jira)
    const webhookEvents = await db.jiraWebhook.findMany({
      where: {
        companyId: {
          in: integrations.map((i) => i.companyId),
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      status: 'ok',
      integrations: integrations.map((i) => ({
        siteName: i.siteName,
        siteUrl: i.siteUrl,
      })),
      webhookEventsReceived: webhookEvents.length,
      webhookUrl: `${process.env.NEXTAUTH_URL || process.env.APP_URL}/api/jira/webhooks`,
      recentEvents: webhookEvents.map((w) => ({
        eventType: w.eventType,
        issueKey: w.issueKey,
        processed: w.processed,
        receivedAt: w.receivedAt,
        errorMessage: w.errorMessage,
      })),
      message: webhookEvents.length === 0
        ? 'No webhook events received yet. Webhooks may not be registered or Jira is not sending events.'
        : `Received ${webhookEvents.length} webhook events`,
    })
  } catch (error) {
    console.error('❌ Error checking webhook status:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

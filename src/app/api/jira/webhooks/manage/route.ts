/**
 * Jira Webhook Management Route
 * Register, list, refresh, and delete webhooks programmatically
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { db } from '@/lib/db'
import { JiraService } from '@/services/jira/client'

/**
 * GET - List all registered webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Jira integration found' },
        { status: 404 }
      )
    }

    // Decrypt token and create service
    const accessToken = JiraService.decrypt(integration.encryptedAccessToken)
    const jiraService = new JiraService(accessToken, integration.cloudId)

    // List webhooks
    const webhooks = await jiraService.listWebhooks()

    return NextResponse.json({
      webhooks,
      count: webhooks.length,
      limit: 5, // OAuth apps limited to 5 webhooks
    })
  } catch (error) {
    console.error('❌ Error listing webhooks:', error)
    return NextResponse.json(
      {
        error: 'Failed to list webhooks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Jira integration found' },
        { status: 404 }
      )
    }

    // Decrypt token and create service
    const accessToken = JiraService.decrypt(integration.encryptedAccessToken)
    const jiraService = new JiraService(accessToken, integration.cloudId)

    // Get webhook URL from environment
    const webhookUrl = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/api/jira/webhooks`

    // Register webhook for all supported events
    // Note: OAuth 2.0 webhooks require a JQL filter, so we use one that matches all issues
    const webhook = await jiraService.registerWebhook({
      url: webhookUrl,
      events: [
        'jira:issue_created',
        'jira:issue_updated',
        'jira:issue_deleted',
      ],
      jqlFilter: 'project IS NOT EMPTY', // Matches all issues in any project
    })

    console.log('✅ Webhook registered with Jira')
    console.log('ℹ️  Full webhook response:', webhook)

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        url: webhookUrl,
        events: [
          'jira:issue_created',
          'jira:issue_updated',
          'jira:issue_deleted',
        ],
        message: webhook.createdWebhookIds
          ? `Successfully registered ${webhook.createdWebhookIds.length} webhook(s)`
          : 'Webhook registered successfully',
      },
    })
  } catch (error) {
    console.error('❌ Error registering webhook:', error)
    return NextResponse.json(
      {
        error: 'Failed to register webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT - Refresh a webhook (extend expiration by 30 days)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { webhookId } = body

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhookId is required' },
        { status: 400 }
      )
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Jira integration found' },
        { status: 404 }
      )
    }

    // Decrypt token and create service
    const accessToken = JiraService.decrypt(integration.encryptedAccessToken)
    const jiraService = new JiraService(accessToken, integration.cloudId)

    // Refresh webhook
    const refreshed = await jiraService.refreshWebhook(webhookId)

    console.log('✅ Webhook refreshed (ID: ' + refreshed.id + ')')

    return NextResponse.json({
      success: true,
      webhook: {
        id: refreshed.id,
        expiresAt: new Date(refreshed.expirationDate).toISOString(),
        daysUntilExpiration: Math.floor(
          (refreshed.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
    })
  } catch (error) {
    console.error('❌ Error refreshing webhook:', error)
    return NextResponse.json(
      {
        error: 'Failed to refresh webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const webhookId = searchParams.get('webhookId')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhookId is required' },
        { status: 400 }
      )
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active Jira integration
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Jira integration found' },
        { status: 404 }
      )
    }

    // Decrypt token and create service
    const accessToken = JiraService.decrypt(integration.encryptedAccessToken)
    const jiraService = new JiraService(accessToken, integration.cloudId)

    // Delete webhook from Jira
    await jiraService.deleteWebhook(parseInt(webhookId))

    console.log('✅ Webhook deleted (ID: ' + webhookId + ')')

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting webhook:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

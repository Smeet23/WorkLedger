/**
 * Slack Webhooks Route
 * Receives real-time events from Slack (Event Subscriptions API)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle URL verification challenge (required by Slack)
    if (body.type === 'url_verification') {
      console.log('✅ Slack webhook URL verification')
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle event callbacks
    if (body.type === 'event_callback') {
      const event = body.event
      const teamId = body.team_id

      console.log('📥 Received Slack event:', event.type)

      // Find company by team ID
      const integration = await db.slackIntegration.findUnique({
        where: { teamId },
      })

      if (!integration) {
        console.warn('⚠️  No integration found for team:', teamId)
        return NextResponse.json({ ok: true }) // Return 200 to acknowledge
      }

      // Store webhook for processing
      await db.slackWebhook.create({
        data: {
          companyId: integration.companyId,
          eventType: event.type,
          eventSubtype: event.subtype,
          payload: body,
          slackEventId: body.event_id,
          processed: false,
        },
      })

      // Process event based on type
      try {
        await processSlackEvent(event, integration.companyId)
      } catch (error) {
        console.error('❌ Error processing event:', error)
        // Don't throw - we already stored it for retry
      }

      return NextResponse.json({ ok: true })
    }

    // Unknown event type
    console.warn('⚠️  Unknown Slack event type:', body.type)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error handling Slack webhook:', error)

    // Always return 200 to Slack to avoid retries
    return NextResponse.json({ ok: true })
  }
}

/**
 * Process different Slack event types
 */
async function processSlackEvent(event: any, companyId: string) {
  switch (event.type) {
    case 'message':
      await handleMessageEvent(event, companyId)
      break

    case 'user_change':
      await handleUserChangeEvent(event, companyId)
      break

    case 'channel_created':
    case 'channel_rename':
    case 'channel_archive':
    case 'channel_unarchive':
      await handleChannelEvent(event, companyId)
      break

    case 'team_join':
      await handleTeamJoinEvent(event, companyId)
      break

    default:
      console.log('ℹ️  Unhandled event type:', event.type)
  }
}

/**
 * Handle message events - store full content for analysis
 */
async function handleMessageEvent(event: any, companyId: string) {
  try {
    // Skip bot messages, message changes, and empty messages
    if (event.subtype || !event.user || !event.text) {
      return
    }

    const channelId = event.channel
    const userId = event.user
    const timestamp = new Date(parseFloat(event.ts) * 1000)

    // Find channel in DB
    const channel = await db.slackChannel.findUnique({
      where: {
        companyId_slackChannelId: {
          companyId,
          slackChannelId: channelId,
        },
      },
    })

    if (!channel) {
      console.warn('⚠️  Channel not found:', channelId)
      return
    }

    // Find user in DB
    const slackUser = await db.slackUser.findUnique({
      where: {
        companyId_slackUserId: {
          companyId,
          slackUserId: userId,
        },
      },
    })

    if (!slackUser) {
      console.warn('⚠️  User not found:', userId)
      return
    }

    // Extract date and hour for aggregation
    const date = new Date(timestamp)
    date.setHours(0, 0, 0, 0)
    const hour = timestamp.getHours()

    // Extract mentions and links
    const mentions = extractMentions(event.text)
    const links = extractLinks(event.text)

    // Store individual message
    await db.slackMessage.upsert({
      where: {
        messageTs: event.ts,
      },
      create: {
        companyId,
        employeeId: slackUser.employeeId,
        slackUserId: slackUser.id,
        channelId: channel.id,
        messageTs: event.ts,
        messageType: event.type || 'message',
        text: event.text,
        threadTs: event.thread_ts || null,
        isThreadReply: !!event.thread_ts,
        timestamp: timestamp,
        date: date,
        hour: hour,
        mentions: mentions.length > 0 ? mentions : null,
        reactions: event.reactions || null,
        attachments: event.files || null,
        links: links.length > 0 ? links : null,
        mentionCount: mentions.length,
        reactionCount: event.reactions?.length || 0,
        linkCount: links.length,
        fileCount: event.files?.length || 0,
      },
      update: {
        text: event.text,
        reactions: event.reactions || null,
        reactionCount: event.reactions?.length || 0,
        updatedAt: new Date(),
      },
    })

    // Update user's last activity
    await db.slackUser.update({
      where: { id: slackUser.id },
      data: {
        lastActivityAt: timestamp,
        totalMessages: {
          increment: 1,
        },
      },
    })

    // Update channel's last activity
    await db.slackChannel.update({
      where: { id: channel.id },
      data: {
        lastActivityAt: timestamp,
        messageCount: {
          increment: 1,
        },
      },
    })

    console.log('✅ Message event processed and stored')
  } catch (error) {
    console.error('❌ Error handling message event:', error)
    throw error
  }
}

/**
 * Handle user change events
 */
async function handleUserChangeEvent(event: any, companyId: string) {
  try {
    const user = event.user

    await db.slackUser.update({
      where: {
        companyId_slackUserId: {
          companyId,
          slackUserId: user.id,
        },
      },
      data: {
        slackUsername: user.name,
        realName: user.real_name,
        displayName: user.profile?.display_name,
        email: user.profile?.email,
        title: user.profile?.title,
        avatarUrl: user.profile?.image_192,
        statusText: user.profile?.status_text,
        statusEmoji: user.profile?.status_emoji,
        isDeleted: user.deleted,
        updatedAt: new Date(),
      },
    })

    console.log('✅ User change event processed')
  } catch (error) {
    console.error('❌ Error handling user change event:', error)
  }
}

/**
 * Handle channel events
 */
async function handleChannelEvent(event: any, companyId: string) {
  try {
    const channel = event.channel

    await db.slackChannel.upsert({
      where: {
        companyId_slackChannelId: {
          companyId,
          slackChannelId: channel.id,
        },
      },
      create: {
        companyId,
        slackChannelId: channel.id,
        name: channel.name,
        nameNormalized: channel.name_normalized,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        isPrivate: channel.is_private || false,
        isArchived: channel.is_archived || false,
        isGeneral: channel.is_general || false,
        memberCount: channel.num_members || 0,
        creatorId: channel.creator,
      },
      update: {
        name: channel.name,
        nameNormalized: channel.name_normalized,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        isArchived: channel.is_archived || false,
        updatedAt: new Date(),
      },
    })

    console.log('✅ Channel event processed')
  } catch (error) {
    console.error('❌ Error handling channel event:', error)
  }
}

/**
 * Handle team join events
 */
async function handleTeamJoinEvent(event: any, companyId: string) {
  try {
    const user = event.user

    // Try to match with existing employee
    let employeeId: string | null = null
    let matchConfidence = 0
    let matchMethod = null

    if (user.profile?.email) {
      const employee = await db.employee.findFirst({
        where: {
          companyId,
          email: user.profile.email,
        },
      })

      if (employee) {
        employeeId = employee.id
        matchConfidence = 1.0
        matchMethod = 'email'
      }
    }

    await db.slackUser.create({
      data: {
        companyId,
        employeeId,
        slackUserId: user.id,
        slackUsername: user.name,
        realName: user.real_name,
        displayName: user.profile?.display_name,
        email: user.profile?.email,
        title: user.profile?.title,
        avatarUrl: user.profile?.image_192,
        isBot: user.is_bot || false,
        isAdmin: user.is_admin || false,
        isOwner: user.is_owner || false,
        timezone: user.tz,
        timezoneOffset: user.tz_offset,
        matchConfidence,
        matchMethod,
      },
    })

    console.log('✅ Team join event processed')
  } catch (error) {
    console.error('❌ Error handling team join event:', error)
  }
}

/**
 * Extract mentioned user IDs from message text
 */
function extractMentions(text: string): string[] {
  const mentionPattern = /<@([A-Z0-9]+)>/g
  const mentions: string[] = []
  let match

  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

/**
 * Extract links from message text
 */
function extractLinks(text: string): string[] {
  const linkPattern = /<(https?:\/\/[^>|]+)(?:\|[^>]+)?>/g
  const plainLinkPattern = /(https?:\/\/[^\s]+)/g
  const links: string[] = []
  let match

  // Extract Slack-formatted links
  while ((match = linkPattern.exec(text)) !== null) {
    links.push(match[1])
  }

  // Extract plain URLs
  while ((match = plainLinkPattern.exec(text)) !== null) {
    if (!links.includes(match[1])) {
      links.push(match[1])
    }
  }

  return links
}

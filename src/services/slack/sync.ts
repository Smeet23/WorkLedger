/**
 * Slack Sync Service
 * Handles syncing workspace data (users, channels, messages)
 * NOW STORES: Full message content for AI-powered conversation analysis
 */

import { db } from '@/lib/db'
import { SlackService } from './client'

export class SlackSyncService {
  private slackService: SlackService
  private companyId: string

  constructor(slackService: SlackService, companyId: string) {
    this.slackService = slackService
    this.companyId = companyId
  }

  /**
   * Full sync - workspace, users, channels, and recent messages
   */
  async fullSync() {
    console.log('🔄 Starting full Slack sync for company:', this.companyId)

    try {
      // Sync in order: workspace → users → channels → messages
      await this.syncWorkspace()
      await this.syncUsers()
      await this.syncChannels()
      await this.syncRecentMessages()

      // Update last sync time
      await db.slackIntegration.updateMany({
        where: {
          companyId: this.companyId,
          isActive: true,
        },
        data: {
          lastSync: new Date(),
        },
      })

      console.log('✅ Full Slack sync completed')

      return {
        success: true,
        message: 'Slack workspace synced successfully',
      }
    } catch (error) {
      console.error('❌ Error during full sync:', error)
      throw error
    }
  }

  /**
   * Sync workspace/team information
   */
  async syncWorkspace() {
    console.log('📊 Syncing workspace info...')

    try {
      const teamInfo = await this.slackService.getTeamInfo()
      const integration = await db.slackIntegration.findFirst({
        where: {
          companyId: this.companyId,
          isActive: true,
        },
      })

      if (!integration) {
        throw new Error('No active Slack integration found')
      }

      if (!teamInfo || !teamInfo.id) {
        throw new Error('Team information is invalid or Team ID is required')
      }

      // Upsert workspace
      await db.slackWorkspace.upsert({
        where: {
          companyId_teamId: {
            companyId: this.companyId,
            teamId: teamInfo.id,
          },
        },
        create: {
          integrationId: integration.id,
          companyId: this.companyId,
          teamId: teamInfo.id,
          teamName: teamInfo.name || 'Unknown Team',
          teamDomain: teamInfo.domain || null,
          teamUrl: teamInfo.url || null,
          teamIcon: (teamInfo as any).icon?.image_132,
          enterpriseId: (teamInfo as any).enterprise_id,
          enterpriseName: (teamInfo as any).enterprise_name,
        },
        update: {
          teamName: teamInfo.name || 'Unknown Team',
          teamDomain: teamInfo.domain || null,
          teamUrl: teamInfo.url || null,
          teamIcon: (teamInfo as any).icon?.image_132,
          updatedAt: new Date(),
        },
      })

      console.log('✅ Workspace synced:', teamInfo.name)
    } catch (error) {
      console.error('❌ Error syncing workspace:', error)
      throw error
    }
  }

  /**
   * Sync all workspace users
   */
  async syncUsers() {
    console.log('👥 Syncing users...')

    try {
      const slackUsers = await this.slackService.getUsers()
      let syncedCount = 0
      let matchedCount = 0

      for (const slackUser of slackUsers) {
        // Skip bots and deleted users
        if (slackUser.is_bot || slackUser.deleted) {
          continue
        }

        // Try to match with existing employee by email
        let employeeId: string | null = null
        let matchConfidence = 0
        let matchMethod = null

        if (slackUser.profile?.email) {
          const employee = await db.employee.findFirst({
            where: {
              companyId: this.companyId,
              email: slackUser.profile.email,
            },
          })

          if (employee) {
            employeeId = employee.id
            matchConfidence = 1.0
            matchMethod = 'email'
            matchedCount++
          }
        }

        // Upsert Slack user
        await db.slackUser.upsert({
          where: {
            companyId_slackUserId: {
              companyId: this.companyId,
              slackUserId: slackUser.id,
            },
          },
          create: {
            companyId: this.companyId,
            employeeId,
            slackUserId: slackUser.id,
            slackUsername: slackUser.name,
            realName: slackUser.real_name,
            displayName: slackUser.profile?.display_name,
            email: slackUser.profile?.email,
            title: slackUser.profile?.title,
            phone: slackUser.profile?.phone,
            avatarUrl: slackUser.profile?.image_192,
            statusText: slackUser.profile?.status_text,
            statusEmoji: slackUser.profile?.status_emoji,
            isBot: slackUser.is_bot || false,
            isAdmin: slackUser.is_admin || false,
            isOwner: slackUser.is_owner || false,
            isDeleted: slackUser.deleted || false,
            isRestricted: slackUser.is_restricted || false,
            timezone: slackUser.tz,
            timezoneOffset: slackUser.tz_offset,
            matchConfidence,
            matchMethod,
          },
          update: {
            slackUsername: slackUser.name,
            realName: slackUser.real_name,
            displayName: slackUser.profile?.display_name,
            email: slackUser.profile?.email,
            title: slackUser.profile?.title,
            phone: slackUser.profile?.phone,
            avatarUrl: slackUser.profile?.image_192,
            statusText: slackUser.profile?.status_text,
            statusEmoji: slackUser.profile?.status_emoji,
            isAdmin: slackUser.is_admin || false,
            isOwner: slackUser.is_owner || false,
            isDeleted: slackUser.deleted || false,
            timezone: slackUser.tz,
            timezoneOffset: slackUser.tz_offset,
            employeeId: employeeId || undefined,
            matchConfidence: matchConfidence || undefined,
            matchMethod: matchMethod || undefined,
            updatedAt: new Date(),
          },
        })

        syncedCount++
      }

      // Update workspace stats
      await db.slackWorkspace.updateMany({
        where: {
          companyId: this.companyId,
        },
        data: {
          totalMembers: syncedCount,
        },
      })

      console.log(`✅ Synced ${syncedCount} users (${matchedCount} matched to employees)`)

      return { syncedCount, matchedCount }
    } catch (error) {
      console.error('❌ Error syncing users:', error)
      throw error
    }
  }

  /**
   * Sync all channels
   */
  async syncChannels() {
    console.log('📺 Syncing channels...')

    try {
      const channels = await this.slackService.getChannels()
      let syncedCount = 0

      for (const channel of channels) {
        await db.slackChannel.upsert({
          where: {
            companyId_slackChannelId: {
              companyId: this.companyId,
              slackChannelId: channel.id,
            },
          },
          create: {
            companyId: this.companyId,
            slackChannelId: channel.id,
            name: channel.name,
            nameNormalized: channel.name_normalized,
            topic: (channel as any).topic?.value,
            purpose: (channel as any).purpose?.value,
            isPrivate: channel.is_private || false,
            isArchived: channel.is_archived || false,
            isGeneral: channel.is_general || false,
            memberCount: (channel as any).num_members || 0,
            creatorId: channel.creator,
          },
          update: {
            name: channel.name,
            nameNormalized: channel.name_normalized,
            topic: (channel as any).topic?.value,
            purpose: (channel as any).purpose?.value,
            isPrivate: channel.is_private || false,
            isArchived: channel.is_archived || false,
            isGeneral: channel.is_general || false,
            memberCount: (channel as any).num_members || 0,
            updatedAt: new Date(),
          },
        })

        syncedCount++
      }

      // Update workspace stats
      await db.slackWorkspace.updateMany({
        where: {
          companyId: this.companyId,
        },
        data: {
          totalChannels: syncedCount,
        },
      })

      console.log(`✅ Synced ${syncedCount} channels`)

      return { syncedCount }
    } catch (error) {
      console.error('❌ Error syncing channels:', error)
      throw error
    }
  }

  /**
   * Sync recent messages (last 7 days) - NOW STORES FULL CONTENT
   * Note: Stores actual message content for AI analysis
   */
  async syncRecentMessages(daysBack = 7) {
    console.log(`💬 Syncing messages from last ${daysBack} days...`)

    try {
      const channels = await db.slackChannel.findMany({
        where: {
          companyId: this.companyId,
          isArchived: false,
        },
      })

      const now = Math.floor(Date.now() / 1000)
      const oldest = now - daysBack * 24 * 60 * 60

      let totalMessages = 0

      for (const channel of channels) {
        try {
          // Try to join the channel first (only works for public channels)
          if (!channel.isPrivate) {
            try {
              await this.slackService.joinChannel(channel.slackChannelId)
            } catch (joinError) {
              console.warn(`⚠️  Could not join channel ${channel.name}:`, (joinError as Error).message)
              // Continue anyway - bot might already be in the channel
            }
          }

          const messages = await this.slackService.getChannelHistory(
            channel.slackChannelId,
            {
              oldest: oldest.toString(),
              latest: now.toString(),
            }
          )

          // Store individual messages with full content
          for (const msg of messages) {
            // Skip system messages and messages without users
            if (msg.subtype || !msg.user || !msg.text) continue

            // Find the Slack user
            const slackUser = await db.slackUser.findUnique({
              where: {
                companyId_slackUserId: {
                  companyId: this.companyId,
                  slackUserId: msg.user,
                },
              },
            })

            if (!slackUser) continue

            // Parse timestamp
            const timestamp = new Date(parseFloat(msg.ts) * 1000)
            const date = new Date(timestamp)
            date.setHours(0, 0, 0, 0) // Strip time for date-only field
            const hour = timestamp.getHours()

            // Extract mentions
            const mentions = this.extractMentions(msg.text)
            const links = this.extractLinks(msg.text)

            // Store the message
            await db.slackMessage.upsert({
              where: {
                messageTs: msg.ts,
              },
              create: {
                companyId: this.companyId,
                employeeId: slackUser.employeeId,
                slackUserId: slackUser.id,
                channelId: channel.id,
                messageTs: msg.ts,
                messageType: msg.type || 'message',
                text: msg.text,
                threadTs: msg.thread_ts || null,
                isThreadReply: !!msg.thread_ts,
                timestamp: timestamp,
                date: date,
                hour: hour,
                mentions: mentions.length > 0 ? mentions : undefined,
                reactions: msg.reactions || undefined,
                attachments: msg.files || undefined,
                links: links.length > 0 ? links : undefined,
                mentionCount: mentions.length,
                reactionCount: msg.reactions?.length || 0,
                linkCount: links.length,
                fileCount: msg.files?.length || 0,
              },
              update: {
                text: msg.text,
                reactions: msg.reactions || undefined,
                reactionCount: msg.reactions?.length || 0,
                updatedAt: new Date(),
              },
            })

            totalMessages++
          }

          // Update channel stats
          await db.slackChannel.update({
            where: { id: channel.id },
            data: {
              messageCount: messages.length,
              lastActivityAt: new Date(),
            },
          })
        } catch (channelError) {
          console.warn(`⚠️  Could not sync channel ${channel.name}:`, (channelError as Error).message)
          // Continue with other channels
        }
      }

      // Calculate response times for threads
      await this.calculateResponseTimes()

      // Update workspace total messages
      await db.slackWorkspace.updateMany({
        where: {
          companyId: this.companyId,
        },
        data: {
          totalMessages: totalMessages,
        },
      })

      console.log(`✅ Synced ${totalMessages} messages with full content`)

      return { totalMessages }
    } catch (error) {
      console.error('❌ Error syncing messages:', error)
      throw error
    }
  }

  /**
   * Extract mentioned user IDs from message text
   */
  private extractMentions(text: string): string[] {
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
  private extractLinks(text: string): string[] {
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

  /**
   * Calculate response times for threaded conversations
   */
  private async calculateResponseTimes() {
    console.log('⏱️  Calculating response times for threads...')

    try {
      // Get all thread parent messages
      const parentMessages = await db.slackMessage.findMany({
        where: {
          companyId: this.companyId,
          isThreadReply: false,
          threadTs: { not: null },
        },
      })

      for (const parent of parentMessages) {
        // Find the first reply in the thread
        const firstReply = await db.slackMessage.findFirst({
          where: {
            companyId: this.companyId,
            threadTs: parent.messageTs,
            isThreadReply: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        })

        if (firstReply) {
          const responseTime = Math.floor(
            (firstReply.timestamp.getTime() - parent.timestamp.getTime()) / (1000 * 60)
          )

          // Update parent message with response info
          await db.slackMessage.update({
            where: { id: parent.id },
            data: {
              hasResponse: true,
              responseTimeMinutes: responseTime,
            },
          })
        }

        // Count total replies
        const replyCount = await db.slackMessage.count({
          where: {
            companyId: this.companyId,
            threadTs: parent.messageTs,
            isThreadReply: true,
          },
        })

        // Update reply count
        await db.slackMessage.update({
          where: { id: parent.id },
          data: {
            replyCount: replyCount,
          },
        })
      }

      console.log('✅ Response times calculated')
    } catch (error) {
      console.warn('⚠️  Could not calculate response times:', (error as Error).message)
    }
  }

  /**
   * Create sync service from company ID
   */
  static async createFromCompany(companyId: string): Promise<SlackSyncService | null> {
    const slackService = await SlackService.createFromIntegration(companyId)

    if (!slackService) {
      return null
    }

    return new SlackSyncService(slackService, companyId)
  }
}

export default SlackSyncService

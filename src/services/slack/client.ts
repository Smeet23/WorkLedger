/**
 * Slack API Client Service
 * Handles OAuth, API calls, and workspace data management
 */

import { WebClient } from '@slack/web-api'
import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'

export interface SlackOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
}

export interface SlackTokenResponse {
  ok: boolean
  access_token: string
  token_type: string
  scope: string
  bot_user_id?: string
  app_id: string
  team: {
    id: string
    name: string
  }
  enterprise?: {
    id: string
    name: string
  }
  authed_user: {
    id: string
    scope: string
    access_token: string
    token_type: string
  }
  incoming_webhook?: {
    channel: string
    channel_id: string
    configuration_url: string
    url: string
  }
}

export class SlackService {
  public client: WebClient
  private accessToken?: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken
    this.client = new WebClient(accessToken)
  }

  /**
   * Generate Slack OAuth authorization URL
   */
  static getOAuthUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/api/slack/callback`

    // Slack OAuth scopes
    // User scopes: identity, profile data
    // Bot scopes: read channels, messages, users
    const userScopes = [
      'users:read',
      'users:read.email',
      'channels:read',
      'groups:read',
      'im:read',
      'mpim:read',
    ].join(',')

    const botScopes = [
      'channels:history',
      'channels:read',
      'channels:join',        // Allow bot to join public channels
      'groups:history',
      'groups:read',
      'users:read',
      'users:read.email',
      'team:read',
      'chat:write',
    ].join(',')

    const oauthUrl = new URL('https://slack.com/oauth/v2/authorize')
    oauthUrl.searchParams.set('client_id', clientId!)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('user_scope', userScopes)
    oauthUrl.searchParams.set('scope', botScopes)

    console.log('=== SLACK OAUTH URL GENERATION ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    console.log('User Scopes:', userScopes)
    console.log('Bot Scopes:', botScopes)
    console.log('Generated OAuth URL:', oauthUrl.toString())

    return oauthUrl.toString()
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/api/slack/callback`

    console.log('=== EXCHANGING CODE FOR TOKEN ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json()

    console.log('=== TOKEN EXCHANGE RESPONSE ===')
    console.log('Success:', data.ok)
    console.log('Team:', data.team?.name)

    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code for token')
    }

    return data
  }

  /**
   * Get workspace/team info
   */
  async getTeamInfo() {
    try {
      const result = await this.client.team.info()
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get team info')
      }
      return result.team
    } catch (error) {
      console.error('Error getting team info:', error)
      throw error
    }
  }

  /**
   * Get all workspace users
   */
  async getUsers() {
    try {
      const users = []
      let cursor: string | undefined

      do {
        const result: any = await this.client.users.list({
          cursor,
          limit: 200,
        })

        if (!result.ok) {
          throw new Error(result.error || 'Failed to get users')
        }

        users.push(...result.members)
        cursor = result.response_metadata?.next_cursor
      } while (cursor)

      return users
    } catch (error) {
      console.error('Error getting users:', error)
      throw error
    }
  }

  /**
   * Get user info by ID
   */
  async getUserInfo(userId: string) {
    try {
      const result = await this.client.users.info({
        user: userId,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Failed to get user info')
      }

      return result.user
    } catch (error) {
      console.error('Error getting user info:', error)
      throw error
    }
  }

  /**
   * Get all channels (public and private the bot has access to)
   */
  async getChannels() {
    try {
      const channels = []
      let cursor: string | undefined

      // Get public channels
      do {
        const result: any = await this.client.conversations.list({
          cursor,
          limit: 200,
          types: 'public_channel,private_channel',
          exclude_archived: false,
        })

        if (!result.ok) {
          throw new Error(result.error || 'Failed to get channels')
        }

        channels.push(...result.channels)
        cursor = result.response_metadata?.next_cursor
      } while (cursor)

      return channels
    } catch (error) {
      console.error('Error getting channels:', error)
      throw error
    }
  }

  /**
   * Get channel info by ID
   */
  async getChannelInfo(channelId: string) {
    try {
      const result = await this.client.conversations.info({
        channel: channelId,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Failed to get channel info')
      }

      return result.channel
    } catch (error) {
      console.error('Error getting channel info:', error)
      throw error
    }
  }

  /**
   * Get channel members
   */
  async getChannelMembers(channelId: string) {
    try {
      const members = []
      let cursor: string | undefined

      do {
        const result: any = await this.client.conversations.members({
          channel: channelId,
          cursor,
          limit: 200,
        })

        if (!result.ok) {
          throw new Error(result.error || 'Failed to get channel members')
        }

        members.push(...result.members)
        cursor = result.response_metadata?.next_cursor
      } while (cursor)

      return members
    } catch (error) {
      console.error('Error getting channel members:', error)
      throw error
    }
  }

  /**
   * Join a channel (bot must have channels:join scope)
   */
  async joinChannel(channelId: string) {
    try {
      const result: any = await this.client.conversations.join({
        channel: channelId,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Failed to join channel')
      }

      console.log(`✅ Bot joined channel: ${channelId}`)
      return result.channel
    } catch (error: any) {
      // If already in channel, that's fine
      if (error.data?.error === 'already_in_channel') {
        console.log(`ℹ️  Bot already in channel: ${channelId}`)
        return null
      }
      console.error('Error joining channel:', error)
      throw error
    }
  }

  /**
   * Get channel history (messages)
   * NOTE: Now stores full message content for AI analysis
   */
  async getChannelHistory(
    channelId: string,
    options: {
      oldest?: string // Unix timestamp
      latest?: string // Unix timestamp
      limit?: number
    } = {}
  ) {
    try {
      const messages = []
      let cursor: string | undefined

      do {
        const result: any = await this.client.conversations.history({
          channel: channelId,
          cursor,
          limit: options.limit || 100,
          oldest: options.oldest,
          latest: options.latest,
        })

        if (!result.ok) {
          throw new Error(result.error || 'Failed to get channel history')
        }

        messages.push(...result.messages)
        cursor = result.response_metadata?.next_cursor

        // Stop if we have a limit
        if (options.limit && messages.length >= options.limit) {
          break
        }
      } while (cursor)

      return messages
    } catch (error) {
      console.error('Error getting channel history:', error)
      throw error
    }
  }

  /**
   * Get thread replies
   */
  async getThreadReplies(channelId: string, threadTs: string) {
    try {
      const result: any = await this.client.conversations.replies({
        channel: channelId,
        ts: threadTs,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Failed to get thread replies')
      }

      return result.messages
    } catch (error) {
      console.error('Error getting thread replies:', error)
      throw error
    }
  }

  /**
   * Test authentication
   */
  async testAuth() {
    try {
      const result = await this.client.auth.test()
      return {
        ok: result.ok,
        url: result.url,
        team: result.team,
        user: result.user,
        teamId: result.team_id,
        userId: result.user_id,
        botId: result.bot_id,
      }
    } catch (error) {
      console.error('Error testing auth:', error)
      throw error
    }
  }

  /**
   * Save integration to database
   */
  static async saveIntegration(
    companyId: string,
    tokenData: SlackTokenResponse
  ) {
    try {
      // Encrypt tokens
      const encryptedAccessToken = encrypt(tokenData.access_token)
      const encryptedBotToken = tokenData.authed_user?.access_token
        ? encrypt(tokenData.authed_user.access_token)
        : null

      // Check if integration already exists
      const existing = await db.slackIntegration.findUnique({
        where: {
          companyId_teamId: {
            companyId,
            teamId: tokenData.team.id,
          },
        },
      })

      if (existing) {
        // Update existing integration
        const updated = await db.slackIntegration.update({
          where: { id: existing.id },
          data: {
            encryptedAccessToken,
            botAccessToken: encryptedBotToken,
            scope: tokenData.scope,
            botUserId: tokenData.bot_user_id,
            isActive: true,
            deactivatedAt: null,
            updatedAt: new Date(),
          },
        })

        console.log('✅ Updated existing Slack integration:', updated.id)
        return updated
      }

      // Create new integration
      const integration = await db.slackIntegration.create({
        data: {
          companyId,
          teamId: tokenData.team.id,
          teamName: tokenData.team.name,
          teamDomain: tokenData.team.name.toLowerCase().replace(/\s+/g, '-'),
          encryptedAccessToken,
          botAccessToken: encryptedBotToken,
          scope: tokenData.scope,
          botUserId: tokenData.bot_user_id,
          isActive: true,
        },
      })

      console.log('✅ Created new Slack integration:', integration.id)
      return integration
    } catch (error) {
      console.error('❌ Error saving Slack integration:', error)
      throw error
    }
  }

  /**
   * Get integration from database
   */
  static async getIntegration(companyId: string) {
    const integration = await db.slackIntegration.findFirst({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        workspace: true,
      },
    })

    return integration
  }

  /**
   * Create Slack client from stored integration
   */
  static async createFromIntegration(companyId: string): Promise<SlackService | null> {
    const integration = await this.getIntegration(companyId)

    if (!integration) {
      return null
    }

    // Decrypt access token
    const accessToken = decrypt(integration.encryptedAccessToken)

    return new SlackService(accessToken)
  }

  /**
   * Disconnect integration
   */
  static async disconnectIntegration(companyId: string) {
    await db.slackIntegration.updateMany({
      where: {
        companyId,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    })

    console.log('✅ Disconnected Slack integration for company:', companyId)
  }
}

export default SlackService

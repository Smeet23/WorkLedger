/**
 * Jira API Client Service
 * Handles OAuth authentication and API calls to Atlassian Jira
 */

import { db } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'workledger-secret-key-change-in-production-32'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

export interface JiraUser {
  accountId: string
  displayName: string
  emailAddress?: string
  avatarUrls?: {
    '16x16'?: string
    '24x24'?: string
    '32x32'?: string
    '48x48'?: string
  }
  accountType?: string
  active?: boolean
}

export interface JiraProject {
  id: string
  key: string
  name: string
  description?: string
  avatarUrls?: any
  projectTypeKey?: string
  style?: string
  lead?: JiraUser
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: any
    issuetype: {
      name: string
      iconUrl?: string
    }
    status: {
      name: string
      statusCategory: {
        key: string // new, indeterminate, done
      }
    }
    priority?: {
      name: string
      iconUrl?: string
    }
    assignee?: JiraUser | null
    reporter?: JiraUser | null
    created: string
    updated: string
    resolutiondate?: string
    duedate?: string
    resolution?: {
      name: string
    }
    labels?: string[]
    components?: any[]
    parent?: {
      key: string
    }
    customfield_10016?: number // Story points (common field ID)
    timetracking?: {
      originalEstimate?: string
      remainingEstimate?: string
      timeSpent?: string
      originalEstimateSeconds?: number
      remainingEstimateSeconds?: number
      timeSpentSeconds?: number
    }
  }
}

export class JiraService {
  private accessToken: string
  private cloudId: string
  private baseUrl: string

  constructor(accessToken: string, cloudId: string) {
    this.accessToken = accessToken
    this.cloudId = cloudId
    this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`
  }

  /**
   * Encrypt sensitive data
   */
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  /**
   * Decrypt sensitive data
   */
  public static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Generate OAuth URL for Jira authorization
   */
  static getOAuthUrl(state: string): string {
    const clientId = process.env.JIRA_CLIENT_ID

    if (!clientId) {
      throw new Error('JIRA_CLIENT_ID not configured')
    }

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jira/callback`

    // Jira OAuth scopes
    const scopes = [
      'read:jira-work',       // Read project and issue data
      'read:jira-user',       // Read user information
      'write:jira-work',      // Create/update issues
      'read:me',              // Read current user info
      'manage:jira-webhook',  // Register and manage webhooks
      'offline_access',       // Get refresh token
    ].join(' ')

    const oauthUrl = new URL('https://auth.atlassian.com/authorize')
    oauthUrl.searchParams.set('audience', 'api.atlassian.com')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('scope', scopes)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('prompt', 'consent')

    console.log('=== JIRA OAUTH URL GENERATION ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    console.log('Scopes:', scopes)

    return oauthUrl.toString()
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }> {
    const clientId = process.env.JIRA_CLIENT_ID
    const clientSecret = process.env.JIRA_CLIENT_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jira/callback`

    if (!clientId || !clientSecret) {
      throw new Error('JIRA_CLIENT_ID or JIRA_CLIENT_SECRET not configured')
    }

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for token: ${error}`)
    }

    return response.json()
  }

  /**
   * Get accessible resources (Jira sites)
   */
  static async getAccessibleResources(accessToken: string): Promise<{
    id: string
    url: string
    name: string
    scopes: string[]
    avatarUrl?: string
  }[]> {
    const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get accessible resources')
    }

    return response.json()
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<JiraUser> {
    const response = await fetch('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get current user')
    }

    return response.json()
  }

  /**
   * Make authenticated API call to Jira
   */
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/rest/api/3/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Jira API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.apiCall('project/search?expand=lead,description')
      return response.values || []
    } catch (error) {
      console.error('Error getting projects:', error)
      throw error
    }
  }

  /**
   * Get project by key or ID
   */
  async getProject(projectKeyOrId: string): Promise<JiraProject> {
    try {
      return await this.apiCall(`project/${projectKeyOrId}`)
    } catch (error) {
      console.error('Error getting project:', error)
      throw error
    }
  }

  /**
   * Get issues for a project with JQL
   */
  async searchIssues(jql: string, maxResults: number = 100, startAt: number = 0): Promise<{
    issues: JiraIssue[]
    total: number
    maxResults: number
    startAt: number
  }> {
    try {
      return await this.apiCall('search', {
        method: 'POST',
        body: JSON.stringify({
          jql,
          maxResults,
          startAt,
          fields: [
            'summary',
            'description',
            'issuetype',
            'status',
            'priority',
            'assignee',
            'reporter',
            'created',
            'updated',
            'resolutiondate',
            'duedate',
            'resolution',
            'labels',
            'components',
            'parent',
            'customfield_10016', // Story points
            'timetracking',
          ],
        }),
      })
    } catch (error) {
      console.error('Error searching issues:', error)
      throw error
    }
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      return await this.apiCall(`issue/${issueKey}`)
    } catch (error) {
      console.error('Error getting issue:', error)
      throw error
    }
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueKey: string): Promise<any[]> {
    try {
      const response = await this.apiCall(`issue/${issueKey}/comment`)
      return response.comments || []
    } catch (error) {
      console.error('Error getting issue comments:', error)
      throw error
    }
  }

  /**
   * Get issue worklogs
   */
  async getIssueWorklogs(issueKey: string): Promise<any[]> {
    try {
      const response = await this.apiCall(`issue/${issueKey}/worklog`)
      return response.worklogs || []
    } catch (error) {
      console.error('Error getting issue worklogs:', error)
      throw error
    }
  }

  /**
   * Get users for a project
   */
  async getProjectUsers(projectKey: string): Promise<JiraUser[]> {
    try {
      return await this.apiCall(`user/assignable/search?project=${projectKey}&maxResults=1000`)
    } catch (error) {
      console.error('Error getting project users:', error)
      throw error
    }
  }

  /**
   * Register a webhook for this Jira site
   * Note: OAuth 2.0 apps are limited to 5 webhooks per app per user
   * Webhooks expire after 30 days and need to be refreshed
   *
   * Format for OAuth 2.0 apps is different - single URL with array of webhooks
   */
  async registerWebhook(params: {
    url: string
    events: string[]
    jqlFilter?: string
  }): Promise<any> {
    try {
      console.log('📤 Registering webhook with payload:', JSON.stringify({
        url: params.url,
        webhooks: [
          {
            events: params.events,
            ...(params.jqlFilter && { jqlFilter: params.jqlFilter }),
          },
        ],
      }, null, 2))

      const response = await this.apiCall('webhook', {
        method: 'POST',
        body: JSON.stringify({
          url: params.url,
          webhooks: [
            {
              events: params.events,
              ...(params.jqlFilter && { jqlFilter: params.jqlFilter }),
            },
          ],
        }),
      })

      console.log('✅ Webhook registration response:', JSON.stringify(response, null, 2))

      // Check if there were errors in the registration
      if (response.webhookRegistrationResult) {
        const results = response.webhookRegistrationResult
        const hasErrors = results.some((r: any) => r.errors && r.errors.length > 0)

        if (hasErrors) {
          const errors = results.flatMap((r: any) => r.errors || [])
          throw new Error(`Webhook registration failed: ${errors.join(', ')}`)
        }
      }

      return response
    } catch (error) {
      console.error('❌ Error registering webhook:', error)
      throw error
    }
  }

  /**
   * List all registered webhooks
   */
  async listWebhooks(): Promise<Array<{
    id: number
    name: string
    url: string
    events: string[]
    expirationDate: number
  }>> {
    try {
      const response = await this.apiCall('webhook')
      return response.values || []
    } catch (error) {
      console.error('❌ Error listing webhooks:', error)
      throw error
    }
  }

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    try {
      await this.apiCall(`webhook/${webhookId}`, {
        method: 'DELETE',
      })
      console.log('✅ Webhook deleted:', webhookId)
    } catch (error) {
      console.error('❌ Error deleting webhook:', error)
      throw error
    }
  }

  /**
   * Refresh webhook to extend its expiration by another 30 days
   */
  async refreshWebhook(webhookId: number): Promise<{
    id: number
    expirationDate: number
  }> {
    try {
      const response = await this.apiCall(`webhook/${webhookId}/refresh`, {
        method: 'PUT',
      })
      console.log('✅ Webhook refreshed:', webhookId)
      return response
    } catch (error) {
      console.error('❌ Error refreshing webhook:', error)
      throw error
    }
  }

  /**
   * Disconnect integration
   */
  static async disconnectIntegration(companyId: string): Promise<void> {
    await db.jiraIntegration.updateMany({
      where: {
        companyId,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    })

    console.log('✅ Jira integration disconnected for company:', companyId)
  }

  /**
   * Create Jira service from integration
   */
  static async createFromIntegration(companyId: string): Promise<JiraService | null> {
    const integration = await db.jiraIntegration.findFirst({
      where: {
        companyId,
        isActive: true,
      },
    })

    if (!integration) {
      return null
    }

    const accessToken = this.decrypt(integration.encryptedAccessToken)

    return new JiraService(accessToken, integration.cloudId)
  }

  /**
   * Store integration after OAuth
   */
  static async storeIntegration(params: {
    companyId: string
    cloudId: string
    siteUrl: string
    siteName: string
    accessToken: string
    refreshToken?: string
    expiresIn: number
    accountId: string
    accountEmail?: string
  }): Promise<void> {
    const {
      companyId,
      cloudId,
      siteUrl,
      siteName,
      accessToken,
      refreshToken,
      expiresIn,
      accountId,
      accountEmail,
    } = params

    const encryptedAccessToken = this.encrypt(accessToken)
    const encryptedRefreshToken = refreshToken ? this.encrypt(refreshToken) : null
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    await db.jiraIntegration.upsert({
      where: {
        companyId_cloudId: {
          companyId,
          cloudId,
        },
      },
      create: {
        companyId,
        cloudId,
        siteUrl,
        siteName,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt,
        accountId,
        accountEmail,
        isActive: true,
      },
      update: {
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt,
        accountId,
        accountEmail,
        isActive: true,
        deactivatedAt: null,
        updatedAt: new Date(),
      },
    })

    console.log('✅ Jira integration stored for company:', companyId)
  }
}

export default JiraService

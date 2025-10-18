import { config } from '@/lib/config'
import { encrypt, decrypt } from '@/lib/crypto'
import { db } from '@/lib/db'
import {
  ExternalServiceError,
  RateLimitError,
  AuthenticationError,
} from '@/lib/errors'
import { loggers } from '@/lib/logger'

const logger = loggers.external('gitlab')

export interface GitLabOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
}

export interface GitLabProject {
  id: number
  name: string
  path_with_namespace: string
  description: string | null
  visibility: string
  created_at: string
  last_activity_at: string
  web_url: string
  default_branch: string
  star_count: number
  forks_count: number
}

export interface GitLabCommit {
  id: string
  short_id: string
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
  stats: {
    additions: number
    deletions: number
    total: number
  }
}

export interface GitLabUser {
  id: number
  username: string
  name: string
  email: string
  avatar_url: string
  web_url: string
}

export class GitLabService {
  private readonly apiUrl: string
  private readonly accessToken?: string
  private readonly serviceLogger = logger

  constructor(accessToken?: string) {
    this.apiUrl = config.gitlab.api.baseUrl
    this.accessToken = accessToken
  }

  /**
   * Generate OAuth authorization URL
   */
  static getOAuthUrl(state: string): string {
    const clientId = config.gitlab.oauth.clientId
    const redirectUri = `${config.app.url}${config.gitlab.oauth.redirectPath}`
    const scope = config.gitlab.oauth.scope

    return `${config.gitlab.api.oauthUrl}/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=${scope}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string
    token_type: string
    refresh_token?: string
    expires_in?: number
    created_at: number
  }> {
    try {
      const response = await fetch(`${config.gitlab.api.oauthUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.gitlab.oauth.clientId,
          client_secret: config.gitlab.oauth.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${config.app.url}${config.gitlab.oauth.redirectPath}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new ExternalServiceError(
          'GitLab',
          error.error_description || 'Failed to exchange code for token'
        )
      }

      return await response.json()
    } catch (error) {
      logger.error('GitLab token exchange failed', error)
      throw error
    }
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser(): Promise<GitLabUser> {
    return this.makeRequest<GitLabUser>('/user')
  }

  /**
   * Get user's projects (repositories)
   */
  async getUserProjects(
    userId?: number,
    page = 1,
    perPage = 100
  ): Promise<GitLabProject[]> {
    const endpoint = userId ? `/users/${userId}/projects` : '/projects'
    return this.makeRequest<GitLabProject[]>(endpoint, {
      page,
      per_page: perPage,
      membership: true,
      order_by: 'updated_at',
      sort: 'desc',
    })
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<GitLabProject> {
    return this.makeRequest<GitLabProject>(`/projects/${encodeURIComponent(projectId)}`)
  }

  /**
   * Get project languages
   */
  async getProjectLanguages(projectId: string): Promise<Record<string, number>> {
    return this.makeRequest<Record<string, number>>(
      `/projects/${encodeURIComponent(projectId)}/languages`
    )
  }

  /**
   * Get project commits
   */
  async getProjectCommits(
    projectId: string,
    options: {
      since?: string
      until?: string
      page?: number
      perPage?: number
      ref?: string
    } = {}
  ): Promise<GitLabCommit[]> {
    const { page = 1, perPage = 100, since, until, ref } = options

    const params: Record<string, any> = {
      page,
      per_page: perPage,
    }

    if (since) params.since = since
    if (until) params.until = until
    if (ref) params.ref_name = ref

    return this.makeRequest<GitLabCommit[]>(
      `/projects/${encodeURIComponent(projectId)}/repository/commits`,
      params
    )
  }

  /**
   * Get detailed commit information
   */
  async getCommitDetails(projectId: string, sha: string): Promise<GitLabCommit> {
    return this.makeRequest<GitLabCommit>(
      `/projects/${encodeURIComponent(projectId)}/repository/commits/${sha}`,
      { stats: true }
    )
  }

  /**
   * Get project file content
   */
  async getFileContent(
    projectId: string,
    filePath: string,
    ref = 'main'
  ): Promise<{ content: string; encoding: string } | null> {
    try {
      return await this.makeRequest(
        `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
        { ref }
      )
    } catch (error) {
      return null
    }
  }

  /**
   * Get project merge requests
   */
  async getProjectMergeRequests(
    projectId: string,
    state: 'opened' | 'closed' | 'merged' | 'all' = 'all',
    page = 1,
    perPage = 100
  ) {
    return this.makeRequest(
      `/projects/${encodeURIComponent(projectId)}/merge_requests`,
      {
        state,
        page,
        per_page: perPage,
        order_by: 'updated_at',
        sort: 'desc',
      }
    )
  }

  /**
   * Get project contributors
   */
  async getProjectContributors(
    projectId: string,
    page = 1,
    perPage = 100
  ) {
    return this.makeRequest(
      `/projects/${encodeURIComponent(projectId)}/repository/contributors`,
      {
        page,
        per_page: perPage,
        order_by: 'commits',
        sort: 'desc',
      }
    )
  }

  /**
   * Detect frameworks from project files
   */
  async detectFrameworks(projectId: string): Promise<string[]> {
    const frameworks: string[] = []

    // Check package.json for JavaScript frameworks
    const packageJson = await this.getFileContent(projectId, 'package.json')
    if (packageJson) {
      try {
        const content = Buffer.from(packageJson.content, 'base64').toString('utf-8')
        const pkg = JSON.parse(content)
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }

        if (deps['react']) frameworks.push('react')
        if (deps['next']) frameworks.push('nextjs')
        if (deps['vue']) frameworks.push('vue')
        if (deps['@angular/core']) frameworks.push('angular')
        if (deps['express']) frameworks.push('express')
        if (deps['@nestjs/core']) frameworks.push('nestjs')
        if (deps['svelte']) frameworks.push('svelte')
      } catch (error) {
        this.serviceLogger.warn('Failed to parse package.json', { projectId, error })
      }
    }

    // Check requirements.txt for Python frameworks
    const requirements = await this.getFileContent(projectId, 'requirements.txt')
    if (requirements) {
      const content = Buffer.from(requirements.content, 'base64').toString('utf-8').toLowerCase()
      if (content.includes('django')) frameworks.push('django')
      if (content.includes('flask')) frameworks.push('flask')
      if (content.includes('fastapi')) frameworks.push('fastapi')
      if (content.includes('tensorflow')) frameworks.push('tensorflow')
      if (content.includes('pytorch')) frameworks.push('pytorch')
    }

    // Check Gemfile for Ruby frameworks
    const gemfile = await this.getFileContent(projectId, 'Gemfile')
    if (gemfile) {
      const content = Buffer.from(gemfile.content, 'base64').toString('utf-8').toLowerCase()
      if (content.includes('rails')) frameworks.push('rails')
      if (content.includes('sinatra')) frameworks.push('sinatra')
    }

    // Check go.mod for Go frameworks
    const gomod = await this.getFileContent(projectId, 'go.mod')
    if (gomod) {
      const content = Buffer.from(gomod.content, 'base64').toString('utf-8').toLowerCase()
      if (content.includes('gin-gonic')) frameworks.push('gin')
      if (content.includes('echo')) frameworks.push('echo')
      if (content.includes('fiber')) frameworks.push('fiber')
    }

    // Check composer.json for PHP frameworks
    const composer = await this.getFileContent(projectId, 'composer.json')
    if (composer) {
      try {
        const content = Buffer.from(composer.content, 'base64').toString('utf-8')
        const pkg = JSON.parse(content)
        const deps = { ...pkg.require, ...pkg['require-dev'] }

        if (deps['laravel/framework']) frameworks.push('laravel')
        if (deps['symfony/symfony']) frameworks.push('symfony')
      } catch (error) {
        this.serviceLogger.warn('Failed to parse composer.json', { projectId, error })
      }
    }

    return Array.from(new Set(frameworks))
  }

  /**
   * Save GitLab connection to database
   */
  static async saveConnection(
    employeeId: string,
    gitlabData: GitLabUser,
    accessToken: string,
    refreshToken?: string
  ) {
    const encryptedAccessToken = encrypt(accessToken)
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null

    // Save to Integration table
    return await db.integration.upsert({
      where: {
        companyId_type_name: {
          companyId: (await db.employee.findUnique({
            where: { id: employeeId },
            select: { companyId: true },
          }))!.companyId,
          type: 'GITLAB',
          name: `GitLab - ${gitlabData.username}`,
        },
      },
      update: {
        config: {
          userId: gitlabData.id,
          username: gitlabData.username,
          name: gitlabData.name,
          email: gitlabData.email,
          avatarUrl: gitlabData.avatar_url,
        },
        credentials: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
        },
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date(),
      },
      create: {
        companyId: (await db.employee.findUnique({
          where: { id: employeeId },
          select: { companyId: true },
        }))!.companyId,
        type: 'GITLAB',
        name: `GitLab - ${gitlabData.username}`,
        config: {
          userId: gitlabData.id,
          username: gitlabData.username,
          name: gitlabData.name,
          email: gitlabData.email,
          avatarUrl: gitlabData.avatar_url,
          employeeId,
        },
        credentials: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
        },
        isActive: true,
      },
    })
  }

  /**
   * Get GitLab connection from database
   */
  static async getConnection(employeeId: string) {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { companyId: true },
    })

    if (!employee) return null

    const integration = await db.integration.findFirst({
      where: {
        companyId: employee.companyId,
        type: 'GITLAB',
        config: {
          path: ['employeeId'],
          equals: employeeId,
        },
        isActive: true,
      },
    })

    if (!integration || !integration.credentials) return null

    const credentials = integration.credentials as any

    return {
      ...integration,
      accessToken: decrypt(credentials.accessToken),
      refreshToken: credentials.refreshToken ? decrypt(credentials.refreshToken) : null,
    }
  }

  /**
   * Make API request to GitLab
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new AuthenticationError('GitLab access token is required')
    }

    const url = new URL(`${this.apiUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      // Handle rate limiting
      const remaining = response.headers.get('RateLimit-Remaining')
      if (remaining && parseInt(remaining) === 0) {
        const resetTime = response.headers.get('RateLimit-Reset')
        const retryAfter = resetTime ? parseInt(resetTime) * 1000 - Date.now() : 60000
        throw new RateLimitError('GitLab API', retryAfter)
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('GitLab access token is invalid or expired')
        }
        if (response.status === 404) {
          throw new ExternalServiceError('GitLab', 'Resource not found')
        }

        const error = await response.json().catch(() => ({}))
        throw new ExternalServiceError(
          'GitLab',
          error.message || `Request failed with status ${response.status}`
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof RateLimitError || error instanceof AuthenticationError) {
        throw error
      }

      this.serviceLogger.error('GitLab API request failed', error, { endpoint })
      throw new ExternalServiceError('GitLab', 'API request failed')
    }
  }
}

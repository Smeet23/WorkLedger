import { Octokit } from '@octokit/rest'
import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'

export interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
}

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken
    })
  }

  static getOAuthUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/api/github/callback`
    const scope = 'repo user:email read:org'

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

    console.log('=== OAUTH URL GENERATION ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    console.log('Generated OAuth URL:', oauthUrl)

    return oauthUrl
  }

  static async exchangeCodeForToken(code: string): Promise<{ access_token: string; scope: string; token_type: string }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error_description || 'Failed to exchange code for token')
    }

    return data
  }

  async getAuthenticatedUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data
  }

  async getUserRepos(username: string, page = 1, per_page = 30) {
    const { data } = await this.octokit.rest.repos.listForUser({
      username,
      page,
      per_page,
      sort: 'updated',
      type: 'all'
    })
    return data
  }

  // Get ALL repositories the authenticated user has access to (owned, member, collaborator)
  async getAllAccessibleRepos(page = 1, per_page = 100) {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      page,
      per_page,
      visibility: 'all', // includes private repos
      affiliation: 'owner,collaborator,organization_member', // all affiliations
      sort: 'updated'
    })
    return data
  }

  // Search for repositories where user has contributed
  async searchContributedRepos(username: string, page = 1) {
    try {
      const { data } = await this.octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} is:pr is:merged`,
        per_page: 100,
        page,
        sort: 'updated'
      })

      // Extract unique repositories from PRs
      const repoSet = new Set<string>()
      const repos = []

      for (const item of data.items) {
        if (item.repository_url && !repoSet.has(item.repository_url)) {
          repoSet.add(item.repository_url)
          // Fetch repo details
          const repoPath = item.repository_url.split('/repos/')[1]
          if (repoPath) {
            const [owner, repo] = repoPath.split('/')
            try {
              const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo })
              repos.push(repoData)
            } catch (error) {
              console.error(`Failed to fetch repo ${owner}/${repo}:`, error)
            }
          }
        }
      }

      return repos
    } catch (error) {
      console.error('Failed to search contributed repos:', error)
      return []
    }
  }

  async getRepoLanguages(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.listLanguages({
      owner,
      repo
    })
    return data
  }

  async getRepoCommits(owner: string, repo: string, since?: Date, until?: Date, page: number = 1) {
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      since: since?.toISOString(),
      until: until?.toISOString(),
      per_page: 100,
      page
    })
    return data
  }

  // Get detailed commit info with stats
  async getCommitDetails(owner: string, repo: string, sha: string) {
    try {
      const { data } = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha
      })
      return data
    } catch (error) {
      console.error(`Failed to get commit details for ${sha}:`, error)
      return null
    }
  }

  async getRepoPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all') {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: 100
    })
    return data
  }

  async getRepoContributors(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100
    })
    return data
  }

  async getRepoContents(owner: string, repo: string, path = '') {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path
      })
      return data
    } catch (error) {
      return null
    }
  }

  // Save GitHub connection to database
  static async saveConnection(employeeId: string, githubData: any, accessToken: string, refreshToken?: string) {
    const encryptedAccessToken = encrypt(accessToken)
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null

    // First, delete any existing connections for this GitHub user ID
    // This handles the case where the user reconnects with the same GitHub account
    await db.gitHubConnection.deleteMany({
      where: {
        githubUserId: String(githubData.id)
      }
    })

    // Also delete any existing connection for this employee
    await db.gitHubConnection.deleteMany({
      where: {
        employeeId: employeeId
      }
    })

    // Now create a fresh connection
    return await db.gitHubConnection.create({
      data: {
        employeeId,
        githubUserId: String(githubData.id),
        githubUsername: githubData.login,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        scope: 'repo user:email read:org'
      }
    })
  }

  // Get GitHub connection from database
  static async getConnection(employeeId: string) {
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId }
    })

    if (!connection) return null

    return {
      ...connection,
      accessToken: decrypt(connection.accessToken),
      refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : null
    }
  }

  // Detect frameworks from repository files
  async detectFrameworks(owner: string, repo: string): Promise<string[]> {
    const frameworks: string[] = []

    // Check package.json for JavaScript frameworks
    const packageJson = await this.getRepoContents(owner, repo, 'package.json')
    if (packageJson && 'content' in packageJson) {
      const content = Buffer.from(packageJson.content, 'base64').toString('utf-8')
      const pkg = JSON.parse(content)

      const deps = { ...pkg.dependencies, ...pkg.devDependencies }

      if (deps['react']) frameworks.push('react')
      if (deps['next']) frameworks.push('nextjs')
      if (deps['vue']) frameworks.push('vue')
      if (deps['@angular/core']) frameworks.push('angular')
      if (deps['express']) frameworks.push('express')
      if (deps['@nestjs/core']) frameworks.push('nestjs')
    }

    // Check requirements.txt for Python frameworks
    const requirements = await this.getRepoContents(owner, repo, 'requirements.txt')
    if (requirements && 'content' in requirements) {
      const content = Buffer.from(requirements.content, 'base64').toString('utf-8').toLowerCase()

      if (content.includes('django')) frameworks.push('django')
      if (content.includes('flask')) frameworks.push('flask')
      if (content.includes('fastapi')) frameworks.push('fastapi')
      if (content.includes('tensorflow')) frameworks.push('tensorflow')
      if (content.includes('pytorch')) frameworks.push('pytorch')
    }

    // Check Gemfile for Ruby frameworks
    const gemfile = await this.getRepoContents(owner, repo, 'Gemfile')
    if (gemfile && 'content' in gemfile) {
      const content = Buffer.from(gemfile.content, 'base64').toString('utf-8').toLowerCase()

      if (content.includes('rails')) frameworks.push('rails')
      if (content.includes('sinatra')) frameworks.push('sinatra')
    }

    // Check go.mod for Go frameworks
    const gomod = await this.getRepoContents(owner, repo, 'go.mod')
    if (gomod && 'content' in gomod) {
      const content = Buffer.from(gomod.content, 'base64').toString('utf-8').toLowerCase()

      if (content.includes('gin-gonic')) frameworks.push('gin')
      if (content.includes('echo')) frameworks.push('echo')
      if (content.includes('fiber')) frameworks.push('fiber')
    }

    return Array.from(new Set(frameworks)) // Remove duplicates
  }
}
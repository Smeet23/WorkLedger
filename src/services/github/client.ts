import { Octokit } from '@octokit/rest'
import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { graphql } from '@octokit/graphql'

export interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
}

export class GitHubService {
  public octokit: Octokit
  private graphqlClient: typeof graphql

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken
    })
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${accessToken}`
      }
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
  // Now with FULL PAGINATION - fetches ALL repos, not just first 100
  async getAllAccessibleRepos() {
    const allRepos = []
    let page = 1
    let hasMore = true

    console.log('🔍 Fetching ALL accessible repos with pagination...')

    while (hasMore) {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        page,
        per_page: 100,
        visibility: 'all', // includes private repos
        affiliation: 'owner,collaborator,organization_member', // all affiliations
        sort: 'updated'
      })

      allRepos.push(...data)
      console.log(`  Page ${page}: Found ${data.length} repos (total: ${allRepos.length})`)

      // If we got less than 100, we've reached the end
      if (data.length < 100) {
        hasMore = false
      } else {
        page++
      }
    }

    console.log(`✅ Total accessible repos fetched: ${allRepos.length}`)
    return allRepos
  }

  // NEW: Use GraphQL to fetch ALL repositories (owned + contributed) with full pagination
  // This is the MOST COMPREHENSIVE method to get all repos a user has touched
  async getAllRepositoriesViaGraphQL(username: string) {
    const allRepos = []
    const repoSet = new Set<string>()
    let hasNextPage = true
    let endCursor: string | null = null

    console.log(`🔍 Fetching ALL repositories via GraphQL for ${username}...`)

    try {
      while (hasNextPage) {
        const query = `
          query($username: String!, $cursor: String) {
            user(login: $username) {
              # Repositories owned by the user
              repositories(first: 100, after: $cursor, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  id
                  name
                  nameWithOwner
                  description
                  url
                  isPrivate
                  isFork
                  isArchived
                  defaultBranchRef {
                    name
                  }
                  owner {
                    login
                  }
                  primaryLanguage {
                    name
                  }
                  languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                    edges {
                      size
                      node {
                        name
                      }
                    }
                  }
                  stargazerCount
                  forkCount
                  createdAt
                  updatedAt
                  pushedAt
                  diskUsage
                  hasIssuesEnabled
                  hasWikiEnabled
                }
              }
              # Repositories the user has contributed to (even if not a member)
              repositoriesContributedTo(first: 100, after: $cursor, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  id
                  name
                  nameWithOwner
                  description
                  url
                  isPrivate
                  isFork
                  isArchived
                  defaultBranchRef {
                    name
                  }
                  owner {
                    login
                  }
                  primaryLanguage {
                    name
                  }
                  languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                    edges {
                      size
                      node {
                        name
                      }
                    }
                  }
                  stargazerCount
                  forkCount
                  createdAt
                  updatedAt
                  pushedAt
                  diskUsage
                  hasIssuesEnabled
                  hasWikiEnabled
                }
              }
            }
          }
        `

        const result: any = await this.graphqlClient(query, {
          username,
          cursor: endCursor
        })

        // Process owned/member repositories
        if (result.user.repositories.nodes) {
          for (const repo of result.user.repositories.nodes) {
            if (!repoSet.has(repo.nameWithOwner)) {
              repoSet.add(repo.nameWithOwner)
              allRepos.push(this.transformGraphQLRepoToREST(repo))
            }
          }
        }

        // Process contributed repositories
        if (result.user.repositoriesContributedTo.nodes) {
          for (const repo of result.user.repositoriesContributedTo.nodes) {
            if (!repoSet.has(repo.nameWithOwner)) {
              repoSet.add(repo.nameWithOwner)
              allRepos.push(this.transformGraphQLRepoToREST(repo))
            }
          }
        }

        // Check if we need to continue pagination
        // We need to paginate both collections, so continue if either has more
        const reposHasNext = result.user.repositories.pageInfo.hasNextPage
        const contributedHasNext = result.user.repositoriesContributedTo.pageInfo.hasNextPage

        hasNextPage = reposHasNext || contributedHasNext

        // Use the cursor from whichever collection still has more pages
        if (reposHasNext) {
          endCursor = result.user.repositories.pageInfo.endCursor
        } else if (contributedHasNext) {
          endCursor = result.user.repositoriesContributedTo.pageInfo.endCursor
        }

        console.log(`  Fetched batch: ${result.user.repositories.nodes.length} owned/member + ${result.user.repositoriesContributedTo.nodes.length} contributed (total unique: ${allRepos.length})`)
      }

      console.log(`✅ Total repositories fetched via GraphQL: ${allRepos.length}`)
      return allRepos
    } catch (error: any) {
      console.error('Failed to fetch repositories via GraphQL:', error.message)
      console.error('Error details:', error)
      // Fallback to REST API if GraphQL fails
      console.log('⚠️ Falling back to REST API methods...')
      return []
    }
  }

  // Helper method to transform GraphQL repository response to REST API format
  private transformGraphQLRepoToREST(graphqlRepo: any): any {
    const [owner, repo] = graphqlRepo.nameWithOwner.split('/')

    return {
      id: graphqlRepo.id,
      node_id: graphqlRepo.id,
      name: graphqlRepo.name,
      full_name: graphqlRepo.nameWithOwner,
      owner: {
        login: graphqlRepo.owner.login,
        type: 'User' // Could also be 'Organization' but we'll keep it simple
      },
      private: graphqlRepo.isPrivate,
      html_url: graphqlRepo.url,
      description: graphqlRepo.description,
      fork: graphqlRepo.isFork,
      url: `https://api.github.com/repos/${graphqlRepo.nameWithOwner}`,
      created_at: graphqlRepo.createdAt,
      updated_at: graphqlRepo.updatedAt,
      pushed_at: graphqlRepo.pushedAt,
      size: graphqlRepo.diskUsage || 0,
      stargazers_count: graphqlRepo.stargazerCount,
      forks_count: graphqlRepo.forkCount,
      archived: graphqlRepo.isArchived,
      disabled: false,
      language: graphqlRepo.primaryLanguage?.name || null,
      has_issues: graphqlRepo.hasIssuesEnabled,
      has_wiki: graphqlRepo.hasWikiEnabled,
      default_branch: graphqlRepo.defaultBranchRef?.name || 'main',
      // Additional language data from GraphQL
      languages: graphqlRepo.languages?.edges?.reduce((acc: any, edge: any) => {
        acc[edge.node.name] = edge.size
        return acc
      }, {}) || {}
    }
  }

  // Search for repositories where user has contributed (via commits AND PRs)
  // Now with FULL PAGINATION - searches through up to 1000 results (GitHub API limit)
  async searchContributedRepos(username: string) {
    try {
      const repoSet = new Set<string>()
      const repos = []

      console.log(`🔍 Searching for ALL contributed repos for ${username}...`)

      // Search for commits by the user (paginate through all results, max 1000)
      console.log('  Searching commits...')
      try {
        let page = 1
        let hasMore = true

        while (hasMore && page <= 10) { // GitHub search API max 1000 results (10 pages × 100)
          const { data: commitSearch } = await this.octokit.rest.search.commits({
            q: `author:${username}`,
            per_page: 100,
            page,
            sort: 'author-date'
          })

          console.log(`    Page ${page}: Found ${commitSearch.items.length} commits`)

          // Extract unique repositories from commits
          for (const commit of commitSearch.items) {
            if (commit.repository && !repoSet.has(commit.repository.full_name)) {
              repoSet.add(commit.repository.full_name)
              repos.push(commit.repository)
            }
          }

          if (commitSearch.items.length < 100) {
            hasMore = false
          } else {
            page++
          }
        }

        console.log(`    ✅ Total unique repos from commits: ${repos.length}`)
      } catch (commitError: any) {
        console.warn('    Failed to search commits:', commitError.message)
      }

      // Search for PRs by the user (paginate through all results, max 1000)
      console.log('  Searching PRs...')
      try {
        let page = 1
        let hasMore = true

        while (hasMore && page <= 10) { // GitHub search API max 1000 results
          const { data: prSearch } = await this.octokit.rest.search.issuesAndPullRequests({
            q: `author:${username} is:pr`,
            per_page: 100,
            page,
            sort: 'updated'
          })

          console.log(`    Page ${page}: Found ${prSearch.items.length} PRs`)

          // Extract unique repositories from PRs
          for (const item of prSearch.items) {
            if (item.repository_url) {
              const repoPath = item.repository_url.split('/repos/')[1]
              if (repoPath) {
                const [owner, repo] = repoPath.split('/')
                const fullName = `${owner}/${repo}`

                if (!repoSet.has(fullName)) {
                  try {
                    const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo })
                    repoSet.add(repoData.full_name)
                    repos.push(repoData)
                  } catch (error) {
                    console.error(`    Failed to fetch repo ${owner}/${repo}:`, error)
                  }
                }
              }
            }
          }

          if (prSearch.items.length < 100) {
            hasMore = false
          } else {
            page++
          }
        }

        console.log(`    ✅ Total unique repos from PRs: ${repos.filter(r => !repoSet.has(r.full_name + '-from-commits')).length}`)
      } catch (prError: any) {
        console.warn('    Failed to search PRs:', prError.message)
      }

      console.log(`✅ Total contributed repos found via search: ${repos.length}`)
      return repos
    } catch (error) {
      console.error('Failed to search contributed repos:', error)
      return []
    }
  }

  // Discover repositories through user's public events (push, PR, etc.)
  // This catches repos that search API might miss due to age or indexing
  async discoverReposFromUserEvents(username: string) {
    try {
      const repoSet = new Set<string>()
      const repos = []

      console.log(`🔍 Discovering repos from ${username}'s public events...`)

      // Fetch public events (up to 300 - 10 pages × 30 per page, GitHub limit)
      let page = 1
      let hasMore = true

      while (hasMore && page <= 10) {
        try {
          const { data: events } = await this.octokit.rest.activity.listPublicEventsForUser({
            username,
            per_page: 100,
            page
          })

          console.log(`  Page ${page}: Found ${events.length} events`)

          // Extract repos from events
          for (const event of events) {
            if (event.repo && event.type && !repoSet.has(event.repo.name)) {
              // Event types that indicate contribution:
              // PushEvent, PullRequestEvent, IssuesEvent, IssueCommentEvent, etc.
              const contributionEvents = ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'IssueCommentEvent', 'PullRequestReviewEvent', 'PullRequestReviewCommentEvent']

              if (contributionEvents.includes(event.type)) {
                try {
                  const [owner, repo] = event.repo.name.split('/')
                  const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo })

                  if (!repoSet.has(repoData.full_name)) {
                    repoSet.add(repoData.full_name)
                    repos.push(repoData)
                  }
                } catch (error) {
                  console.error(`    Failed to fetch repo ${event.repo.name}:`, error)
                }
              }
            }
          }

          if (events.length < 100) {
            hasMore = false
          } else {
            page++
          }
        } catch (error: any) {
          console.warn(`  Failed to fetch events page ${page}:`, error.message)
          hasMore = false
        }
      }

      console.log(`✅ Discovered ${repos.length} repos from public events`)
      return repos
    } catch (error) {
      console.error('Failed to discover repos from events:', error)
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

  // Fetch ALL commits with pagination (optionally filtered by author)
  async getAllRepoCommits(owner: string, repo: string, author?: string, since?: Date, until?: Date) {
    const allCommits = []
    let page = 1
    let hasMore = true

    console.log(`🔍 Fetching ALL commits for ${owner}/${repo}${author ? ` by ${author}` : ''}...`)

    while (hasMore) {
      try {
        const params: any = {
          owner,
          repo,
          per_page: 100,
          page
        }

        if (author) params.author = author
        if (since) params.since = since.toISOString()
        if (until) params.until = until.toISOString()

        const { data } = await this.octokit.rest.repos.listCommits(params)

        allCommits.push(...data)
        console.log(`  Page ${page}: Found ${data.length} commits (total: ${allCommits.length})`)

        if (data.length < 100) {
          hasMore = false
        } else {
          page++
        }
      } catch (error: any) {
        // If we get a 409 (empty repo) or 404, stop
        if (error.status === 409 || error.status === 404) {
          console.log(`  Repo has no commits or is empty`)
          hasMore = false
        } else {
          console.error(`  Failed to fetch commits page ${page}:`, error.message)
          hasMore = false
        }
      }
    }

    console.log(`✅ Total commits fetched: ${allCommits.length}`)
    return allCommits
  }

  // Legacy method - kept for backward compatibility
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

  // Fetch ALL pull requests with pagination (optionally filtered by creator)
  async getAllRepoPullRequests(owner: string, repo: string, creator?: string, state: 'open' | 'closed' | 'all' = 'all') {
    const allPRs = []
    let page = 1
    let hasMore = true

    console.log(`🔍 Fetching ALL PRs for ${owner}/${repo}${creator ? ` by ${creator}` : ''}...`)

    while (hasMore) {
      try {
        const params: any = {
          owner,
          repo,
          state,
          per_page: 100,
          page,
          sort: 'updated',
          direction: 'desc'
        }

        if (creator) params.creator = creator

        const { data } = await this.octokit.rest.pulls.list(params)

        allPRs.push(...data)
        console.log(`  Page ${page}: Found ${data.length} PRs (total: ${allPRs.length})`)

        if (data.length < 100) {
          hasMore = false
        } else {
          page++
        }
      } catch (error: any) {
        console.error(`  Failed to fetch PRs page ${page}:`, error.message)
        hasMore = false
      }
    }

    console.log(`✅ Total PRs fetched: ${allPRs.length}`)
    return allPRs
  }

  // Legacy method - kept for backward compatibility
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
        encryptedAccessToken: encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken,
        scope: 'repo user:email read:org'
      }
    })
  }

  // Get GitHub connection from database
  static async getConnection(employeeId: string) {
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId }
    })

    if (!connection || !connection.encryptedAccessToken) return null

    return {
      ...connection,
      accessToken: decrypt(connection.encryptedAccessToken),
      refreshToken: connection.encryptedRefreshToken ? decrypt(connection.encryptedRefreshToken) : null
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
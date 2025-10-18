import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers, eventLoggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'
import { GitHubAutoDiscoveryService } from '@/services/github/auto-discovery'

const logger = loggers.apiRequest('POST', '/api/github/sync')
const discoveryService = new GitHubAutoDiscoveryService()

export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // Get employee record
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  const employeeLogger = logger.withEmployee(employee.id)

  employeeLogger.info('Starting GitHub sync', {
    syncType: 'organization_based',
    hasGitHubUsername: !!employee.githubUsername
  })

  try {
    let syncResult: any

    if (session.user.role === 'company_admin') {
      // Company admin can sync entire organization
      syncResult = await syncOrganizationData(employee.companyId, employeeLogger)
    } else {
      // Regular employee syncs their individual contributions
      syncResult = await syncEmployeeContributions(employee.id, employeeLogger)
    }

    employeeLogger.info('GitHub sync completed successfully', syncResult)

    return apiResponse.success(syncResult, 'GitHub sync completed successfully')

  } catch (error: any) {
    employeeLogger.error('GitHub sync failed', error)
    console.error('GitHub sync error:', error)

    // Return user-friendly error message
    return apiResponse.error(
      error?.message || 'Failed to sync GitHub repositories',
      error?.statusCode || 500
    )
  }
})

/**
 * Sync entire organization data (admin only)
 */
async function syncOrganizationData(companyId: string, logger: any) {
  // Check if GitHub App is installed
  const installation = await db.gitHubInstallation.findFirst({
    where: { companyId, isActive: true }
  })

  if (!installation) {
    throw new NotFoundError('GitHub App installation', companyId)
  }

  // Sync organization repositories
  const repoSyncResult = await enhancedGitHubService.syncOrganizationRepositories(companyId)
  logger.info('Repository sync completed', repoSyncResult)

  // Sync commits for all repositories
  logger.info('Starting commit sync...')
  const commitSyncResult = await syncCommitsForCompany(companyId, logger)
  logger.info('Commit sync completed', commitSyncResult)

  // Sync pull requests for all repositories
  logger.info('Starting PR sync...')
  const prSyncResult = await syncPullRequestsForCompany(companyId, logger)
  logger.info('PR sync completed', prSyncResult)

  // Discover and match employees
  const discoveryResult = await discoveryService.discoverOrganizationMembers(companyId)

  // Generate skills for all discovered employees
  await discoveryService.generateSkillsForDiscoveredEmployees(companyId)

  // Get final statistics
  const [totalEmployees, totalRepositories, totalSkills, totalCommits, totalPRs] = await Promise.all([
    db.employee.count({ where: { companyId } }),
    db.repository.count({
      where: {
        companyId
      }
    }),
    db.skillRecord.count({
      where: {
        employee: { companyId }
      }
    }),
    db.commit.count({
      where: {
        repository: { companyId }
      }
    }),
    db.pullRequest.count({
      where: {
        repository: { companyId }
      }
    })
  ])

  return {
    type: 'organization_sync',
    repositories: repoSyncResult,
    commits: commitSyncResult,
    pullRequests: prSyncResult,
    discovery: discoveryResult,
    totals: {
      employees: totalEmployees,
      repositories: totalRepositories,
      skills: totalSkills,
      commits: totalCommits,
      pullRequests: totalPRs
    },
    nextSteps: [
      'Review employee-GitHub matches in the admin dashboard',
      'Set up webhooks for real-time updates',
      'Configure automatic certificate generation'
    ]
  }
}

/**
 * Sync individual employee contributions
 */
async function syncEmployeeContributions(employeeId: string, logger: any) {
  console.log('Starting syncEmployeeContributions for:', employeeId)

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { githubConnection: true }
  })

  console.log('Employee found:', employee?.id, 'GitHub connected:', !!employee?.githubConnection)

  if (!employee) {
    throw new NotFoundError('Employee', employeeId)
  }

  // Check if employee has GitHub connected
  if (!employee.githubConnection || !employee.githubUsername) {
    console.error('No GitHub connection found for employee:', employeeId)
    throw new NotFoundError(
      'GitHub connection',
      'Please connect your GitHub account first'
    )
  }

  // Get GitHub client using employee's OAuth token
  console.log('Getting GitHub client for employee:', employeeId)
  const { GitHubService } = await import('@/services/github/client')
  const connection = await GitHubService.getConnection(employeeId)
  console.log('Connection retrieved:', !!connection)

  if (!connection) {
    throw new NotFoundError('GitHub connection', 'Connection not found')
  }

  const github = new GitHubService(connection.accessToken)

  // Comprehensive repository fetching strategy - PRIMARY: GraphQL, FALLBACK: REST API
  const allRepos = new Map<string, any>() // Use Map to deduplicate by full_name

  console.log('=== COMPREHENSIVE REPO SYNC (GraphQL + REST FALLBACK) ===')

  if (employee.githubUsername) {
    // PRIMARY: Use GraphQL to fetch ALL repos (owned + contributed) - Most comprehensive!
    console.log('🚀 Using GraphQL to fetch ALL repositories (owned + contributed)...')
    const graphqlRepos = await github.getAllRepositoriesViaGraphQL(employee.githubUsername)

    if (graphqlRepos.length > 0) {
      console.log(`   ✅ Found ${graphqlRepos.length} repos via GraphQL (owned + contributed)`)
      graphqlRepos.forEach(repo => allRepos.set(repo.full_name, repo))
    } else {
      // FALLBACK: If GraphQL fails or returns no results, use REST API methods
      console.log('⚠️ GraphQL returned no results, falling back to REST API methods...')

      // 1. Fetch owned, collaborator, and org member repos
      console.log('1. Fetching ALL owned, collaborator, and org repos (REST)...')
      const ownedRepos = await github.getAllAccessibleRepos()
      console.log(`   ✅ Found ${ownedRepos.length} owned/collaborator/org repos`)
      ownedRepos.forEach(repo => allRepos.set(repo.full_name, repo))

      // 2. Fetch public repos via public API
      console.log('2. Fetching public repos via public API (REST)...')
      let page = 1
      let hasMore = true
      let publicRepoCount = 0

      while (hasMore && page <= 10) {
        const publicRepos = await github.getUserRepos(employee.githubUsername, page, 100)
        publicRepos.forEach(repo => allRepos.set(repo.full_name, repo))
        publicRepoCount += publicRepos.length

        if (publicRepos.length < 100) {
          hasMore = false
        } else {
          page++
        }
      }
      console.log(`   ✅ Found ${publicRepoCount} public repos`)

      // 3. Search for contributed repos via commits and PRs
      console.log('3. Searching for ALL contributed repos (commits + PRs)...')
      const contributedRepos = await github.searchContributedRepos(employee.githubUsername)
      console.log(`   ✅ Found ${contributedRepos.length} contributed repos via search`)
      contributedRepos.forEach(repo => allRepos.set(repo.full_name, repo))

      // 4. Discover repos from user's public events
      console.log('4. Discovering repos from public events...')
      const eventRepos = await github.discoverReposFromUserEvents(employee.githubUsername)
      console.log(`   ✅ Found ${eventRepos.length} repos from events`)
      eventRepos.forEach(repo => allRepos.set(repo.full_name, repo))
    }
  } else {
    // No GitHub username - fall back to accessible repos only
    console.log('No GitHub username found, fetching accessible repos only...')
    const ownedRepos = await github.getAllAccessibleRepos()
    console.log(`   ✅ Found ${ownedRepos.length} accessible repos`)
    ownedRepos.forEach(repo => allRepos.set(repo.full_name, repo))
  }

  const repos = Array.from(allRepos.values())
  console.log(`=== TOTAL UNIQUE REPOS: ${repos.length} ===`)
  logger.info(`Found ${repos.length} total repositories (GraphQL/REST combined)`)

  // Save repositories to database
  let savedRepos = 0
  let linkedRepos = 0

  for (const repo of repos) {
    const existingRepo = await db.repository.findFirst({
      where: { githubRepoId: String(repo.id) }
    })

    let repositoryId: string

    if (existingRepo) {
      await db.repository.update({
        where: { id: existingRepo.id },
        data: {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          primaryLanguage: repo.language,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          isPrivate: repo.private,
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
        }
      })
      repositoryId = existingRepo.id
      console.log(`✅ Updated existing repo: ${repo.full_name}`)
    } else {
      const newRepo = await db.repository.create({
        data: {
          companyId: employee.companyId,
          githubRepoId: String(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          homepage: repo.homepage,
          defaultBranch: repo.default_branch || 'main',
          githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
          primaryLanguage: repo.language,
          languages: {},
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          watchers: repo.watchers_count || 0,
          size: repo.size || 0,
          openIssues: repo.open_issues_count || 0,
          isPrivate: repo.private,
          isFork: repo.fork || false,
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
        }
      })
      repositoryId = newRepo.id
      savedRepos++
      console.log(`✅ Created new repo: ${repo.full_name}`)
    }

    // 🔥 CRITICAL FIX: Create/update employeeRepository relationship for BOTH new AND existing repos
    const employeeRepoRelationship = await db.employeeRepository.upsert({
      where: {
        employeeId_repositoryId: {
          employeeId: employeeId,
          repositoryId: repositoryId
        }
      },
      update: {
        isContributor: true,
        updatedAt: new Date()
      },
      create: {
        employeeId: employeeId,
        repositoryId: repositoryId,
        isContributor: true
      }
    })

    linkedRepos++
    console.log(`✅ Linked employee to repo: ${repo.full_name}`)
  }

  console.log(`=== REPO SYNC SUMMARY: ${savedRepos} new, ${linkedRepos} total linked ===`)

  // Sync commits and PRs for this employee across all their repositories
  console.log('=== SYNCING COMMITS AND PRS WITH FULL PAGINATION (10 YEAR HISTORY) ===')

  let totalCommitsSynced = 0
  let totalPRsSynced = 0

  // Calculate date range: last 10 years
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
  console.log(`📅 Fetching commits and PRs from ${tenYearsAgo.toISOString()} to now`)

  // Get all repositories this employee has access to from database
  const employeeRepos = await db.employeeRepository.findMany({
    where: { employeeId },
    include: { repository: true }
  })

  console.log(`Syncing commits and PRs for ${employeeRepos.length} repositories...`)

  for (const empRepo of employeeRepos) {
    const repo = empRepo.repository
    try {
      const [owner, repoName] = repo.fullName.split('/')

      // Sync ALL commits by this employee (NOW WITH PAGINATION + 10 YEAR HISTORY)
      console.log(`Fetching ALL commits for ${repo.fullName} by ${employee.githubUsername}...`)
      const commits = await github.getAllRepoCommits(
        owner,
        repoName,
        employee.githubUsername,
        tenYearsAgo
      )

      console.log(`  ✅ Found ${commits.length} commits by ${employee.githubUsername}`)

      for (const commit of commits) {
        try {
          await db.commit.upsert({
            where: {
              repositoryId_sha: {
                repositoryId: repo.id,
                sha: commit.sha
              }
            },
            update: {
              message: commit.commit.message,
              authorName: commit.commit.author?.name || employee.githubUsername,
              authorEmail: commit.commit.author?.email || 'unknown@example.com',
              authorDate: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
              committerName: commit.commit.committer?.name,
              committerEmail: commit.commit.committer?.email,
              commitDate: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : new Date()
            },
            create: {
              repositoryId: repo.id,
              sha: commit.sha,
              message: commit.commit.message,
              authorName: commit.commit.author?.name || employee.githubUsername,
              authorEmail: commit.commit.author?.email || 'unknown@example.com',
              authorDate: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
              committerName: commit.commit.committer?.name,
              committerEmail: commit.commit.committer?.email,
              commitDate: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : new Date()
            }
          })
          totalCommitsSynced++
        } catch (commitError) {
          console.warn(`Failed to save commit ${commit.sha}:`, commitError)
        }
      }

      // Sync ALL PRs by this employee (NOW WITH PAGINATION)
      console.log(`Fetching ALL PRs for ${repo.fullName} by ${employee.githubUsername}...`)
      const pullRequests = await github.getAllRepoPullRequests(
        owner,
        repoName,
        employee.githubUsername,
        'all'
      )

      console.log(`  ✅ Found ${pullRequests.length} PRs by ${employee.githubUsername}`)

      for (const pr of pullRequests) {
        try {
          // Fetch full PR details
          const { data: fullPR } = await github.octokit.rest.pulls.get({
            owner,
            repo: repoName,
            pull_number: pr.number
          })

          await db.pullRequest.upsert({
            where: {
              repositoryId_number: {
                repositoryId: repo.id,
                number: pr.number
              }
            },
            update: {
              title: fullPR.title,
              body: fullPR.body || '',
              state: fullPR.state,
              authorUsername: fullPR.user?.login || employee.githubUsername,
              authorEmail: fullPR.user?.email,
              headBranch: fullPR.head.ref,
              baseBranch: fullPR.base.ref,
              isDraft: fullPR.draft || false,
              isMerged: fullPR.merged_at !== null,
              additions: fullPR.additions || 0,
              deletions: fullPR.deletions || 0,
              changedFiles: fullPR.changed_files || 0,
              commits: fullPR.commits || 0,
              comments: fullPR.comments || 0,
              reviewComments: fullPR.review_comments || 0,
              updatedAt: fullPR.updated_at ? new Date(fullPR.updated_at) : new Date(),
              closedAt: fullPR.closed_at ? new Date(fullPR.closed_at) : null,
              mergedAt: fullPR.merged_at ? new Date(fullPR.merged_at) : null,
              htmlUrl: fullPR.html_url,
              apiUrl: fullPR.url,
              labels: fullPR.labels?.map(l => typeof l === 'string' ? l : l.name) || [],
              assignees: fullPR.assignees?.map(a => a.login) || [],
              requestedReviewers: fullPR.requested_reviewers?.map(r => r.login) || [],
              mergedBy: fullPR.merged_by?.login
            },
            create: {
              repositoryId: repo.id,
              number: fullPR.number,
              title: fullPR.title,
              body: fullPR.body || '',
              state: fullPR.state,
              authorUsername: fullPR.user?.login || employee.githubUsername,
              authorEmail: fullPR.user?.email,
              headBranch: fullPR.head.ref,
              baseBranch: fullPR.base.ref,
              isDraft: fullPR.draft || false,
              isMerged: fullPR.merged_at !== null,
              additions: fullPR.additions || 0,
              deletions: fullPR.deletions || 0,
              changedFiles: fullPR.changed_files || 0,
              commits: fullPR.commits || 0,
              comments: fullPR.comments || 0,
              reviewComments: fullPR.review_comments || 0,
              createdAt: fullPR.created_at ? new Date(fullPR.created_at) : new Date(),
              updatedAt: fullPR.updated_at ? new Date(fullPR.updated_at) : new Date(),
              closedAt: fullPR.closed_at ? new Date(fullPR.closed_at) : null,
              mergedAt: fullPR.merged_at ? new Date(fullPR.merged_at) : null,
              htmlUrl: fullPR.html_url,
              apiUrl: fullPR.url,
              labels: fullPR.labels?.map(l => typeof l === 'string' ? l : l.name) || [],
              assignees: fullPR.assignees?.map(a => a.login) || [],
              requestedReviewers: fullPR.requested_reviewers?.map(r => r.login) || [],
              mergedBy: fullPR.merged_by?.login
            }
          })
          totalPRsSynced++
        } catch (prError) {
          console.warn(`Failed to save PR #${pr.number}:`, prError)
        }
      }

    } catch (repoError: any) {
      console.error(`Failed to sync commits/PRs for ${repo.fullName}:`, repoError)
      // Continue with next repository
    }
  }

  console.log(`=== SYNC COMPLETE: ${totalCommitsSynced} commits, ${totalPRsSynced} PRs ===`)

  // Update last sync time
  await db.gitHubConnection.update({
    where: { employeeId },
    data: { updatedAt: new Date() }
  })

  // Get total repositories and skill count
  const [totalRepositories, skillCount, totalCommits, totalPRs] = await Promise.all([
    db.employeeRepository.count({ where: { employeeId } }),
    db.skillRecord.count({ where: { employeeId } }),
    db.commit.count({
      where: {
        repository: {
          employeeRepositories: {
            some: { employeeId }
          }
        }
      }
    }),
    db.pullRequest.count({
      where: {
        repository: {
          employeeRepositories: {
            some: { employeeId }
          }
        }
      }
    })
  ])

  return {
    type: 'employee_sync',
    totalRepos: repos.length,
    newRepos: savedRepos,
    repositories: totalRepositories,
    commits: {
      synced: totalCommitsSynced,
      total: totalCommits
    },
    pullRequests: {
      synced: totalPRsSynced,
      total: totalPRs
    },
    skillCount: skillCount,
    skills: {
      total: skillCount,
      updated: new Date().toISOString()
    }
  }
}

/**
 * Sync commits for all company repositories
 */
async function syncCommitsForCompany(companyId: string, logger: any) {
  // Get GitHub client
  const octokit = await enhancedGitHubService['getCompanyClient'](companyId)

  // Get all company repositories
  const repositories = await db.repository.findMany({
    where: { companyId }
  })

  let totalCommitsSynced = 0
  let reposProcessed = 0

  // Sync commits for each repository
  for (const repo of repositories) {
    try {
      const [owner, repoName] = repo.fullName.split('/')

      // Fetch recent commits (limit to 100 to avoid rate limits)
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo: repoName,
        per_page: 100
      })

      // Save commits to database
      for (const commit of commits) {
        try {
          await db.commit.upsert({
            where: {
              repositoryId_sha: {
                repositoryId: repo.id,
                sha: commit.sha
              }
            },
            update: {
              message: commit.commit.message,
              authorName: commit.commit.author?.name || 'Unknown',
              authorEmail: commit.commit.author?.email || 'unknown@example.com',
              authorDate: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
              committerName: commit.commit.committer?.name,
              committerEmail: commit.commit.committer?.email,
              commitDate: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : new Date()
            },
            create: {
              repositoryId: repo.id,
              sha: commit.sha,
              message: commit.commit.message,
              authorName: commit.commit.author?.name || 'Unknown',
              authorEmail: commit.commit.author?.email || 'unknown@example.com',
              authorDate: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
              committerName: commit.commit.committer?.name,
              committerEmail: commit.commit.committer?.email,
              commitDate: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : new Date()
            }
          })

          totalCommitsSynced++
        } catch (commitError) {
          logger.warn(`Failed to save commit ${commit.sha}`, { error: commitError })
        }
      }

      // Update repository with commit count
      await db.repository.update({
        where: { id: repo.id },
        data: {
          totalCommits: commits.length,
          updatedAt: new Date()
        }
      })

      reposProcessed++

    } catch (repoError: any) {
      logger.error(`Failed to sync commits for ${repo.fullName}`, repoError)
      // Continue with next repository
    }
  }

  return {
    repositoriesProcessed: reposProcessed,
    totalRepositories: repositories.length,
    commitsSynced: totalCommitsSynced
  }
}

/**
 * Sync pull requests for all company repositories
 */
async function syncPullRequestsForCompany(companyId: string, logger: any) {
  // Get GitHub client
  const octokit = await enhancedGitHubService['getCompanyClient'](companyId)

  // Get all company repositories
  const repositories = await db.repository.findMany({
    where: { companyId }
  })

  let totalPRsSynced = 0
  let reposProcessed = 0

  // Sync PRs for each repository
  for (const repo of repositories) {
    try {
      const [owner, repoName] = repo.fullName.split('/')

      // Fetch all PRs (open, closed, merged)
      const { data: pullRequests } = await octokit.rest.pulls.list({
        owner,
        repo: repoName,
        state: 'all',
        per_page: 100,
        sort: 'updated',
        direction: 'desc'
      })

      // Save PRs to database (fetch full details for each)
      for (const pr of pullRequests) {
        try {
          // Fetch full PR details to get stats
          const { data: fullPR } = await octokit.rest.pulls.get({
            owner,
            repo: repoName,
            pull_number: pr.number
          })

          await db.pullRequest.upsert({
            where: {
              repositoryId_number: {
                repositoryId: repo.id,
                number: pr.number
              }
            },
            update: {
              title: fullPR.title,
              body: fullPR.body || '',
              state: fullPR.state,
              authorUsername: fullPR.user?.login || 'unknown',
              authorEmail: fullPR.user?.email,
              headBranch: fullPR.head.ref,
              baseBranch: fullPR.base.ref,
              isDraft: fullPR.draft || false,
              isMerged: fullPR.merged_at !== null,
              additions: fullPR.additions || 0,
              deletions: fullPR.deletions || 0,
              changedFiles: fullPR.changed_files || 0,
              commits: fullPR.commits || 0,
              comments: fullPR.comments || 0,
              reviewComments: fullPR.review_comments || 0,
              updatedAt: fullPR.updated_at ? new Date(fullPR.updated_at) : new Date(),
              closedAt: fullPR.closed_at ? new Date(fullPR.closed_at) : null,
              mergedAt: fullPR.merged_at ? new Date(fullPR.merged_at) : null,
              htmlUrl: fullPR.html_url,
              apiUrl: fullPR.url,
              labels: fullPR.labels?.map(l => typeof l === 'string' ? l : l.name) || [],
              assignees: fullPR.assignees?.map(a => a.login) || [],
              requestedReviewers: fullPR.requested_reviewers?.map(r => r.login) || [],
              mergedBy: fullPR.merged_by?.login
            },
            create: {
              repositoryId: repo.id,
              number: fullPR.number,
              title: fullPR.title,
              body: fullPR.body || '',
              state: fullPR.state,
              authorUsername: fullPR.user?.login || 'unknown',
              authorEmail: fullPR.user?.email,
              headBranch: fullPR.head.ref,
              baseBranch: fullPR.base.ref,
              isDraft: fullPR.draft || false,
              isMerged: fullPR.merged_at !== null,
              additions: fullPR.additions || 0,
              deletions: fullPR.deletions || 0,
              changedFiles: fullPR.changed_files || 0,
              commits: fullPR.commits || 0,
              comments: fullPR.comments || 0,
              reviewComments: fullPR.review_comments || 0,
              createdAt: fullPR.created_at ? new Date(fullPR.created_at) : new Date(),
              updatedAt: fullPR.updated_at ? new Date(fullPR.updated_at) : new Date(),
              closedAt: fullPR.closed_at ? new Date(fullPR.closed_at) : null,
              mergedAt: fullPR.merged_at ? new Date(fullPR.merged_at) : null,
              htmlUrl: fullPR.html_url,
              apiUrl: fullPR.url,
              labels: fullPR.labels?.map(l => typeof l === 'string' ? l : l.name) || [],
              assignees: fullPR.assignees?.map(a => a.login) || [],
              requestedReviewers: fullPR.requested_reviewers?.map(r => r.login) || [],
              mergedBy: fullPR.merged_by?.login
            }
          })

          totalPRsSynced++
        } catch (prError) {
          logger.warn(`Failed to save PR #${pr.number}`, { error: prError })
        }
      }

      reposProcessed++

    } catch (repoError: any) {
      logger.error(`Failed to sync PRs for ${repo.fullName}`, repoError)
      // Continue with next repository
    }
  }

  return {
    repositoriesProcessed: reposProcessed,
    totalRepositories: repositories.length,
    prsSynced: totalPRsSynced
  }
}


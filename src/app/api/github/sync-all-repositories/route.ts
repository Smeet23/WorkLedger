import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

// POST /api/github/sync-all-repositories
// Syncs all repositories from GitHub for a company
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/sync-all-repositories')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  const body = await request.json()
  const { companyId } = body

  if (!companyId) {
    throw new ValidationError('companyId is required')
  }

  logger.info('Syncing all repositories', { userId: session.user.id, companyId })

  // Verify user belongs to this company and has admin role
  const employee = await db.employee.findFirst({
    where: {
      email: session.user.email,
      companyId: companyId
    }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  // Check if user is admin
  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can sync repositories')
  }

  try {
    // Check if GitHub App is installed
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId, isActive: true }
    })

    if (!installation) {
      throw new NotFoundError('GitHub App installation', companyId)
    }

    logger.info('Starting repository sync', {
      companyId,
      installationId: installation.installationId.toString()
    })

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

    // Get final statistics
    const [totalCommits, totalPRs] = await Promise.all([
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

    logger.info('Full sync completed successfully', {
      companyId,
      repositories: repoSyncResult.repositories,
      commits: totalCommits,
      pullRequests: totalPRs
    })

    return apiResponse.success({
      repositories: repoSyncResult.repositories,
      newRepositories: repoSyncResult.newRepositories,
      updatedRepositories: repoSyncResult.updatedRepositories,
      commits: commitSyncResult,
      pullRequests: prSyncResult,
      totals: {
        repositories: repoSyncResult.repositories,
        commits: totalCommits,
        pullRequests: totalPRs
      },
      message: `Synced ${repoSyncResult.repositories} repositories, ${totalCommits} commits, and ${totalPRs} pull requests`
    })
  } catch (error) {
    logger.error('Failed to sync repositories', error, { companyId })
    throw error
  }
})

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

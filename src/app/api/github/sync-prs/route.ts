import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

// POST /api/github/sync-prs
// Syncs pull requests for all repositories
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/sync-prs')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  // Get employee record
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  // Check if user is admin
  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can sync pull requests')
  }

  const companyLogger = logger.withCompany(employee.companyId)

  try {
    // Check if GitHub App is installed
    const installation = await db.gitHubInstallation.findFirst({
      where: { companyId: employee.companyId, isActive: true }
    })

    if (!installation) {
      throw new NotFoundError('GitHub App installation', employee.companyId)
    }

    companyLogger.info('Starting PR sync for all repositories')

    // Get GitHub client
    const octokit = await enhancedGitHubService['getCompanyClient'](employee.companyId)

    // Get all company repositories
    const repositories = await db.repository.findMany({
      where: { companyId: employee.companyId }
    })

    let totalPRsSynced = 0
    let reposProcessed = 0

    // Sync PRs for each repository
    for (const repo of repositories) {
      try {
        const [owner, repoName] = repo.fullName.split('/')

        companyLogger.info(`Syncing PRs for ${repo.fullName}`)

        // Fetch all PRs (open, closed, merged)
        const { data: pullRequests } = await octokit.rest.pulls.list({
          owner,
          repo: repoName,
          state: 'all',
          per_page: 100,
          sort: 'updated',
          direction: 'desc'
        })

        companyLogger.info(`Found ${pullRequests.length} PRs for ${repo.fullName}`)

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
            companyLogger.warn(`Failed to save PR #${pr.number}`, { error: prError })
          }
        }

        reposProcessed++

        companyLogger.info(`Synced ${pullRequests.length} PRs for ${repo.fullName}`)

      } catch (repoError: any) {
        companyLogger.error(`Failed to sync PRs for ${repo.fullName}`, repoError)
        // Continue with next repository
      }
    }

    companyLogger.info('PR sync completed', {
      repositoriesProcessed: reposProcessed,
      totalRepositories: repositories.length,
      prsSynced: totalPRsSynced
    })

    return apiResponse.success({
      repositoriesProcessed: reposProcessed,
      totalRepositories: repositories.length,
      prsSynced: totalPRsSynced,
      message: `Successfully synced ${totalPRsSynced} pull requests across ${reposProcessed} repositories`
    })

  } catch (error) {
    companyLogger.error('PR sync failed', error)
    throw error
  }
})

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

// POST /api/github/sync-commits
// Syncs commits for all repositories
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/sync-commits')

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
    throw new AuthenticationError('Only company admins can sync commits')
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

    companyLogger.info('Starting commit sync for all repositories')

    // Get GitHub client
    const octokit = await enhancedGitHubService['getCompanyClient'](employee.companyId)

    // Get all company repositories
    const repositories = await db.repository.findMany({
      where: { companyId: employee.companyId }
    })

    let totalCommitsSynced = 0
    let reposProcessed = 0

    // Sync commits for each repository
    for (const repo of repositories) {
      try {
        const [owner, repoName] = repo.fullName.split('/')

        companyLogger.info(`Syncing commits for ${repo.fullName}`)

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
            companyLogger.warn(`Failed to save commit ${commit.sha}`, { error: commitError })
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

        companyLogger.info(`Synced ${commits.length} commits for ${repo.fullName}`)

      } catch (repoError: any) {
        companyLogger.error(`Failed to sync commits for ${repo.fullName}`, repoError)
        // Continue with next repository
      }
    }

    companyLogger.info('Commit sync completed', {
      repositoriesProcessed: reposProcessed,
      totalRepositories: repositories.length,
      commitsSynced: totalCommitsSynced
    })

    return apiResponse.success({
      repositoriesProcessed: reposProcessed,
      totalRepositories: repositories.length,
      commitsSynced: totalCommitsSynced,
      message: `Successfully synced ${totalCommitsSynced} commits across ${reposProcessed} repositories`
    })

  } catch (error) {
    companyLogger.error('Commit sync failed', error)
    throw error
  }
})

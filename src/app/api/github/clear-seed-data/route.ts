import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'

// DELETE /api/github/clear-seed-data
// Clears seed/fake repositories to prepare for real GitHub sync
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('DELETE', '/api/github/clear-seed-data')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  // Only company admins can clear seed data
  if (session.user.role !== 'company_admin') {
    throw new AuthenticationError('Only company admins can clear seed data')
  }

  logger.info('Clearing seed repositories', { userId: session.user.id })

  // Get user's company
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyId = employee.company.id
  const companyLogger = logger.withCompany(companyId)

  try {
    // Find all repositories with fake GitHub IDs (seed data)
    // Seed data uses githubRepoId like '12345001', '12345002', etc.
    const seedRepos = await db.repository.findMany({
      where: {
        companyId: companyId,
        githubRepoId: { startsWith: '12345' }
      },
      include: {
        _count: {
          select: {
            employeeRepositories: true,
            commits: true
          }
        }
      }
    })

    companyLogger.info('Found seed repositories to clear', {
      count: seedRepos.length,
      repositories: seedRepos.map(r => r.name)
    })

    // Delete related data first (foreign key constraints)
    for (const repo of seedRepos) {
      // Delete employee-repository relationships
      await db.employeeRepository.deleteMany({
        where: { repositoryId: repo.id }
      })

      // Delete commits
      await db.commit.deleteMany({
        where: { repositoryId: repo.id }
      })

      // Delete repository activities
      await db.repositoryActivity.deleteMany({
        where: { repositoryId: repo.id }
      })
    }

    // Delete the seed repositories
    const deletedCount = await db.repository.deleteMany({
      where: {
        id: {
          in: seedRepos.map(r => r.id)
        }
      }
    })

    companyLogger.info('Seed repositories cleared successfully', {
      deletedRepositories: deletedCount.count,
      repositoryNames: seedRepos.map(r => r.name)
    })

    return apiResponse.success({
      deletedCount: deletedCount.count,
      repositories: seedRepos.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName
      })),
      message: `Successfully deleted ${deletedCount.count} seed repositories. You can now sync with your actual GitHub repositories.`
    })
  } catch (error) {
    companyLogger.error('Failed to clear seed repositories', error)
    throw error
  }
})

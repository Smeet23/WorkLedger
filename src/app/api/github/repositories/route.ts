import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'

// GET /api/github/repositories
// Returns repositories for a company
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/repositories')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  // Get companyId from query params
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    throw new ValidationError('companyId is required')
  }

  logger.info('Fetching repositories', { userId: session.user.id, companyId })

  // Verify user belongs to this company
  const employee = await db.employee.findFirst({
    where: {
      email: session.user.email,
      companyId: companyId
    }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  try {
    // Fetch repositories for the company
    const repositories = await db.repository.findMany({
      where: {
        companyId: companyId
      },
      include: {
        _count: {
          select: {
            commits: true
          }
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    })

    // Transform the data to match the component's expected format
    const formattedRepos = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      isPrivate: repo.isPrivate,
      primaryLanguage: repo.primaryLanguage,
      languages: repo.languages || {},
      lastActivityAt: repo.lastActivityAt?.toISOString() || null,
      totalCommits: repo._count.commits,
      syncStatus: 'synced' as const, // Default status
      syncProgress: 100
    }))

    logger.info('Repositories fetched successfully', {
      companyId,
      count: formattedRepos.length
    })

    return apiResponse.success(formattedRepos)
  } catch (error) {
    logger.error('Failed to fetch repositories', error, { companyId })
    throw error
  }
})

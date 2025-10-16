import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'

// POST /api/github/sync-repository
// Syncs a single repository from GitHub
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/sync-repository')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  const body = await request.json()
  const { repositoryId, companyId } = body

  if (!repositoryId || !companyId) {
    throw new ValidationError('repositoryId and companyId are required')
  }

  logger.info('Syncing repository', { userId: session.user.id, repositoryId, companyId })

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
    // Find the repository
    const repository = await db.repository.findUnique({
      where: { id: repositoryId }
    })

    if (!repository) {
      throw new NotFoundError('Repository', repositoryId)
    }

    if (repository.companyId !== companyId) {
      throw new AuthenticationError('Repository does not belong to your company')
    }

    // Update the repository's last activity timestamp
    await db.repository.update({
      where: { id: repositoryId },
      data: {
        updatedAt: new Date()
      }
    })

    logger.info('Repository synced successfully', {
      repositoryId,
      repositoryName: repository.name
    })

    return apiResponse.success({
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName
      },
      message: `Repository ${repository.name} synced successfully`
    })
  } catch (error) {
    logger.error('Failed to sync repository', error, { repositoryId, companyId })
    throw error
  }
})

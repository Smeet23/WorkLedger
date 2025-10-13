import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'

// GET /api/github/installation/status
// Returns the GitHub App installation status for the company
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/installation/status')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('You must be logged in')
  }

  logger.info('Fetching GitHub installation status', { userId: session.user.id })

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
    // Check for GitHub App installation
    const installation = await db.gitHubInstallation.findFirst({
      where: {
        companyId: companyId,
        isActive: true
      },
      orderBy: {
        installedAt: 'desc'
      }
    })

    if (!installation) {
      companyLogger.info('No GitHub App installation found')
      return apiResponse.success({
        installation: null,
        stats: {
          totalEmployees: 0,
          discoveredEmployees: 0,
          unmatchedMembers: 0,
          syncedRepositories: 0,
          detectedSkills: 0
        }
      })
    }

    // Get statistics
    const [
      totalEmployees,
      discoveredEmployees,
      unmatchedMembers,
      syncedRepositories,
      detectedSkills
    ] = await Promise.all([
      // Total active employees
      db.employee.count({
        where: {
          companyId: companyId,
          isActive: true
        }
      }),

      // Employees discovered from GitHub
      db.employee.count({
        where: {
          companyId: companyId,
          autoDiscovered: true,
          isActive: true
        }
      }),

      // GitHub org members not matched to employees
      db.gitHubOrganizationMember.count({
        where: {
          companyId: companyId,
          employeeId: null,
          isActive: true
        }
      }),

      // Synced repositories
      db.repository.count({
        where: {
          employee: {
            companyId: companyId
          }
        }
      }),

      // Detected skills
      db.skillRecord.count({
        where: {
          employee: {
            companyId: companyId
          },
          source: 'GITHUB'
        }
      })
    ])

    companyLogger.info('GitHub installation status fetched', {
      installationId: installation.installationId.toString(),
      stats: {
        totalEmployees,
        discoveredEmployees,
        unmatchedMembers,
        syncedRepositories,
        detectedSkills
      }
    })

    return apiResponse.success({
      installation: {
        id: installation.id,
        installationId: installation.installationId.toString(),
        companyId: installation.companyId,
        accountLogin: installation.accountLogin,
        accountId: installation.accountId.toString(),
        accountType: installation.accountType,
        repositorySelection: installation.repositorySelection,
        isActive: installation.isActive,
        installedAt: installation.installedAt,
        updatedAt: installation.updatedAt
      },
      stats: {
        totalEmployees,
        discoveredEmployees,
        unmatchedMembers,
        syncedRepositories,
        detectedSkills
      }
    })
  } catch (error) {
    companyLogger.error('Failed to fetch GitHub installation status', error)
    throw error
  }
})

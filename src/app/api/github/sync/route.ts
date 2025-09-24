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

  } catch (error) {
    employeeLogger.error('GitHub sync failed', error)
    throw error
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

  // Discover and match employees
  const discoveryResult = await discoveryService.discoverOrganizationMembers(companyId)

  // Generate skills for all discovered employees
  await discoveryService.generateSkillsForDiscoveredEmployees(companyId)

  // Get final statistics
  const [totalEmployees, totalRepositories, totalSkills] = await Promise.all([
    db.employee.count({ where: { companyId } }),
    db.repository.count({ where: { companyId } }),
    db.skillRecord.count({
      where: {
        employee: { companyId }
      }
    })
  ])

  return {
    type: 'organization_sync',
    repositories: repoSyncResult,
    discovery: discoveryResult,
    totals: {
      employees: totalEmployees,
      repositories: totalRepositories,
      skills: totalSkills
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
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { gitHubConnection: true }
  })

  if (!employee) {
    throw new NotFoundError('Employee', employeeId)
  }

  // If employee doesn't have GitHub connected, try auto-discovery
  if (!employee.githubUsername) {
    const orgMember = await db.gitHubOrganizationMember.findFirst({
      where: {
        companyId: employee.companyId,
        employeeId: employee.id
      }
    })

    if (!orgMember) {
      throw new NotFoundError(
        'GitHub connection',
        'Employee not connected to GitHub and not found in organization'
      )
    }
  }

  // Match employee contributions to organization repositories
  const matchResult = await enhancedGitHubService.matchEmployeeContributions(employeeId)

  // Re-generate skills based on updated contribution data
  if (employee.githubUsername) {
    await discoveryService.generateEmployeeSkillsFromOrgData(employeeId, employee.githubUsername)
  }

  // Get updated skill count
  const skillCount = await db.skillRecord.count({
    where: { employeeId }
  })

  return {
    type: 'employee_sync',
    contributions: matchResult,
    skills: {
      total: skillCount,
      updated: new Date().toISOString()
    },
    recommendations: generateEmployeeRecommendations(matchResult, skillCount)
  }
}

/**
 * Generate recommendations for employee based on sync results
 */
function generateEmployeeRecommendations(matchResult: any, skillCount: number): string[] {
  const recommendations: string[] = []

  if (matchResult.matchedRepositories === 0) {
    recommendations.push('No repository contributions found - ensure you\'re committing with the correct email address')
    recommendations.push('Contact your admin to verify your GitHub username is correctly linked')
  }

  if (skillCount === 0) {
    recommendations.push('No skills detected - make sure you\'re contributing to repositories with recognizable programming languages')
  }

  if (skillCount > 0 && skillCount < 5) {
    recommendations.push('Consider diversifying your technical skills by contributing to different types of projects')
  }

  if (matchResult.totalCommits > 100) {
    recommendations.push('Great activity level! Consider generating a skill certificate to showcase your expertise')
  }

  return recommendations
}
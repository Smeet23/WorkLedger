import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthorizationError, NotFoundError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { GitHubAutoDiscoveryService } from '@/services/github/auto-discovery'
import { db } from '@/lib/db'

const discoveryService = new GitHubAutoDiscoveryService()
const logger = loggers.apiRequest('POST', '/api/github/auto-discover')

// Trigger automatic employee discovery
export const POST = withErrorHandling(async (_request: NextRequest) => {
  const apiResponse = createApiResponse()

  // Authentication check
  const session = await getServerSession()
  if (!session?.user || session.user.role !== 'company_admin') {
    throw new AuthorizationError('Only company administrators can trigger employee discovery')
  }

  // Get admin's company
  const adminEmployee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!adminEmployee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyLogger = logger.withCompany(adminEmployee.company.id)

  companyLogger.info('Starting automatic employee discovery', {
    adminId: session.user.id,
    companyName: adminEmployee.company.name
  })

  try {
    // Check if GitHub App is installed
    const installation = await db.gitHubInstallation.findFirst({
      where: {
        companyId: adminEmployee.company.id,
        isActive: true
      }
    })

    if (!installation) {
      return apiResponse.badRequest(
        'GitHub App must be installed before running employee discovery',
        {
          installationRequired: true,
          installationUrl: '/dashboard/integrations/github/install'
        }
      )
    }

    // Run discovery process
    const discoveryResult = await discoveryService.discoverOrganizationMembers(
      adminEmployee.company.id
    )

    companyLogger.info('Employee discovery completed', discoveryResult)

    // Generate skills for discovered employees
    await discoveryService.generateSkillsForDiscoveredEmployees(
      adminEmployee.company.id
    )

    companyLogger.info('Skills generation completed for discovered employees')

    // Get summary statistics
    const [totalEmployees, discoveredEmployees, unmatchedMembers] = await Promise.all([
      db.employee.count({
        where: { companyId: adminEmployee.company.id }
      }),
      db.employee.count({
        where: {
          companyId: adminEmployee.company.id,
          autoDiscovered: true
        }
      }),
      db.gitHubOrganizationMember.count({
        where: {
          companyId: adminEmployee.company.id,
          employeeId: null
        }
      })
    ])

    return apiResponse.success({
      discovery: discoveryResult,
      summary: {
        totalEmployees,
        discoveredEmployees,
        unmatchedMembers,
        discoveryRate: totalEmployees > 0 ? (discoveredEmployees / totalEmployees) * 100 : 0
      },
      nextSteps: unmatchedMembers > 0 ? [
        'Review unmatched GitHub organization members',
        'Manually link unmatched members to employees',
        'Consider inviting missing team members to the organization'
      ] : [
        'Employee discovery is complete',
        'Skills are being automatically tracked',
        'Review team skill matrix in the dashboard'
      ]
    })

  } catch (error) {
    companyLogger.error('Employee discovery failed', error)
    throw error
  }
})

// Get discovery status and unmatched members
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()

  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthorizationError('Authentication required')
  }

  const adminEmployee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!adminEmployee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  // Get discovery statistics
  const [
    totalEmployees,
    discoveredEmployees,
    unmatchedMembers,
    gitHubInstallation
  ] = await Promise.all([
    db.employee.count({
      where: { companyId: adminEmployee.company.id }
    }),
    db.employee.count({
      where: {
        companyId: adminEmployee.company.id,
        autoDiscovered: true
      }
    }),
    db.gitHubOrganizationMember.findMany({
      where: {
        companyId: adminEmployee.company.id,
        employeeId: null
      },
      select: {
        githubUsername: true,
        githubName: true,
        githubEmail: true,
        matchConfidence: true,
        discoveredAt: true
      }
    }),
    db.gitHubInstallation.findFirst({
      where: {
        companyId: adminEmployee.company.id,
        isActive: true
      }
    })
  ])

  const discoveryRate = totalEmployees > 0 ? (discoveredEmployees / totalEmployees) * 100 : 0

  return apiResponse.success({
    status: {
      hasGitHubInstallation: !!gitHubInstallation,
      organizationLogin: gitHubInstallation?.accountLogin,
      totalEmployees,
      discoveredEmployees,
      discoveryRate: Math.round(discoveryRate * 100) / 100,
      unmatchedMembersCount: unmatchedMembers.length
    },
    unmatchedMembers: unmatchedMembers.map(member => ({
      githubUsername: member.githubUsername,
      githubName: member.githubName,
      githubEmail: member.githubEmail,
      suggestedConfidence: member.matchConfidence,
      discoveredAt: member.discoveredAt
    })),
    recommendations: generateRecommendations(
      discoveryRate,
      unmatchedMembers.length,
      !!gitHubInstallation
    )
  })
})

function generateRecommendations(
  discoveryRate: number,
  unmatchedCount: number,
  hasInstallation: boolean
): string[] {
  const recommendations: string[] = []

  if (!hasInstallation) {
    recommendations.push('Install the WorkLedger GitHub App to enable automatic discovery')
    return recommendations
  }

  if (discoveryRate < 50) {
    recommendations.push('Consider reviewing employee email addresses for better matching')
    recommendations.push('Check if employees are using different email addresses in GitHub')
  }

  if (unmatchedCount > 0) {
    recommendations.push(`Review ${unmatchedCount} unmatched GitHub organization members`)
    recommendations.push('Manually link unmatched members to existing employees')
  }

  if (discoveryRate > 90) {
    recommendations.push('Excellent discovery rate! Skills are being tracked automatically')
    recommendations.push('Consider setting up automatic skill certificates')
  }

  return recommendations
}
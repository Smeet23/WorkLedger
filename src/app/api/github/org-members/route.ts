import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

/**
 * GET /api/github/org-members
 * Fetch GitHub organization members for invitation linking
 * Manager-only endpoint
 */
export const GET = withCompanyAdmin(async (request, { companyId }) => {
  try {
    // Fetch all GitHub org members for this company
    const orgMembers = await db.gitHubOrganizationMember.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        githubUsername: 'asc'
      }
    })

    // Separate linked and unlinked members
    const unlinkedMembers = orgMembers.filter(m => !m.employeeId)
    const linkedMembers = orgMembers.filter(m => m.employeeId)

    return apiResponse.success({
      all: orgMembers.map(m => ({
        id: m.id,
        githubUsername: m.githubUsername,
        githubUserId: m.githubUserId.toString(),
        githubEmail: m.githubEmail,
        githubName: m.githubName,
        isLinked: !!m.employeeId,
        linkedEmployee: m.employee ? {
          id: m.employee.id,
          email: m.employee.email,
          name: `${m.employee.firstName} ${m.employee.lastName}`
        } : null
      })),
      unlinked: unlinkedMembers.map(m => ({
        id: m.id,
        githubUsername: m.githubUsername,
        githubUserId: m.githubUserId.toString(),
        githubEmail: m.githubEmail,
        githubName: m.githubName
      })),
      linked: linkedMembers.map(m => ({
        id: m.id,
        githubUsername: m.githubUsername,
        linkedTo: m.employee ? {
          id: m.employee.id,
          email: m.employee.email,
          name: `${m.employee.firstName} ${m.employee.lastName}`
        } : null
      })),
      summary: {
        total: orgMembers.length,
        linked: linkedMembers.length,
        unlinked: unlinkedMembers.length
      }
    })
  } catch (error) {
    console.error('Error fetching GitHub org members:', error)
    return apiResponse.internalError('Failed to fetch GitHub organization members')
  }
})

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/github/org-members
 * Fetch GitHub organization members for invitation linking
 * Manager-only endpoint
 */
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user || session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get manager's company
    const adminEmployee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!adminEmployee?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch all GitHub org members for this company
    const orgMembers = await db.gitHubOrganizationMember.findMany({
      where: {
        companyId: adminEmployee.company.id,
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

    return NextResponse.json({
      success: true,
      data: {
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
      }
    })

  } catch (error) {
    console.error('Error fetching GitHub org members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub organization members' },
      { status: 500 }
    )
  }
}

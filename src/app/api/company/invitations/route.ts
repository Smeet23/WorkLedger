import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user
    const admin = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Find the admin's employee record to get company
    const adminEmployee = await db.employee.findFirst({
      where: { email: admin.email },
      include: { company: true }
    })

    if (!adminEmployee?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all invitations for this company
    const invitations = await db.invitation.findMany({
      where: { companyId: adminEmployee.company.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        role: inv.role,
        title: inv.title,
        department: inv.department,
        status: inv.status,
        invitedBy: inv.invitedBy,
        invitedAt: inv.createdAt,
        expiresAt: inv.expiresAt
      })),
      total: invitations.length,
      pending: invitations.filter(i => i.status === 'pending').length,
      accepted: invitations.filter(i => i.status === 'accepted').length,
      expired: invitations.filter(i => i.status === 'expired').length
    })
  } catch (error) {
    console.error('Failed to fetch invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
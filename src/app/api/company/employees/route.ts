import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

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

    // Get all employees for this company
    const employees = await db.employee.findMany({
      where: { companyId: adminEmployee.company.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skillRecords: {
          include: { skill: true }
        },
        certificates: true,
        repositories: true,
        _count: {
          select: {
            skillRecords: true,
            certificates: true,
            repositories: true
          }
        }
      }
    })

    return NextResponse.json({
      employees: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        role: emp.role,
        title: emp.title,
        department: emp.department,
        isActive: emp.isActive,
        startDate: emp.startDate,
        skillCount: emp._count.skillRecords,
        certificateCount: emp._count.certificates,
        repositoryCount: emp._count.repositories
      })),
      total: employees.length
    })
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}
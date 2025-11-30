import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withCompanyAdmin(async (request, { companyId }) => {
  try {
    const employees = await db.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        skillRecords: {
          include: { skill: true }
        },
        certificates: true,
        employeeRepositories: true,
        _count: {
          select: {
            skillRecords: true,
            certificates: true,
            employeeRepositories: true
          }
        }
      }
    })

    return apiResponse.success({
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
        repositoryCount: emp._count.employeeRepositories
      })),
      total: employees.length
    })
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return apiResponse.internalError('Failed to fetch employees')
  }
})

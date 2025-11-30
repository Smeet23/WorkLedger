import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse, validateRequest } from '@/lib/api-response'
import { addProjectMemberSchema } from '@/lib/validations'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

// Helper function to extract project ID from URL
function extractProjectIdFromUrl(url: string): string {
  const parts = url.split('/')
  const projectsIndex = parts.indexOf('projects')
  return parts[projectsIndex + 1]
}

// GET /api/company/projects/[id]/members - List all members of a project
export const GET = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const projectId = extractProjectIdFromUrl(request.url)

    // Verify project exists and belongs to company
    const project = await db.project.findFirst({
      where: { id: projectId, companyId }
    })

    if (!project) {
      return apiResponse.notFound('Project', projectId)
    }

    const members = await db.projectMember.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
            title: true,
            department: true,
            skillRecords: {
              include: { skill: true }
            }
          }
        }
      },
      orderBy: [{ isLead: 'desc' }, { assignedAt: 'asc' }]
    })

    return apiResponse.success({
      members: members.map(m => ({
        id: m.id,
        employeeId: m.employee.id,
        firstName: m.employee.firstName,
        lastName: m.employee.lastName,
        email: m.employee.email,
        avatarUrl: m.employee.avatarUrl,
        employeeRole: m.employee.role,
        title: m.employee.title,
        department: m.employee.department,
        projectRole: m.role,
        isLead: m.isLead,
        matchScore: m.matchScore,
        wasRecommended: m.wasRecommended,
        isActive: m.isActive,
        assignedAt: m.assignedAt,
        skills: m.employee.skillRecords.map(sr => ({
          id: sr.skill.id,
          name: sr.skill.name,
          category: sr.skill.category,
          level: sr.level,
          confidence: sr.confidence
        }))
      })),
      total: members.length,
      activeCount: members.filter(m => m.isActive).length
    })
  } catch (error) {
    console.error('Failed to fetch project members:', error)
    return apiResponse.internalError('Failed to fetch project members')
  }
})

// POST /api/company/projects/[id]/members - Add a member to a project
export const POST = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const projectId = extractProjectIdFromUrl(request.url)
    const data = await validateRequest(request, addProjectMemberSchema)

    // Verify project exists and belongs to company
    const project = await db.project.findFirst({
      where: { id: projectId, companyId }
    })

    if (!project) {
      return apiResponse.notFound('Project', projectId)
    }

    // Verify employee exists and belongs to company
    const employee = await db.employee.findFirst({
      where: { id: data.employeeId, companyId }
    })

    if (!employee) {
      return apiResponse.notFound('Employee', data.employeeId)
    }

    // Check if employee is already a member
    const existingMember = await db.projectMember.findFirst({
      where: {
        projectId,
        employeeId: data.employeeId,
        isActive: true
      }
    })

    if (existingMember) {
      return apiResponse.conflict('Employee is already a member of this project')
    }

    // Check for match score from request body (if added via recommendation)
    let matchScore: number | undefined
    let wasRecommended = false

    try {
      const body = await request.clone().json()
      matchScore = body.matchScore
      wasRecommended = body.wasRecommended || false
    } catch {
      // Ignore parse errors
    }

    // Create project member
    const member = await db.projectMember.create({
      data: {
        projectId,
        employeeId: data.employeeId,
        role: data.role,
        isLead: data.isLead,
        matchScore,
        wasRecommended
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
            title: true,
            department: true
          }
        }
      }
    })

    return apiResponse.created({
      id: member.id,
      employeeId: member.employee.id,
      firstName: member.employee.firstName,
      lastName: member.employee.lastName,
      email: member.employee.email,
      avatarUrl: member.employee.avatarUrl,
      employeeRole: member.employee.role,
      title: member.employee.title,
      department: member.employee.department,
      projectRole: member.role,
      isLead: member.isLead,
      matchScore: member.matchScore,
      wasRecommended: member.wasRecommended,
      assignedAt: member.assignedAt
    }, 'Member added to project successfully')
  } catch (error) {
    console.error('Failed to add project member:', error)
    return apiResponse.internalError('Failed to add project member')
  }
})

// DELETE /api/company/projects/[id]/members - Remove a member from a project (bulk or single)
export const DELETE = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const projectId = extractProjectIdFromUrl(request.url)
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return apiResponse.badRequest('Employee ID is required')
    }

    // Verify project exists and belongs to company
    const project = await db.project.findFirst({
      where: { id: projectId, companyId }
    })

    if (!project) {
      return apiResponse.notFound('Project', projectId)
    }

    // Find the member
    const member = await db.projectMember.findFirst({
      where: {
        projectId,
        employeeId,
        isActive: true
      }
    })

    if (!member) {
      return apiResponse.notFound('Project member')
    }

    // Soft delete by setting isActive to false
    await db.projectMember.update({
      where: { id: member.id },
      data: {
        isActive: false,
        removedAt: new Date()
      }
    })

    return apiResponse.success({ id: member.id }, 'Member removed from project successfully')
  } catch (error) {
    console.error('Failed to remove project member:', error)
    return apiResponse.internalError('Failed to remove project member')
  }
})

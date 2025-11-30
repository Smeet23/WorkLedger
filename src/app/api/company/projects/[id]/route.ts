import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse, validateRequest } from '@/lib/api-response'
import { updateProjectSchema } from '@/lib/validations'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/company/projects/[id] - Get a single project
export const GET = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const { id } = await (request as any).context.params

    const project = await db.project.findFirst({
      where: { id, companyId },
      include: {
        techStack: {
          include: { skill: true },
          orderBy: { priority: 'asc' }
        },
        members: {
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
        }
      }
    })

    if (!project) {
      return apiResponse.notFound('Project', id)
    }

    return apiResponse.success({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      budget: project.budget,
      priority: project.priority,
      createdById: project.createdById,
      techStack: project.techStack.map(ts => ({
        id: ts.skill.id,
        name: ts.skill.name,
        category: ts.skill.category,
        description: ts.skill.description,
        isRequired: ts.isRequired,
        priority: ts.priority
      })),
      members: project.members.map(m => ({
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
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return apiResponse.internalError('Failed to fetch project')
  }
})

// Helper function to extract ID from URL
function extractIdFromUrl(url: string): string {
  const parts = url.split('/')
  const projectsIndex = parts.indexOf('projects')
  return parts[projectsIndex + 1]
}

// PUT /api/company/projects/[id] - Update a project
export const PUT = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const id = extractIdFromUrl(request.url)
    const data = await validateRequest(request, updateProjectSchema)

    // Verify project exists and belongs to company
    const existingProject = await db.project.findFirst({
      where: { id, companyId }
    })

    if (!existingProject) {
      return apiResponse.notFound('Project', id)
    }

    // If tech stack is being updated, verify all skill IDs exist
    if (data.techStackIds) {
      const skills = await db.skill.findMany({
        where: { id: { in: data.techStackIds } }
      })

      if (skills.length !== data.techStackIds.length) {
        return apiResponse.badRequest('One or more selected technologies are invalid')
      }
    }

    // Update project
    const updateData: any = {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      deadline: data.deadline,
      budget: data.budget,
      priority: data.priority
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const project = await db.$transaction(async (tx) => {
      // Update project
      const updated = await tx.project.update({
        where: { id },
        data: updateData
      })

      // Update tech stack if provided
      if (data.techStackIds) {
        // Delete existing tech stack
        await tx.projectTechStack.deleteMany({
          where: { projectId: id }
        })

        // Create new tech stack
        await tx.projectTechStack.createMany({
          data: data.techStackIds.map((skillId, index) => ({
            projectId: id,
            skillId,
            priority: index + 1,
            isRequired: true
          }))
        })
      }

      return tx.project.findFirst({
        where: { id },
        include: {
          techStack: {
            include: { skill: true },
            orderBy: { priority: 'asc' }
          },
          _count: {
            select: { members: { where: { isActive: true } } }
          }
        }
      })
    })

    return apiResponse.success({
      id: project!.id,
      name: project!.name,
      description: project!.description,
      status: project!.status,
      startDate: project!.startDate,
      endDate: project!.endDate,
      deadline: project!.deadline,
      budget: project!.budget,
      priority: project!.priority,
      techStack: project!.techStack.map(ts => ({
        id: ts.skill.id,
        name: ts.skill.name,
        category: ts.skill.category,
        isRequired: ts.isRequired,
        priority: ts.priority
      })),
      memberCount: project!._count.members,
      updatedAt: project!.updatedAt
    }, 'Project updated successfully')
  } catch (error) {
    console.error('Failed to update project:', error)
    return apiResponse.internalError('Failed to update project')
  }
})

// DELETE /api/company/projects/[id] - Delete a project
export const DELETE = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const id = extractIdFromUrl(request.url)

    // Verify project exists and belongs to company
    const project = await db.project.findFirst({
      where: { id, companyId }
    })

    if (!project) {
      return apiResponse.notFound('Project', id)
    }

    await db.project.delete({
      where: { id }
    })

    return apiResponse.success({ id }, 'Project deleted successfully')
  } catch (error) {
    console.error('Failed to delete project:', error)
    return apiResponse.internalError('Failed to delete project')
  }
})

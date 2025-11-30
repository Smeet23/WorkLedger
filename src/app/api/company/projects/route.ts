import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse, validateRequest } from '@/lib/api-response'
import { createProjectSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

// GET /api/company/projects - List all projects
export const GET = withCompanyAdmin(async (request, { companyId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: any = { companyId }
    if (status) {
      where.status = status
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          techStack: {
            include: { skill: true },
            orderBy: { priority: 'asc' }
          },
          members: {
            where: { isActive: true },
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                  role: true,
                  title: true
                }
              }
            }
          },
          _count: {
            select: {
              members: { where: { isActive: true } },
              techStack: true
            }
          }
        }
      }),
      db.project.count({ where })
    ])

    return apiResponse.success({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        deadline: project.deadline,
        budget: project.budget,
        priority: project.priority,
        techStack: project.techStack.map(ts => ({
          id: ts.skill.id,
          name: ts.skill.name,
          category: ts.skill.category,
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
          role: m.role,
          isLead: m.isLead,
          matchScore: m.matchScore
        })),
        memberCount: project._count.members,
        techStackCount: project._count.techStack,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return apiResponse.internalError('Failed to fetch projects')
  }
})

// POST /api/company/projects - Create a new project
export const POST = withCompanyAdmin(async (request, { companyId, user }) => {
  try {
    const data = await validateRequest(request, createProjectSchema)

    // Verify all skill IDs exist
    const skills = await db.skill.findMany({
      where: { id: { in: data.techStackIds } }
    })

    if (skills.length !== data.techStackIds.length) {
      return apiResponse.badRequest('One or more selected technologies are invalid')
    }

    // Create project with tech stack
    const project = await db.project.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        deadline: data.deadline,
        budget: data.budget,
        priority: data.priority,
        createdById: user.id,
        techStack: {
          create: data.techStackIds.map((skillId, index) => ({
            skillId,
            priority: index + 1,
            isRequired: true
          }))
        }
      },
      include: {
        techStack: {
          include: { skill: true }
        }
      }
    })

    return apiResponse.created({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      budget: project.budget,
      priority: project.priority,
      techStack: project.techStack.map(ts => ({
        id: ts.skill.id,
        name: ts.skill.name,
        category: ts.skill.category,
        isRequired: ts.isRequired,
        priority: ts.priority
      })),
      createdAt: project.createdAt
    }, 'Project created successfully')
  } catch (error) {
    console.error('Failed to create project:', error)
    return apiResponse.internalError('Failed to create project')
  }
})

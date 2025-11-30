import { db } from '@/lib/db'
import { updateProfileSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withAuth(async (request, { user, employee }) => {
  try {
    const employeeWithDetails = await db.employee.findUnique({
      where: { id: employee.id },
      include: {
        company: true,
        skillRecords: {
          include: { skill: true }
        },
        githubConnection: true
      }
    })

    if (!employeeWithDetails) {
      return apiResponse.notFound('Employee', employee.id)
    }

    return apiResponse.success({
      id: employeeWithDetails.id,
      firstName: employeeWithDetails.firstName,
      lastName: employeeWithDetails.lastName,
      email: employeeWithDetails.email,
      title: employeeWithDetails.title,
      department: employeeWithDetails.department,
      bio: employeeWithDetails.bio,
      linkedinUrl: employeeWithDetails.linkedinUrl,
      githubUrl: employeeWithDetails.githubConnection?.githubUsername
        ? `https://github.com/${employeeWithDetails.githubConnection.githubUsername}`
        : '',
      personalWebsite: employeeWithDetails.personalWebsite,
      role: user.role,
      employeeRole: employeeWithDetails.role,
      startDate: employeeWithDetails.startDate,
      company: {
        name: employeeWithDetails.company.name,
        domain: employeeWithDetails.company.domain
      },
      skills: employeeWithDetails.skillRecords.map(sr => sr.skill.name)
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return apiResponse.internalError('Failed to fetch profile')
  }
})

export const PUT = withAuth(async (request, { employee }) => {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update employee profile
    const updated = await db.employee.update({
      where: { id: employee.id },
      data: {
        firstName: validatedData.firstName || employee.firstName,
        lastName: validatedData.lastName || employee.lastName,
        title: validatedData.title,
        department: validatedData.department,
        bio: validatedData.bio,
        linkedinUrl: validatedData.linkedinUrl || null,
        personalWebsite: validatedData.personalWebsite || null,
        updatedAt: new Date()
      }
    })

    return apiResponse.success({ profile: updated }, 'Profile updated successfully')
  } catch (error) {
    console.error('Failed to update profile:', error)

    if (error instanceof ZodError) {
      return apiResponse.validation(
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    return apiResponse.internalError('Failed to update profile')
  }
})
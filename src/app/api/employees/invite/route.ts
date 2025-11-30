import { z } from "zod"
import { db } from "@/lib/db"
import { withCompanyAdmin } from "@/lib/api-auth"
import { createApiResponse } from "@/lib/api-response"

const apiResponse = createApiResponse()

const inviteEmployeeSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["DEVELOPER", "DESIGNER", "MANAGER", "SALES", "MARKETING", "OTHER"]),
  title: z.string().optional(),
  department: z.string().optional(),
  githubUsername: z.string().optional(),
})

export const POST = withCompanyAdmin(async (request, { user, companyId }) => {
  try {
    const body = await request.json()
    const validatedData = inviteEmployeeSchema.parse(body)

    // Check if an employee with this email already exists in the company
    const existingEmployee = await db.employee.findFirst({
      where: {
        email: validatedData.email,
        companyId
      }
    })

    if (existingEmployee) {
      return apiResponse.conflict('An employee with this email already exists in your company')
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email: validatedData.email,
        companyId,
        status: "pending"
      }
    })

    // Find GitHub org member if username provided
    let githubOrgMember = null
    if (validatedData.githubUsername) {
      githubOrgMember = await db.gitHubOrganizationMember.findFirst({
        where: {
          companyId,
          githubUsername: validatedData.githubUsername,
          isActive: true
        }
      })
    }

    if (existingInvitation) {
      // Update the existing invitation with new details
      await db.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          title: validatedData.title,
          department: validatedData.department,
          invitedBy: user.email,
          suggestedGithubUsername: validatedData.githubUsername || null,
          githubOrgMemberId: githubOrgMember?.id || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      })

      const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${existingInvitation.token}`

      return apiResponse.success({
        invitation: {
          id: existingInvitation.id,
          token: existingInvitation.token,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          title: validatedData.title,
          department: validatedData.department
        },
        invitationUrl
      }, 'Invitation updated and resent')
    }

    // Create a new invitation
    const invitation = await db.invitation.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        title: validatedData.title,
        department: validatedData.department,
        companyId,
        invitedBy: user.email,
        suggestedGithubUsername: validatedData.githubUsername || null,
        githubOrgMemberId: githubOrgMember?.id || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${invitation.token}`

    console.log("Invitation URL:", invitationUrl)

    return apiResponse.created({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        title: invitation.title,
        department: invitation.department
      },
      invitationUrl
    }, 'Invitation sent successfully')

  } catch (error) {
    console.error("Employee invitation error:", error)

    if (error instanceof z.ZodError) {
      return apiResponse.validation(
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    return apiResponse.internalError('Failed to create invitation')
  }
})

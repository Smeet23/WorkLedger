import { z } from "zod"
import { db } from "@/lib/db"
import { withCompanyAdmin } from "@/lib/api-auth"
import { createApiResponse } from "@/lib/api-response"

const apiResponse = createApiResponse()

const employeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["DEVELOPER", "DESIGNER", "MANAGER", "SALES", "MARKETING", "OTHER"]),
  title: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
})

const bulkImportSchema = z.object({
  employees: z.array(employeeSchema),
})

export const POST = withCompanyAdmin(async (request, { user, companyId }) => {
  try {
    const body = await request.json()
    const { employees } = bulkImportSchema.parse(body)

    // Check for existing employees in this company
    const existingEmails = await db.employee.findMany({
      where: {
        companyId,
        email: {
          in: employees.map(emp => emp.email)
        }
      },
      select: { email: true }
    })

    const existingEmailSet = new Set(existingEmails.map(emp => emp.email))
    const newEmployees = employees.filter(emp => !existingEmailSet.has(emp.email))

    if (newEmployees.length === 0) {
      return apiResponse.badRequest("All employees already exist in the company")
    }

    // Fetch GitHub org members for matching
    const githubOrgMembers = await db.gitHubOrganizationMember.findMany({
      where: {
        companyId,
        isActive: true,
        employeeId: null
      }
    })

    // Create email → GitHub member map
    const githubEmailMap = new Map(
      githubOrgMembers
        .filter(m => m.githubEmail)
        .map(m => [m.githubEmail!.toLowerCase(), m])
    )

    // Track statistics
    let withGitHub = 0
    let withoutGitHub = 0

    // Import employees in a transaction
    const result = await db.$transaction(async (tx) => {
      const createdInvitations = []

      for (const employee of newEmployees) {
        const githubMember = githubEmailMap.get(employee.email.toLowerCase())

        const existingInvitation = await tx.invitation.findFirst({
          where: {
            email: employee.email,
            companyId,
            status: "pending"
          }
        })

        if (githubMember) {
          withGitHub++
        } else {
          withoutGitHub++
        }

        if (existingInvitation) {
          const updatedInvitation = await tx.invitation.update({
            where: { id: existingInvitation.id },
            data: {
              firstName: employee.firstName,
              lastName: employee.lastName,
              role: employee.role,
              title: employee.title,
              department: employee.department,
              invitedBy: user.email,
              suggestedGithubUsername: githubMember?.githubUsername || null,
              githubOrgMemberId: githubMember?.id || null,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          })
          createdInvitations.push({
            ...updatedInvitation,
            hasGitHub: !!githubMember,
            githubUsername: githubMember?.githubUsername
          })
        } else {
          const invitation = await tx.invitation.create({
            data: {
              email: employee.email,
              firstName: employee.firstName,
              lastName: employee.lastName,
              role: employee.role,
              title: employee.title,
              department: employee.department,
              companyId,
              invitedBy: user.email,
              suggestedGithubUsername: githubMember?.githubUsername || null,
              githubOrgMemberId: githubMember?.id || null,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          })
          createdInvitations.push({
            ...invitation,
            hasGitHub: !!githubMember,
            githubUsername: githubMember?.githubUsername
          })
        }
      }

      return createdInvitations
    })

    console.log("Bulk invitations created:", result.length)

    return apiResponse.success({
      invitationsCount: result.length,
      skippedCount: employees.length - newEmployees.length,
      githubStats: {
        withGitHub,
        withoutGitHub,
        total: result.length,
        matchRate: result.length > 0 ? Math.round((withGitHub / result.length) * 100) : 0
      },
      details: {
        invitations: result.map(inv => ({
          id: inv.id,
          email: inv.email,
          firstName: inv.firstName,
          lastName: inv.lastName,
          role: inv.role,
          hasGitHub: inv.hasGitHub,
          githubUsername: inv.githubUsername,
          invitationUrl: `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${inv.token}`
        })),
        skipped: existingEmailSet.size > 0 ? Array.from(existingEmailSet) : []
      }
    }, `Successfully created ${result.length} invitations`)

  } catch (error) {
    console.error("Bulk import error:", error)

    if (error instanceof z.ZodError) {
      return apiResponse.validation(
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    return apiResponse.internalError("Failed to import employees")
  }
})

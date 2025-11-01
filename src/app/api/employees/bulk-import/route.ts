import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getServerSession } from "@/lib/session"

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
  companyId: z.string(),
  companyDomain: z.string(),
})

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated and is a company admin
    const session = await getServerSession()

    if (!session?.user || session.user.role !== "company_admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { employees, companyId, companyDomain } = bulkImportSchema.parse(body)

    // Verify that the company exists and the user has access to it
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        employees: {
          where: { email: session.user.email }
        }
      }
    })

    if (!company || company.employees.length === 0) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 403 }
      )
    }

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
      return NextResponse.json(
        { error: "All employees already exist in the company" },
        { status: 400 }
      )
    }

    // NEW: Phase 2.5 - Fetch GitHub org members for matching
    const githubOrgMembers = await db.gitHubOrganizationMember.findMany({
      where: {
        companyId,
        isActive: true,
        employeeId: null // Only unlinked members
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

    // Import employees in a transaction - create invitations instead
    const result = await db.$transaction(async (tx) => {
      const createdInvitations = []

      for (const employee of newEmployees) {
        // NEW: Try to match with GitHub org member by email
        const githubMember = githubEmailMap.get(employee.email.toLowerCase())
        // Check if there's already a pending invitation
        const existingInvitation = await tx.invitation.findFirst({
          where: {
            email: employee.email,
            companyId: companyId,
            status: "pending"
          }
        })

        // Track statistics
        if (githubMember) {
          withGitHub++
        } else {
          withoutGitHub++
        }

        if (existingInvitation) {
          // Update existing invitation
          const updatedInvitation = await tx.invitation.update({
            where: { id: existingInvitation.id },
            data: {
              firstName: employee.firstName,
              lastName: employee.lastName,
              role: employee.role,
              title: employee.title,
              department: employee.department,
              invitedBy: session.user.email,
              suggestedGithubUsername: githubMember?.githubUsername || null, // NEW
              githubOrgMemberId: githubMember?.id || null, // NEW
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Reset expiry
              updatedAt: new Date()
            }
          })
          createdInvitations.push({
            ...updatedInvitation,
            hasGitHub: !!githubMember,
            githubUsername: githubMember?.githubUsername
          })
        } else {
          // Create new invitation
          const invitation = await tx.invitation.create({
            data: {
              email: employee.email,
              firstName: employee.firstName,
              lastName: employee.lastName,
              role: employee.role,
              title: employee.title,
              department: employee.department,
              companyId: companyId,
              invitedBy: session.user.email,
              suggestedGithubUsername: githubMember?.githubUsername || null, // NEW
              githubOrgMemberId: githubMember?.id || null, // NEW
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
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

    // Generate invitation URLs
    const invitationUrls = result.map(invitation => ({
      email: invitation.email,
      invitationUrl: `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${invitation.token}`,
      firstName: invitation.firstName,
      lastName: invitation.lastName
    }))

    // Log invitation details
    console.log("Bulk invitations created:", invitationUrls)

    return NextResponse.json({
      message: `Successfully created ${result.length} invitations`,
      invitationsCount: result.length,
      skippedCount: employees.length - newEmployees.length,
      githubStats: { // NEW: Phase 2.5
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
          token: inv.token,
          hasGitHub: inv.hasGitHub, // NEW
          githubUsername: inv.githubUsername, // NEW
          invitationUrl: `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${inv.token}`
        })),
        skipped: existingEmailSet.size > 0 ? Array.from(existingEmailSet) : []
      }
    })

  } catch (error) {
    console.error("Bulk import error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getServerSession } from "@/lib/session"

const inviteEmployeeSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["DEVELOPER", "DESIGNER", "MANAGER", "SALES", "MARKETING", "OTHER"]),
  title: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string(),
  companyDomain: z.string(),
  githubUsername: z.string().optional(), // NEW: Phase 2
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
    const validatedData = inviteEmployeeSchema.parse(body)

    // Verify that the company exists and the user has access to it
    const company = await db.company.findUnique({
      where: { id: validatedData.companyId },
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

    // Check if an employee with this email already exists in the company
    const existingEmployee = await db.employee.findFirst({
      where: {
        email: validatedData.email,
        companyId: validatedData.companyId
      }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: "An employee with this email already exists in your company" },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email: validatedData.email,
        companyId: validatedData.companyId,
        status: "pending"
      }
    })

    if (existingInvitation) {
      // NEW: Phase 2 - Find GitHub org member if username provided
      let githubOrgMember = null
      if (validatedData.githubUsername) {
        githubOrgMember = await db.gitHubOrganizationMember.findFirst({
          where: {
            companyId: validatedData.companyId,
            githubUsername: validatedData.githubUsername,
            isActive: true
          }
        })
      }

      // Update the existing invitation with new details
      await db.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          title: validatedData.title,
          department: validatedData.department,
          invitedBy: session.user.email,
          suggestedGithubUsername: validatedData.githubUsername || null, // NEW
          githubOrgMemberId: githubOrgMember?.id || null, // NEW
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Reset expiry to 7 days
          updatedAt: new Date()
        }
      })

      const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${existingInvitation.token}`

      return NextResponse.json({
        message: "Invitation updated and resent",
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
      })
    }

    // NEW: Phase 2 - Find GitHub org member if username provided
    let githubOrgMember = null
    if (validatedData.githubUsername) {
      githubOrgMember = await db.gitHubOrganizationMember.findFirst({
        where: {
          companyId: validatedData.companyId,
          githubUsername: validatedData.githubUsername,
          isActive: true
        }
      })
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
        companyId: validatedData.companyId,
        invitedBy: session.user.email,
        suggestedGithubUsername: validatedData.githubUsername || null, // NEW
        githubOrgMemberId: githubOrgMember?.id || null, // NEW
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    })

    // Generate the invitation URL
    const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${invitation.token}`

    // TODO: Send invitation email
    console.log("Invitation URL:", invitationUrl)

    return NextResponse.json({
      message: "Invitation sent successfully",
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
    })

  } catch (error) {
    console.error("Employee invitation error:", error)

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
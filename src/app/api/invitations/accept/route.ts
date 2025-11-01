import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const acceptInvitationSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  createUser: z.boolean().optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password, createUser } = acceptInvitationSchema.parse(body)

    // Get the invitation (NEW: include githubOrgMember for Phase 2)
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        company: true,
        githubOrgMember: true  // NEW: Phase 2
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      let user

      if (createUser) {
        // Check if user already exists
        const existingUser = await tx.user.findUnique({
          where: { email: invitation.email }
        })

        if (existingUser) {
          throw new Error("A user with this email already exists")
        }

        // Create new user account
        const hashedPassword = await bcrypt.hash(password, 10)
        user = await tx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            role: "user",
            isActive: true,
            emailVerified: true // Auto-verify since they have a valid invitation
          }
        })
      } else {
        // Verify existing user password
        user = await tx.user.findUnique({
          where: { email: invitation.email }
        })

        if (!user) {
          throw new Error("No account found with this email. Please create an account.")
        }

        if (!user.password) {
          throw new Error("Please set a password for your account")
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
          throw new Error("Invalid password")
        }
      }

      // Check if employee already exists
      const existingEmployee = await tx.employee.findFirst({
        where: {
          email: invitation.email,
          companyId: invitation.companyId
        }
      })

      let employee
      if (existingEmployee) {
        // Update existing employee record
        employee = await tx.employee.update({
          where: { id: existingEmployee.id },
          data: {
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            role: invitation.role,
            title: invitation.title,
            department: invitation.department,
            isActive: true
          }
        })
      } else {
        // Create employee record
        employee = await tx.employee.create({
          data: {
            email: invitation.email,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            role: invitation.role,
            title: invitation.title,
            department: invitation.department,
            companyId: invitation.companyId,
            isActive: true,
            githubUsername: invitation.suggestedGithubUsername || null, // NEW: Phase 2
            autoDiscovered: false // Will be set to true if linked via auto-discovery
          }
        })
      }

      // NEW: Phase 2 - Auto-link to GitHub Organization Member
      if (invitation.githubOrgMember) {
        // Link the GitHub org member to the employee
        await tx.gitHubOrganizationMember.update({
          where: { id: invitation.githubOrgMember.id },
          data: {
            employeeId: employee.id,
            matchMethod: 'invitation',
            matchConfidence: 1.0 // 100% confidence since manager explicitly linked them
          }
        })

        // Update employee with GitHub info
        await tx.employee.update({
          where: { id: employee.id },
          data: {
            githubUsername: invitation.githubOrgMember.githubUsername,
            githubId: invitation.githubOrgMember.githubUserId.toString(),
            autoDiscovered: true
          }
        })
      }

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "accepted",
          acceptedAt: new Date()
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          companyId: invitation.companyId,
          action: "invitation_accepted",
          resource: "employee",
          resourceId: employee.id,
          actorType: "employee",
          actorId: user.id,
          actorEmail: user.email,
          metadata: {
            invitationId: invitation.id,
            employeeId: employee.id
          }
        }
      })

      return {
        user,
        employee,
        company: invitation.company
      }
    })

    return NextResponse.json({
      message: "Invitation accepted successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName
      },
      employee: {
        id: result.employee.id,
        role: result.employee.role,
        title: result.employee.title,
        department: result.employee.department
      },
      company: {
        id: result.company.id,
        name: result.company.name
      }
    })

  } catch (error) {
    console.error("Accept invitation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
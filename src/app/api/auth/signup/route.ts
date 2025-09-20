import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.enum(["company", "employee"]),
  companyName: z.string().optional(),
  companyDomain: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType, companyName, companyDomain } = signUpSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Start transaction for company admin signup
    if (userType === "company") {
      if (!companyName || !companyDomain) {
        return NextResponse.json(
          { error: "Company name and domain are required for company signup" },
          { status: 400 }
        )
      }

      // Check if company domain already exists
      const existingCompany = await db.company.findUnique({
        where: { domain: companyDomain }
      })

      if (existingCompany) {
        return NextResponse.json(
          { error: "Company with this domain already exists" },
          { status: 400 }
        )
      }

      // Create company and admin user in transaction
      const result = await db.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: {
            name: companyName,
            domain: companyDomain,
            tier: "STARTUP",
            isActive: true,
          }
        })

        // Create company settings
        await tx.companySettings.create({
          data: {
            companyId: company.id,
            shareSkills: true,
            shareAchievements: true,
            shareProjectTypes: true,
            shareTraining: true,
            shareTenure: true,
            autoIssueEnabled: false,
            minTrackingDays: 30,
          }
        })

        // Create admin user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "company_admin",
            isActive: true,
            emailVerified: false,
          }
        })

        // Create employee record linking user to company
        await tx.employee.create({
          data: {
            email,
            firstName,
            lastName,
            role: "MANAGER",
            title: "Administrator",
            companyId: company.id,
            isActive: true,
          }
        })

        return { user, company }
      })

      return NextResponse.json({
        message: "Company and admin account created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          domain: result.company.domain,
        }
      })
    } else {
      // Employee signup - requires company domain to exist
      if (!companyDomain) {
        return NextResponse.json(
          { error: "Company domain is required for employee signup" },
          { status: 400 }
        )
      }

      const company = await db.company.findUnique({
        where: { domain: companyDomain }
      })

      if (!company) {
        return NextResponse.json(
          { error: "Company not found. Please contact your administrator." },
          { status: 400 }
        )
      }

      // Create employee user and record
      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "user",
            isActive: true,
            emailVerified: false,
          }
        })

        await tx.employee.create({
          data: {
            email,
            firstName,
            lastName,
            role: "OTHER",
            companyId: company.id,
            isActive: true,
          }
        })

        return { user }
      })

      return NextResponse.json({
        message: "Employee account created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        }
      })
    }
  } catch (error) {
    console.error("Signup error:", error)

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
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "./db"

export async function getServerSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return session
}

export async function requireCompanyAdmin() {
  const session = await requireAuth()

  if (session.user.role !== "company_admin") {
    redirect("/employee")
  }

  return session
}

export async function getUserWithCompany(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      // We need to find the employee record to get company info
    }
  })

  if (!user) return null

  // Find employee record to get company
  const employee = await db.employee.findFirst({
    where: { email: user.email },
    include: {
      company: {
        include: {
          settings: true
        }
      }
    }
  })

  return {
    user,
    employee,
    company: employee?.company || null
  }
}
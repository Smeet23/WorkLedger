import { getServerSession as getSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "./db"
import { cache } from "react"
import { unstable_cache } from "next/cache"

export async function getServerSession() {
  return await getSession(authConfig)
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

// Internal function to fetch user with company data
async function fetchUserWithCompany(userId: string) {
  // Optimized query - select only needed fields
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  if (!user) return null

  // Find employee record with company in single query
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

// Cached version using Next.js unstable_cache for cross-request caching
const getCachedUserWithCompany = unstable_cache(
  async (userId: string) => fetchUserWithCompany(userId),
  ['user-with-company'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['user-data']
  }
)

// React cache for request-level deduplication (same request, multiple calls)
export const getUserWithCompany = cache(async (userId: string) => {
  return getCachedUserWithCompany(userId)
})

// Helper to invalidate user cache when needed (e.g., after profile update)
export async function invalidateUserCache(userId: string) {
  // This can be called after user/employee updates
  // Note: In production, you'd use revalidateTag('user-data') from next/cache
  // For now, the 60-second TTL handles cache invalidation
}

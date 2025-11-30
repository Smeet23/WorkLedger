import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

// GET /api/company/skills - Get all skills (for tech stack selection)
export const GET = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {}
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skills = await db.skill.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        _count: {
          select: {
            skillRecords: {
              where: {
                employee: { companyId }
              }
            }
          }
        }
      }
    })

    // Get unique categories
    const categories = Array.from(new Set(skills.map(s => s.category))).sort()

    // Group skills by category
    const skillsByCategory: Record<string, typeof skills> = {}
    for (const skill of skills) {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = []
      }
      skillsByCategory[skill.category].push(skill)
    }

    return apiResponse.success({
      skills: skills.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        employeeCount: s._count.skillRecords
      })),
      categories,
      skillsByCategory: Object.entries(skillsByCategory).map(([category, categorySkills]) => ({
        category,
        skills: categorySkills.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          employeeCount: s._count.skillRecords
        }))
      })),
      total: skills.length
    })
  } catch (error) {
    console.error('Failed to fetch skills:', error)
    return apiResponse.internalError('Failed to fetch skills')
  }
})

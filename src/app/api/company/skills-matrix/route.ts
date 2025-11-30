import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const apiResponse = createApiResponse()

export const GET = withAuth(async (request, { user, employee, companyId }) => {
  try {
    // Get company info
    const company = await db.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return apiResponse.notFound('Company')
    }

    // Get all employees with their skills for this company (optimized)
    const employees = await db.employee.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        role: true,
        department: true,
        skillRecords: {
          select: {
            level: true,
            confidence: true,
            lastUsed: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          },
          orderBy: {
            confidence: 'desc'
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { lastName: 'asc' }
      ]
    })

    // Extract all unique skills across the company
    const skillMap = new Map<string, {
      id: string
      name: string
      category: string
      totalEmployees: number
      levels: {
        BEGINNER: number
        INTERMEDIATE: number
        ADVANCED: number
        EXPERT: number
      }
      avgConfidence: number
    }>()

    // Build skill matrix data
    const matrix: Record<string, Record<string, {
      level: string
      confidence: number
      lastUsed: Date | null
    }>> = {}

    employees.forEach(emp => {
      matrix[emp.id] = {}

      emp.skillRecords.forEach(record => {
        const skill = record.skill

        // Add to matrix
        matrix[emp.id][skill.id] = {
          level: record.level,
          confidence: record.confidence || 0,
          lastUsed: record.lastUsed
        }

        // Update skill statistics
        if (!skillMap.has(skill.id)) {
          skillMap.set(skill.id, {
            id: skill.id,
            name: skill.name,
            category: skill.category || 'Other',
            totalEmployees: 0,
            levels: {
              BEGINNER: 0,
              INTERMEDIATE: 0,
              ADVANCED: 0,
              EXPERT: 0
            },
            avgConfidence: 0
          })
        }

        const skillStats = skillMap.get(skill.id)!
        skillStats.totalEmployees++
        skillStats.levels[record.level as keyof typeof skillStats.levels]++
        skillStats.avgConfidence += record.confidence || 0
      })
    })

    // Calculate average confidence for each skill
    skillMap.forEach(skill => {
      if (skill.totalEmployees > 0) {
        skill.avgConfidence = skill.avgConfidence / skill.totalEmployees
      }
    })

    // Convert skill map to array and sort by total employees (popularity)
    const skills = Array.from(skillMap.values()).sort((a, b) => b.totalEmployees - a.totalEmployees)

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    }, {} as Record<string, typeof skills>)

    // Group employees by department
    const employeesByDepartment = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Other'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        title: emp.title,
        role: emp.role,
        department: dept,
        skillCount: emp.skillRecords.length,
        avgConfidence: emp.skillRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / (emp.skillRecords.length || 1)
      })
      return acc
    }, {} as Record<string, any[]>)

    // Calculate company-wide statistics
    const totalSkills = skills.length
    const totalSkillRecords = employees.reduce((sum, emp) => sum + emp.skillRecords.length, 0)
    const avgSkillsPerEmployee = employees.length > 0 ? totalSkillRecords / employees.length : 0

    // Find skill gaps (skills with low representation)
    const skillGaps = skills
      .filter(skill => skill.totalEmployees < Math.max(2, employees.length * 0.3))
      .slice(0, 10)

    // Find team strengths (most common expert-level skills)
    const teamStrengths = skills
      .filter(skill => skill.levels.EXPERT > 0 || skill.levels.ADVANCED > 0)
      .sort((a, b) => (b.levels.EXPERT + b.levels.ADVANCED) - (a.levels.EXPERT + a.levels.ADVANCED))
      .slice(0, 10)

    return apiResponse.success({
      company: {
        id: company.id,
        name: company.name
      },
      statistics: {
        totalEmployees: employees.length,
        totalSkills,
        totalSkillRecords,
        avgSkillsPerEmployee: Math.round(avgSkillsPerEmployee * 10) / 10,
        departments: Object.keys(employeesByDepartment).length
      },
      employees: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        title: emp.title,
        role: emp.role,
        department: emp.department,
        skillCount: emp.skillRecords.length
      })),
      skills,
      matrix,
      skillsByCategory,
      employeesByDepartment,
      insights: {
        skillGaps,
        teamStrengths,
        mostCommonSkills: skills.slice(0, 5),
        recentlyUsedSkills: employees
          .flatMap(emp => emp.skillRecords)
          .filter(record => record.lastUsed)
          .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
          .slice(0, 5)
          .map(record => ({
            name: record.skill.name,
            lastUsed: record.lastUsed
          }))
      }
    })
  } catch (error) {
    console.error('Failed to fetch skills matrix:', error)
    return apiResponse.internalError('Failed to fetch skills matrix')
  }
})

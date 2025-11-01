import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a company admin or manager
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get employee record with company info
    const userEmployee = await db.employee.findFirst({
      where: { email: user.email },
      include: { company: true }
    })

    const isCompanyAdmin = user.role === 'company_admin'
    const isManager = userEmployee?.role === 'MANAGER'

    if (!isCompanyAdmin && !isManager && !userEmployee) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!userEmployee?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all employees with their skills for this company (optimized)
    const employees = await db.employee.findMany({
      where: {
        companyId: userEmployee.company.id,
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

    employees.forEach(employee => {
      matrix[employee.id] = {}

      employee.skillRecords.forEach(record => {
        const skill = record.skill

        // Add to matrix
        matrix[employee.id][skill.id] = {
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
    const employeesByDepartment = employees.reduce((acc, employee) => {
      const dept = employee.department || 'Other'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        title: employee.title,
        role: employee.role,
        department: dept,
        skillCount: employee.skillRecords.length,
        avgConfidence: employee.skillRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / (employee.skillRecords.length || 1)
      })
      return acc
    }, {} as Record<string, any[]>)

    // Calculate company-wide statistics
    const totalSkills = skills.length
    const totalSkillRecords = employees.reduce((sum, emp) => sum + emp.skillRecords.length, 0)
    const avgSkillsPerEmployee = employees.length > 0 ? totalSkillRecords / employees.length : 0

    // Find skill gaps (skills with low representation)
    const skillGaps = skills
      .filter(skill => skill.totalEmployees < Math.max(2, employees.length * 0.3)) // Skills known by less than 30% of team
      .slice(0, 10)

    // Find team strengths (most common expert-level skills)
    const teamStrengths = skills
      .filter(skill => skill.levels.EXPERT > 0 || skill.levels.ADVANCED > 0)
      .sort((a, b) => (b.levels.EXPERT + b.levels.ADVANCED) - (a.levels.EXPERT + a.levels.ADVANCED))
      .slice(0, 10)

    return NextResponse.json({
      company: {
        id: userEmployee.company.id,
        name: userEmployee.company.name
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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    })
  } catch (error) {
    console.error('Failed to fetch skills matrix:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills matrix' },
      { status: 500 }
    )
  }
}
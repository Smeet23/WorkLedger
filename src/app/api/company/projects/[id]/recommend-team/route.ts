import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'
import { NextRequest } from 'next/server'
import { SkillLevel } from '@prisma/client'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

// Skill level weights for scoring
const SKILL_LEVEL_WEIGHTS: Record<SkillLevel, number> = {
  EXPERT: 1.0,
  ADVANCED: 0.75,
  INTERMEDIATE: 0.5,
  BEGINNER: 0.25
}

interface EmployeeSkillMatch {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  role: string
  title: string | null
  department: string | null
  matchScore: number
  matchedSkills: Array<{
    skillId: string
    skillName: string
    level: SkillLevel
    confidence: number | null
    isRequired: boolean
    priority: number
  }>
  totalSkills: number
  isAlreadyMember: boolean
  currentProjectCount: number
}

// Helper function to extract ID from URL
function extractIdFromUrl(url: string): string {
  const parts = url.split('/')
  const projectsIndex = parts.indexOf('projects')
  return parts[projectsIndex + 1]
}

// POST /api/company/projects/[id]/recommend-team - Get team recommendations
export const POST = withCompanyAdmin(async (request: NextRequest, { companyId }) => {
  try {
    const projectId = extractIdFromUrl(request.url)

    // Parse request body for optional parameters
    let teamSize = 5
    let includePartialMatches = true

    try {
      const body = await request.json()
      teamSize = body.teamSize || 5
      includePartialMatches = body.includePartialMatches !== false
    } catch {
      // Use defaults if body is empty
    }

    // Get project with tech stack
    const project = await db.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        techStack: {
          include: { skill: true },
          orderBy: { priority: 'asc' }
        },
        members: {
          where: { isActive: true },
          select: { employeeId: true }
        }
      }
    })

    if (!project) {
      return apiResponse.notFound('Project', projectId)
    }

    if (project.techStack.length === 0) {
      return apiResponse.badRequest('Project has no tech stack defined')
    }

    // Get all skill IDs from tech stack
    const requiredSkillIds = project.techStack.map(ts => ts.skillId)
    const existingMemberIds = project.members.map(m => m.employeeId)

    // Get all active employees with their skills
    const employees = await db.employee.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        skillRecords: {
          where: {
            skillId: { in: requiredSkillIds }
          },
          include: { skill: true }
        },
        projectMembers: {
          where: { isActive: true }
        },
        _count: {
          select: { skillRecords: true }
        }
      }
    })

    // Calculate match scores for each employee
    const employeeMatches: EmployeeSkillMatch[] = employees.map(employee => {
      const matchedSkills: EmployeeSkillMatch['matchedSkills'] = []
      let totalScore = 0
      let maxPossibleScore = 0

      // Calculate score for each required skill
      for (const techStackItem of project.techStack) {
        const skillRecord = employee.skillRecords.find(
          sr => sr.skillId === techStackItem.skillId
        )

        // Weight by priority (higher priority = more weight)
        const priorityWeight = 1 / techStackItem.priority
        const requiredWeight = techStackItem.isRequired ? 1.5 : 1

        maxPossibleScore += priorityWeight * requiredWeight

        if (skillRecord) {
          const levelWeight = SKILL_LEVEL_WEIGHTS[skillRecord.level]
          const confidenceWeight = skillRecord.confidence || 0.5
          const skillScore = levelWeight * confidenceWeight * priorityWeight * requiredWeight

          totalScore += skillScore

          matchedSkills.push({
            skillId: techStackItem.skill.id,
            skillName: techStackItem.skill.name,
            level: skillRecord.level,
            confidence: skillRecord.confidence,
            isRequired: techStackItem.isRequired,
            priority: techStackItem.priority
          })
        }
      }

      // Normalize score to 0-1 range
      const matchScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0

      return {
        employeeId: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        avatarUrl: employee.avatarUrl,
        role: employee.role,
        title: employee.title,
        department: employee.department,
        matchScore,
        matchedSkills,
        totalSkills: employee._count.skillRecords,
        isAlreadyMember: existingMemberIds.includes(employee.id),
        currentProjectCount: employee.projectMembers.length
      }
    })

    // Filter employees based on criteria
    let filteredMatches = employeeMatches

    // Always filter out employees with no matching skills (0% match)
    filteredMatches = filteredMatches.filter(em => em.matchedSkills.length > 0)

    if (!includePartialMatches) {
      // Only include employees who have all required skills
      const requiredSkillCount = project.techStack.filter(ts => ts.isRequired).length
      filteredMatches = filteredMatches.filter(em => {
        const requiredMatchCount = em.matchedSkills.filter(ms => ms.isRequired).length
        return requiredMatchCount >= requiredSkillCount
      })
    }

    // Sort by match score (descending), then by current project count (ascending for workload balance)
    filteredMatches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      return a.currentProjectCount - b.currentProjectCount
    })

    // Separate already assigned members and available candidates
    const alreadyAssigned = filteredMatches.filter(em => em.isAlreadyMember)
    const available = filteredMatches.filter(em => !em.isAlreadyMember)

    // Get top recommendations
    const recommendations = available.slice(0, teamSize)

    // Calculate coverage analysis
    const skillCoverage: Record<string, {
      skillId: string
      skillName: string
      isRequired: boolean
      coveredBy: Array<{ employeeId: string; name: string; level: SkillLevel }>
    }> = {}

    for (const tech of project.techStack) {
      skillCoverage[tech.skillId] = {
        skillId: tech.skillId,
        skillName: tech.skill.name,
        isRequired: tech.isRequired,
        coveredBy: []
      }
    }

    for (const rec of recommendations) {
      for (const skill of rec.matchedSkills) {
        if (skillCoverage[skill.skillId]) {
          skillCoverage[skill.skillId].coveredBy.push({
            employeeId: rec.employeeId,
            name: `${rec.firstName} ${rec.lastName}`,
            level: skill.level
          })
        }
      }
    }

    const coverageArray = Object.values(skillCoverage)
    const coveredSkills = coverageArray.filter(sc => sc.coveredBy.length > 0)
    const uncoveredSkills = coverageArray.filter(sc => sc.coveredBy.length === 0)
    const coveragePercentage = (coveredSkills.length / coverageArray.length) * 100

    return apiResponse.success({
      projectId,
      projectName: project.name,
      techStack: project.techStack.map(ts => ({
        id: ts.skill.id,
        name: ts.skill.name,
        category: ts.skill.category,
        isRequired: ts.isRequired,
        priority: ts.priority
      })),
      recommendations: recommendations.map(rec => ({
        employeeId: rec.employeeId,
        firstName: rec.firstName,
        lastName: rec.lastName,
        email: rec.email,
        avatarUrl: rec.avatarUrl,
        role: rec.role,
        title: rec.title,
        department: rec.department,
        matchScore: Math.round(rec.matchScore * 100) / 100,
        matchPercentage: Math.round(rec.matchScore * 100),
        matchedSkills: rec.matchedSkills,
        totalSkills: rec.totalSkills,
        currentProjectCount: rec.currentProjectCount
      })),
      alreadyAssigned: alreadyAssigned.map(mem => ({
        employeeId: mem.employeeId,
        firstName: mem.firstName,
        lastName: mem.lastName,
        email: mem.email,
        avatarUrl: mem.avatarUrl,
        matchScore: Math.round(mem.matchScore * 100) / 100,
        matchPercentage: Math.round(mem.matchScore * 100),
        matchedSkills: mem.matchedSkills
      })),
      coverage: {
        totalSkills: coverageArray.length,
        coveredSkills: coveredSkills.length,
        uncoveredSkills: uncoveredSkills.length,
        coveragePercentage: Math.round(coveragePercentage),
        skillBreakdown: coverageArray,
        gaps: uncoveredSkills.map(sc => ({
          skillId: sc.skillId,
          skillName: sc.skillName,
          isRequired: sc.isRequired
        }))
      },
      totalCandidates: available.length,
      requestedSize: teamSize
    })
  } catch (error) {
    console.error('Failed to generate team recommendations:', error)
    return apiResponse.internalError('Failed to generate team recommendations')
  }
})

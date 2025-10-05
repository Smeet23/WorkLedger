import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitLabService } from '@/services/gitlab/client'
import { GitLabSkillDetector } from '@/services/gitlab/skill-detector'
import { db } from '@/lib/db'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const apiResponse = createApiResponse()

/**
 * POST /api/gitlab/sync
 * Manually trigger GitLab sync for current user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return apiResponse.unauthorized('Authentication required')
    }

    // Find employee
    const employee = await db.employee.findUnique({
      where: { email: session.user.email || '' },
    })

    if (!employee) {
      return apiResponse.notFound('Employee')
    }

    // Get GitLab connection
    const connection = await GitLabService.getConnection(employee.id)

    if (!connection || !connection.accessToken) {
      return apiResponse.badRequest('GitLab is not connected')
    }

    logger.info('Starting manual GitLab sync', { employeeId: employee.id })

    // Perform skill detection
    const detector = new GitLabSkillDetector(connection.accessToken)
    const skills = await detector.detectSkillsFromProjects(employee.id)

    // Save skills
    await detector.saveSkills(employee.id, skills)

    // Update last sync time
    await db.integration.update({
      where: { id: connection.id },
      data: { lastSync: new Date() },
    })

    logger.info('GitLab sync completed', {
      employeeId: employee.id,
      skillsDetected: skills.length,
    })

    return apiResponse.success({
      message: 'Sync completed successfully',
      skillsDetected: skills.length,
      skills: skills.map((s) => ({
        name: s.name,
        category: s.category,
        level: s.level,
        confidence: s.confidence,
        projectsUsed: s.projectsUsed,
      })),
    })
  } catch (error) {
    logger.error('GitLab sync failed', error)
    return apiResponse.error(error)
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitLabService } from '@/services/gitlab/client'
import { GitLabSkillDetector } from '@/services/gitlab/skill-detector'
import { db } from '@/lib/db'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { jobManager } from '@/lib/queue'

const apiResponse = createApiResponse()

/**
 * GET /api/gitlab/callback
 * Handle GitLab OAuth callback
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=unauthorized', request.url)
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      logger.warn('GitLab OAuth error', { error, userId: session.user.id })
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations/gitlab?error=${encodeURIComponent(error)}`,
          request.url
        )
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations/gitlab?error=no_code', request.url)
      )
    }

    // Exchange code for access token
    const tokenData = await GitLabService.exchangeCodeForToken(code)

    // Get user info
    const gitlabService = new GitLabService(tokenData.access_token)
    const gitlabUser = await gitlabService.getAuthenticatedUser()

    // Find employee record
    const employee = await db.employee.findUnique({
      where: { email: session.user.email || '' },
      include: { company: true },
    })

    if (!employee) {
      logger.error('Employee not found for GitLab connection', {
        userId: session.user.id,
        email: session.user.email,
      })
      return NextResponse.redirect(
        new URL('/dashboard/integrations/gitlab?error=employee_not_found', request.url)
      )
    }

    // Update employee with GitLab info
    await db.employee.update({
      where: { id: employee.id },
      data: {
        // Store GitLab username for future reference
        // Note: You might need to add these fields to your schema
      },
    })

    // Save GitLab connection
    await GitLabService.saveConnection(
      employee.id,
      gitlabUser,
      tokenData.access_token,
      tokenData.refresh_token
    )

    logger.info('GitLab connection established', {
      employeeId: employee.id,
      gitlabUserId: gitlabUser.id,
      gitlabUsername: gitlabUser.username,
    })

    // Queue skill detection job
    await jobManager.queueSkillDetection({
      employeeId: employee.id,
      githubUsername: gitlabUser.username,
    })

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL('/dashboard/integrations/gitlab?success=true', request.url)
    )
  } catch (error) {
    logger.error('GitLab callback failed', error)
    return NextResponse.redirect(
      new URL('/dashboard/integrations/gitlab?error=connection_failed', request.url)
    )
  }
}

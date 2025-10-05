import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitLabService } from '@/services/gitlab/client'
import { createApiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const apiResponse = createApiResponse()

/**
 * GET /api/gitlab/connect
 * Initiate GitLab OAuth flow
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return apiResponse.unauthorized('Authentication required')
    }

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15)

    // Store state in session or database for verification
    // For now, we'll use URL parameter

    // Generate OAuth URL
    const authUrl = GitLabService.getOAuthUrl(state)

    logger.info('GitLab OAuth flow initiated', {
      userId: session.user.id,
      state,
    })

    return apiResponse.success({
      authUrl,
      state,
    })
  } catch (error) {
    logger.error('GitLab connect failed', error)
    return apiResponse.error(error)
  }
}

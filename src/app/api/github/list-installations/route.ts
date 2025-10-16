import { NextRequest } from 'next/server'
import { App } from '@octokit/app'
import { config } from '@/lib/config'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { loggers } from '@/lib/logger'

// GET /api/github/list-installations
// Lists all GitHub App installations (for debugging)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/list-installations')

  try {
    const app = new App({
      appId: config.github.app.id,
      privateKey: config.github.app.privateKey,
      clientId: config.github.app.clientId,
      clientSecret: config.github.app.clientSecret,
    })

    logger.info('Fetching GitHub App installations')

    // Get all installations for this app
    const installations = []
    for await (const { installation } of app.eachInstallation.iterator()) {
      installations.push({
        id: installation.id,
        accountLogin: installation.account?.login || 'Unknown',
        accountType: installation.account?.type || 'Unknown',
        accountId: installation.account?.id,
        repositorySelection: installation.repository_selection,
        createdAt: installation.created_at,
        updatedAt: installation.updated_at,
        callbackUrl: `${config.app.url}/api/github/app/install?installation_id=${installation.id}&setup_action=install`
      })
    }

    logger.info('GitHub App installations fetched', { count: installations.length })

    return apiResponse.success({
      count: installations.length,
      installations,
      message: installations.length === 0
        ? 'No installations found. Please install the GitHub App first.'
        : `Found ${installations.length} installation(s). Visit the callbackUrl to complete setup.`
    })

  } catch (error) {
    logger.error('Failed to list GitHub App installations', error)
    throw error
  }
})

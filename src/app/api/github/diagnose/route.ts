import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { githubTokenManager, GitHubTokenType } from '@/lib/github-token-manager'
import { Octokit } from '@octokit/rest'
import { App } from '@octokit/app'
import { config } from '@/lib/config'

// GET /api/github/diagnose
// Comprehensive diagnostic endpoint to test every step
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/diagnose')

  const results: any = {
    steps: [],
    errors: [],
    success: true
  }

  const addStep = (name: string, success: boolean, data?: any, error?: any) => {
    results.steps.push({ name, success, data, error: error?.message || error })
    if (!success) {
      results.success = false
      results.errors.push({ step: name, error: error?.message || error })
    }
  }

  try {
    // STEP 1: Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      throw new AuthenticationError('You must be logged in')
    }
    addStep('Authentication', true, { userId: session.user.id, role: session.user.role })

    // STEP 2: Get employee and company
    let employee
    try {
      employee = await db.employee.findFirst({
        where: { email: session.user.email },
        include: { company: true }
      })
      addStep('Get Employee', !!employee, {
        employeeId: employee?.id,
        companyId: employee?.company?.id,
        companyName: employee?.company?.name
      })
    } catch (error: any) {
      addStep('Get Employee', false, null, error)
      return apiResponse.success(results)
    }

    if (!employee?.company) {
      addStep('Company Check', false, null, 'No company found')
      return apiResponse.success(results)
    }

    const companyId = employee.company.id

    // STEP 3: Check GitHub Installation
    let installation
    try {
      installation = await db.gitHubInstallation.findFirst({
        where: { companyId, isActive: true }
      })
      addStep('GitHub Installation', !!installation, {
        hasInstallation: !!installation,
        installationId: installation?.installationId?.toString(),
        accountLogin: installation?.accountLogin,
        accountType: installation?.accountType,
        installedAt: installation?.installedAt
      })
    } catch (error: any) {
      addStep('GitHub Installation', false, null, error)
      return apiResponse.success(results)
    }

    if (!installation) {
      addStep('Installation Validation', false, null, 'No active GitHub installation found')
      return apiResponse.success(results)
    }

    // STEP 4: Check GitHub Integration (token storage)
    let integration
    try {
      integration = await db.gitHubIntegration.findUnique({
        where: {
          companyId_tokenType: {
            companyId,
            tokenType: GitHubTokenType.APP_INSTALLATION
          }
        }
      })
      addStep('GitHub Integration Record', !!integration, {
        hasIntegration: !!integration,
        isActive: integration?.isActive,
        hasAccessToken: !!integration?.encryptedAccessToken,
        expiresAt: integration?.expiresAt,
        organizationLogin: integration?.organizationLogin,
        installationId: integration?.installationId?.toString()
      })
    } catch (error: any) {
      addStep('GitHub Integration Record', false, null, error)
    }

    // STEP 5: Get tokens via token manager
    let tokenData
    try {
      tokenData = await githubTokenManager.getCompanyTokens(companyId, GitHubTokenType.APP_INSTALLATION)
      addStep('Get Company Tokens', !!tokenData, {
        hasToken: !!tokenData,
        tokenType: tokenData?.tokenType,
        expiresAt: tokenData?.expiresAt,
        hasRefreshToken: !!tokenData?.refreshToken
      })
    } catch (error: any) {
      addStep('Get Company Tokens', false, null, error)
    }

    // STEP 6: If no token, try to generate one
    if (!tokenData) {
      try {
        logger.info('No token found, generating new installation token')

        const app = new App({
          appId: config.github.app.id,
          privateKey: config.github.app.privateKey,
        })

        const { data: newTokenData } = await app.octokit.request(
          'POST /app/installations/{installation_id}/access_tokens',
          { installation_id: Number(installation.installationId) }
        )

        // Store the new token
        await githubTokenManager.storeCompanyTokens(
          companyId,
          {
            accessToken: newTokenData.token,
            expiresAt: new Date(newTokenData.expires_at),
            tokenType: GitHubTokenType.APP_INSTALLATION,
            metadata: {
              installationId: Number(installation.installationId),
              permissions: newTokenData.permissions
            }
          },
          installation.accountLogin,
          installation.installationId
        )

        // Retrieve it back
        tokenData = await githubTokenManager.getCompanyTokens(companyId, GitHubTokenType.APP_INSTALLATION)

        addStep('Generate New Token', true, {
          tokenGenerated: true,
          expiresAt: newTokenData.expires_at
        })
      } catch (error: any) {
        addStep('Generate New Token', false, null, error)
        return apiResponse.success(results)
      }
    }

    if (!tokenData) {
      addStep('Token Validation', false, null, 'No token available after generation attempt')
      return apiResponse.success(results)
    }

    // STEP 7: Create Octokit client
    let octokit
    try {
      octokit = new Octokit({
        auth: tokenData.accessToken,
        userAgent: `${config.app.name}/1.0.0`,
      })
      addStep('Create Octokit Client', true, { clientCreated: true })
    } catch (error: any) {
      addStep('Create Octokit Client', false, null, error)
      return apiResponse.success(results)
    }

    // STEP 8: Test GitHub API - Get installation info
    try {
      const { data: installationInfo } = await octokit.rest.apps.getAuthenticated()
      addStep('Test GitHub API (Get App)', true, {
        appName: installationInfo?.name || 'N/A',
        appId: installationInfo?.id || 0
      })
    } catch (error: any) {
      addStep('Test GitHub API (Get App)', false, null, error)
    }

    // STEP 9: Fetch repositories from GitHub
    try {
      const { data: reposData } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 5
      })

      addStep('Fetch Repositories from GitHub', true, {
        totalCount: reposData.total_count,
        fetchedCount: reposData.repositories.length,
        repositories: reposData.repositories.map(r => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          language: r.language
        }))
      })
    } catch (error: any) {
      addStep('Fetch Repositories from GitHub', false, null, error)
      return apiResponse.success(results)
    }

    // STEP 10: Check existing repositories in database
    try {
      const dbRepos = await db.repository.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          fullName: true,
          githubRepoId: true,
          createdAt: true
        },
        take: 5
      })

      addStep('Check Database Repositories', true, {
        count: dbRepos.length,
        repositories: dbRepos
      })
    } catch (error: any) {
      addStep('Check Database Repositories', false, null, error)
    }

    return apiResponse.success(results)

  } catch (error: any) {
    logger.error('Diagnosis failed', error)
    results.success = false
    results.errors.push({ step: 'Overall', error: error.message, stack: error.stack })
    return apiResponse.success(results)
  }
})

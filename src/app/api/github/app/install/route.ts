import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { createApiResponse, validateRequest, withErrorHandling } from '@/lib/api-response'
import { AuthorizationError, NotFoundError, ConflictError } from '@/lib/errors'
import { loggers, eventLoggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

const installationSchema = z.object({
  installation_id: z.coerce.number(),
  setup_action: z.string(),
  state: z.string().nullable().optional()
})

// GitHub App Installation Callback
export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('GET', '/api/github/app/install')

  // Get query parameters
  const url = new URL(request.url)
  const installationId = url.searchParams.get('installation_id')
  const setupAction = url.searchParams.get('setup_action')
  const state = url.searchParams.get('state')

  if (!installationId) {
    return apiResponse.badRequest('Missing installation_id parameter')
  }

  const data = installationSchema.parse({
    installation_id: installationId,
    setup_action: setupAction || 'install',
    state
  })

  logger.info('Processing GitHub App installation', {
    installationId: data.installation_id,
    setupAction: data.setup_action
  })

  try {
    // Check if user is authenticated
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'company_admin') {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(request.url)
      return Response.redirect(`${config.app.url}/auth/signin?returnUrl=${returnUrl}`)
    }

    // Get company admin's employee record
    const adminEmployee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!adminEmployee?.company) {
      throw new NotFoundError('Company', session.user.email)
    }

    const companyLogger = logger.withCompany(adminEmployee.company.id)

    // Check if installation already exists
    const existingInstallation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(data.installation_id) }
    })

    if (existingInstallation && existingInstallation.companyId !== adminEmployee.company.id) {
      throw new ConflictError('GitHub App is already installed for a different company')
    }

    // Handle the installation
    await enhancedGitHubService.handleAppInstallation(
      data.installation_id,
      adminEmployee.company.id
    )

    companyLogger.info('GitHub App installation completed, starting repository sync', {
      installationId: data.installation_id,
      adminId: session.user.id
    })

    // Automatically sync repositories after installation
    try {
      const syncResult = await enhancedGitHubService.syncOrganizationRepositories(adminEmployee.company.id)
      companyLogger.info('Initial repository sync completed', {
        repositories: syncResult.repositories,
        newRepositories: syncResult.newRepositories,
        updatedRepositories: syncResult.updatedRepositories
      })
    } catch (syncError) {
      companyLogger.error('Initial repository sync failed (non-critical)', syncError)
      // Don't fail the installation if sync fails - user can manually sync later
    }

    // Redirect back to integrations page to show installation status
    const successUrl = `${config.app.url}/dashboard/integrations/github?installed=true&installation_id=${data.installation_id}`
    return Response.redirect(successUrl)

  } catch (error) {
    logger.error('GitHub App installation failed', error, {
      installationId: data.installation_id
    })

    // Redirect to error page
    const errorUrl = `${config.app.url}/dashboard/integrations/github/setup-error?error=${encodeURIComponent('Installation failed')}`
    return Response.redirect(errorUrl)
  }
})

// Initiate GitHub App Installation
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/github/app/install')

  // Authentication check
  const session = await getServerSession()
  if (!session?.user || session.user.role !== 'company_admin') {
    throw new AuthorizationError('Only company administrators can install GitHub integrations')
  }

  // Get admin's company
  const adminEmployee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!adminEmployee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyLogger = logger.withCompany(adminEmployee.company.id)

  // Check if company already has an active installation
  const existingInstallation = await db.gitHubInstallation.findFirst({
    where: {
      companyId: adminEmployee.company.id,
      isActive: true
    }
  })

  if (existingInstallation) {
    return apiResponse.conflict('GitHub App is already installed for this company')
  }

  // Generate installation URL
  const state = `company_${adminEmployee.company.id}_${Date.now()}`
  const appName = config.github.app.appName || 'workledger'
  const installationUrl = `https://github.com/apps/${appName}/installations/new`

  companyLogger.info('Generating GitHub App installation URL', {
    adminId: session.user.id,
    appName,
    state
  })

  return apiResponse.success({
    installationUrl,
    state,
    instructions: [
      'Click the installation URL to install WorkLedger on your GitHub organization',
      'Select the repositories you want to grant access to',
      'You will be redirected back to WorkLedger after installation'
    ]
  })
})
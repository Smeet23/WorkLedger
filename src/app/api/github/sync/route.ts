import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, NotFoundError } from '@/lib/errors'
import { loggers, eventLoggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'
import { GitHubAutoDiscoveryService } from '@/services/github/auto-discovery'

const logger = loggers.apiRequest('POST', '/api/github/sync')
const discoveryService = new GitHubAutoDiscoveryService()

export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // Get employee record
  const employee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!employee) {
    throw new NotFoundError('Employee', session.user.email)
  }

  const employeeLogger = logger.withEmployee(employee.id)

  employeeLogger.info('Starting GitHub sync', {
    syncType: 'organization_based',
    hasGitHubUsername: !!employee.githubUsername
  })

  try {
    let syncResult: any

    if (session.user.role === 'company_admin') {
      // Company admin can sync entire organization
      syncResult = await syncOrganizationData(employee.companyId, employeeLogger)
    } else {
      // Regular employee syncs their individual contributions
      syncResult = await syncEmployeeContributions(employee.id, employeeLogger)
    }

    employeeLogger.info('GitHub sync completed successfully', syncResult)

    return apiResponse.success(syncResult, 'GitHub sync completed successfully')

  } catch (error: any) {
    employeeLogger.error('GitHub sync failed', error)
    console.error('GitHub sync error:', error)

    // Return user-friendly error message
    return apiResponse.error(
      error?.message || 'Failed to sync GitHub repositories',
      error?.statusCode || 500
    )
  }
})

/**
 * Sync entire organization data (admin only)
 */
async function syncOrganizationData(companyId: string, logger: any) {
  // Check if GitHub App is installed
  const installation = await db.gitHubInstallation.findFirst({
    where: { companyId, isActive: true }
  })

  if (!installation) {
    throw new NotFoundError('GitHub App installation', companyId)
  }

  // Sync organization repositories
  const repoSyncResult = await enhancedGitHubService.syncOrganizationRepositories(companyId)

  // Discover and match employees
  const discoveryResult = await discoveryService.discoverOrganizationMembers(companyId)

  // Generate skills for all discovered employees
  await discoveryService.generateSkillsForDiscoveredEmployees(companyId)

  // Get final statistics
  const [totalEmployees, totalRepositories, totalSkills] = await Promise.all([
    db.employee.count({ where: { companyId } }),
    db.repository.count({
      where: {
        companyId
      }
    }),
    db.skillRecord.count({
      where: {
        employee: { companyId }
      }
    })
  ])

  return {
    type: 'organization_sync',
    repositories: repoSyncResult,
    discovery: discoveryResult,
    totals: {
      employees: totalEmployees,
      repositories: totalRepositories,
      skills: totalSkills
    },
    nextSteps: [
      'Review employee-GitHub matches in the admin dashboard',
      'Set up webhooks for real-time updates',
      'Configure automatic certificate generation'
    ]
  }
}

/**
 * Sync individual employee contributions
 */
async function syncEmployeeContributions(employeeId: string, logger: any) {
  console.log('Starting syncEmployeeContributions for:', employeeId)

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { githubConnection: true }
  })

  console.log('Employee found:', employee?.id, 'GitHub connected:', !!employee?.githubConnection)

  if (!employee) {
    throw new NotFoundError('Employee', employeeId)
  }

  // Check if employee has GitHub connected
  if (!employee.githubConnection || !employee.githubUsername) {
    console.error('No GitHub connection found for employee:', employeeId)
    throw new NotFoundError(
      'GitHub connection',
      'Please connect your GitHub account first'
    )
  }

  // Get GitHub client using employee's OAuth token
  console.log('Getting GitHub client for employee:', employeeId)
  const { GitHubService } = await import('@/services/github/client')
  const connection = await GitHubService.getConnection(employeeId)
  console.log('Connection retrieved:', !!connection)

  if (!connection) {
    throw new NotFoundError('GitHub connection', 'Connection not found')
  }

  const github = new GitHubService(connection.accessToken)

  // Comprehensive repository fetching strategy
  const allRepos = new Map<string, any>() // Use Map to deduplicate by full_name

  console.log('=== COMPREHENSIVE REPO SYNC ===')

  // 1. Fetch owned, collaborator, and org member repos
  console.log('1. Fetching owned, collaborator, and org repos...')
  const ownedRepos = await github.getAllAccessibleRepos()
  console.log(`   Found ${ownedRepos.length} owned/collaborator/org repos`)
  ownedRepos.forEach(repo => allRepos.set(repo.full_name, repo))

  // 2. Fetch public repos via public API
  if (employee.githubUsername) {
    console.log('2. Fetching public repos via public API...')
    const publicRepos = await github.getUserRepos(employee.githubUsername)
    console.log(`   Found ${publicRepos.length} public repos`)
    publicRepos.forEach(repo => allRepos.set(repo.full_name, repo))

    // 3. Fetch repos where user contributed (via merged PRs)
    console.log('3. Searching for contributed repos (merged PRs)...')
    const contributedRepos = await github.searchContributedRepos(employee.githubUsername)
    console.log(`   Found ${contributedRepos.length} contributed repos`)
    contributedRepos.forEach(repo => allRepos.set(repo.full_name, repo))
  }

  const repos = Array.from(allRepos.values())
  console.log(`=== TOTAL UNIQUE REPOS: ${repos.length} ===`)
  logger.info(`Found ${repos.length} total repositories (owned + public + contributed)`)

  // Save repositories to database
  let savedRepos = 0
  for (const repo of repos) {
    const existingRepo = await db.repository.findFirst({
      where: { githubRepoId: String(repo.id) }
    })

    if (existingRepo) {
      await db.repository.update({
        where: { id: existingRepo.id },
        data: {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          primaryLanguage: repo.language,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          isPrivate: repo.private,
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
        }
      })
    } else {
      const newRepo = await db.repository.create({
        data: {
          companyId: employee.companyId,
          githubRepoId: String(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          homepage: repo.homepage,
          defaultBranch: repo.default_branch || 'main',
          githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
          primaryLanguage: repo.language,
          languages: {},
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          watchers: repo.watchers_count || 0,
          size: repo.size || 0,
          openIssues: repo.open_issues_count || 0,
          isPrivate: repo.private,
          isFork: repo.fork || false,
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
        }
      })

      // Create employee-repository relationship
      await db.employeeRepository.create({
        data: {
          employeeId: employeeId,
          repositoryId: newRepo.id,
          isContributor: true
        }
      })

      savedRepos++
    }
  }

  // Update last sync time
  await db.gitHubConnection.update({
    where: { employeeId },
    data: { updatedAt: new Date() }
  })

  // Get total repositories and skill count
  const [totalRepositories, skillCount] = await Promise.all([
    db.employeeRepository.count({ where: { employeeId } }),
    db.skillRecord.count({ where: { employeeId } })
  ])

  return {
    type: 'employee_sync',
    totalRepos: repos.length,
    newRepos: savedRepos,
    repositories: totalRepositories,
    skillCount: skillCount,
    skills: {
      total: skillCount,
      updated: new Date().toISOString()
    }
  }
}


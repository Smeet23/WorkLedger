import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/services/github/client'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Verify state for CSRF protection
    const storedState = request.cookies.get('github_oauth_state')?.value
    const employeeId = request.cookies.get('github_oauth_employee')?.value
    const returnUrl = request.cookies.get('github_oauth_return')?.value || '/employee/dashboard'

    if (!code || !state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=invalid_state`, baseUrl)
      )
    }

    if (!employeeId) {
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=missing_employee`, baseUrl)
      )
    }

    console.log('=== GITHUB CALLBACK START ===')
    console.log('Employee ID:', employeeId)
    console.log('Code received:', !!code)

    // Exchange code for access token
    console.log('Exchanging code for token...')
    const tokenData = await GitHubService.exchangeCodeForToken(code)
    console.log('Token received:', !!tokenData.access_token)
    console.log('Token scope:', tokenData.scope)
    console.log('Token type:', tokenData.token_type)

    // Create GitHub client with the new token
    const github = new GitHubService(tokenData.access_token)

    // Get GitHub user data
    console.log('Fetching GitHub user...')
    const githubUser = await github.getAuthenticatedUser()
    console.log('GitHub user:', githubUser.login, githubUser.id)

    // Save connection to database
    console.log('Saving connection to database...')
    const savedConnection = await GitHubService.saveConnection(
      employeeId,
      githubUser,
      tokenData.access_token
    )
    console.log('Connection saved:', savedConnection.id)

    // Update employee record with GitHub info
    console.log('Updating employee record...')
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: {
        githubUsername: githubUser.login,
        githubId: String(githubUser.id)
      }
    })
    console.log('Employee updated:', updatedEmployee.githubUsername)

    // Check if user is employee or company admin
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { company: true }
    })

    // Trigger immediate sync (for development/demo purposes)
    try {
      console.log('Starting immediate GitHub sync for employee:', employeeId)

      if (employee?.role === 'MANAGER') {
        // For company admin, try to sync organization if GitHub App is installed
        const installation = await db.gitHubInstallation.findFirst({
          where: { companyId: employee.companyId, isActive: true }
        })

        if (installation) {
          const { enhancedGitHubService } = await import('@/services/github/enhanced-client')
          const { GitHubAutoDiscoveryService } = await import('@/services/github/auto-discovery')
          const discoveryService = new GitHubAutoDiscoveryService()

          // Sync organization repositories
          await enhancedGitHubService.syncOrganizationRepositories(employee.companyId)

          // Auto-discover employees
          await discoveryService.discoverOrganizationMembers(employee.companyId)

          // Generate skills
          await discoveryService.generateSkillsForDiscoveredEmployees(employee.companyId)

          console.log('Organization sync completed')
        }
      } else {
        // For regular employee, sync their individual repositories
        console.log('=== COMPREHENSIVE REPO SYNC (Callback) ===')
        const allRepos = new Map<string, any>()

        // 1. Fetch owned, collaborator, and org repos via OAuth
        console.log('1. Fetching owned/collaborator/org repos via OAuth...')
        const ownedRepos = await github.getAllAccessibleRepos()
        console.log(`   Found ${ownedRepos.length} owned/collaborator/org repos`)
        ownedRepos.forEach(repo => allRepos.set(repo.full_name, repo))

        // 2. Fetch public repos via public API
        console.log('2. Fetching public repos via public API...')
        const publicRepos = await github.getUserRepos(githubUser.login)
        console.log(`   Found ${publicRepos.length} public repos`)
        publicRepos.forEach(repo => allRepos.set(repo.full_name, repo))

        // 3. Fetch contributed repos (merged PRs)
        console.log('3. Searching for contributed repos (merged PRs)...')
        const contributedRepos = await github.searchContributedRepos(githubUser.login)
        console.log(`   Found ${contributedRepos.length} contributed repos`)
        contributedRepos.forEach(repo => allRepos.set(repo.full_name, repo))

        const repos = Array.from(allRepos.values())
        console.log(`=== TOTAL UNIQUE REPOS: ${repos.length} ===`)

        // Save repositories (company-level)
        for (const repo of repos) {
          const existingRepo = await db.repository.findFirst({
            where: {
              githubRepoId: String(repo.id)
            }
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

            // Update or create employee-repository relationship
            await db.employeeRepository.upsert({
              where: {
                employeeId_repositoryId: {
                  employeeId: employeeId,
                  repositoryId: existingRepo.id
                }
              },
              update: {
                lastActivityAt: new Date()
              },
              create: {
                employeeId: employeeId,
                repositoryId: existingRepo.id
              }
            })
          } else if (employee?.companyId) {
            // Create new repository at company level
            const newRepo = await db.repository.create({
              data: {
                companyId: employee.companyId,
                githubRepoId: String(repo.id),
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                homepage: repo.homepage,
                defaultBranch: repo.default_branch || 'main',
                primaryLanguage: repo.language,
                languages: {},
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                watchers: repo.watchers_count || 0,
                size: repo.size || 0,
                openIssues: repo.open_issues_count || 0,
                isPrivate: repo.private,
                isFork: repo.fork || false,
                githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
                pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
              }
            })

            // Create employee-repository relationship
            await db.employeeRepository.create({
              data: {
                employeeId: employeeId,
                repositoryId: newRepo.id
              }
            })
          }
        }

        console.log('Employee repositories synced')
      }
    } catch (syncError) {
      // Don't fail the entire callback if sync fails
      console.error('Immediate sync failed (non-critical):', syncError)
    }

    // Redirect back to the page where user initiated the OAuth flow
    const redirectPath = returnUrl

    // Clear cookies
    const response = NextResponse.redirect(
      new URL(`${redirectPath}?connected=true&synced=true`, baseUrl)
    )
    response.cookies.delete('github_oauth_state')
    response.cookies.delete('github_oauth_employee')
    response.cookies.delete('github_oauth_return')

    return response
  } catch (error: any) {
    console.error('=== GITHUB CALLBACK ERROR ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    // Try to get the return URL from cookies, fallback to dashboard
    const returnUrl = request.cookies.get('github_oauth_return')?.value || '/employee/dashboard'
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || request.url

    return NextResponse.redirect(
      new URL(`${returnUrl}?error=github_connection_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, baseUrl)
    )
  }
}
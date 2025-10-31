import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { GitHubService } from '@/services/github/client'
import { Octokit } from '@octokit/rest'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const employee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { githubConnection: true }
    })

    if (!employee?.githubConnection) {
      return NextResponse.json({ error: 'No GitHub connection' }, { status: 404 })
    }

    const connection = await GitHubService.getConnection(employee.id)
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const octokit = new Octokit({ auth: connection.accessToken })
    const results: any = {
      employee: {
        id: employee.id,
        githubUsername: employee.githubUsername
      },
      connection: {
        username: connection.githubUsername,
        scope: connection.scope
      },
      tests: {}
    }

    // Test 1: Get authenticated user
    try {
      const { data: user } = await octokit.rest.users.getAuthenticated()
      results.tests.getAuthenticatedUser = {
        success: true,
        login: user.login,
        publicRepos: user.public_repos,
        totalPrivateRepos: user.total_private_repos,
        ownedPrivateRepos: user.owned_private_repos
      }
    } catch (error: any) {
      results.tests.getAuthenticatedUser = {
        success: false,
        error: error.message
      }
    }

    // Test 2: List repos for authenticated user (all affiliations)
    try {
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        affiliation: 'owner,collaborator,organization_member',
        visibility: 'all'
      })
      results.tests.listForAuthenticatedUser = {
        success: true,
        count: repos.length,
        sample: repos.slice(0, 3).map(r => ({
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          owner: r.owner.login
        }))
      }
    } catch (error: any) {
      results.tests.listForAuthenticatedUser = {
        success: false,
        error: error.message,
        status: error.status
      }
    }

    // Test 3: List repos for authenticated user (owner only)
    try {
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        affiliation: 'owner'
      })
      results.tests.listForAuthenticatedUserOwnerOnly = {
        success: true,
        count: repos.length,
        sample: repos.slice(0, 3).map(r => r.name)
      }
    } catch (error: any) {
      results.tests.listForAuthenticatedUserOwnerOnly = {
        success: false,
        error: error.message
      }
    }

    // Test 4: List user repos (public API)
    if (employee.githubUsername) {
      try {
        const { data: repos } = await octokit.rest.repos.listForUser({
          username: employee.githubUsername,
          per_page: 100,
          type: 'all'
        })
        results.tests.listForUser = {
          success: true,
          count: repos.length,
          sample: repos.slice(0, 3).map(r => r.name)
        }
      } catch (error: any) {
        results.tests.listForUser = {
          success: false,
          error: error.message
        }
      }
    }

    // Test 5: Check rate limit
    try {
      const { data: rateLimit } = await octokit.rest.rateLimit.get()
      results.tests.rateLimit = {
        success: true,
        remaining: rateLimit.rate.remaining,
        limit: rateLimit.rate.limit,
        reset: new Date(rateLimit.rate.reset * 1000).toISOString()
      }
    } catch (error: any) {
      results.tests.rateLimit = {
        success: false,
        error: error.message
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

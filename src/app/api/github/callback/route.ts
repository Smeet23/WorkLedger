import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/services/github/client'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Verify state for CSRF protection
    const storedState = request.cookies.get('github_oauth_state')?.value
    const employeeId = request.cookies.get('github_oauth_employee')?.value

    if (!code || !state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/employee?error=invalid_state', request.url)
      )
    }

    if (!employeeId) {
      return NextResponse.redirect(
        new URL('/employee?error=missing_employee', request.url)
      )
    }

    // Exchange code for access token
    const tokenData = await GitHubService.exchangeCodeForToken(code)

    // Create GitHub client with the new token
    const github = new GitHubService(tokenData.access_token)

    // Get GitHub user data
    const githubUser = await github.getAuthenticatedUser()

    // Save connection to database
    await GitHubService.saveConnection(
      employeeId,
      githubUser,
      tokenData.access_token
    )

    // Update employee record with GitHub info
    await db.employee.update({
      where: { id: employeeId },
      data: {
        githubUsername: githubUser.login,
        githubId: String(githubUser.id)
      }
    })

    // Create a job to sync repositories
    await db.jobQueue.create({
      data: {
        type: 'github_sync',
        status: 'pending',
        priority: 1,
        payload: {
          employeeId,
          githubUsername: githubUser.login,
          action: 'initial_sync'
        }
      }
    })

    // Check if user is employee or company admin
    const employee = await db.employee.findUnique({
      where: { id: employeeId }
    })

    const redirectPath = employee?.role === 'MANAGER' ? '/dashboard' : '/employee'

    // Clear cookies
    const response = NextResponse.redirect(
      new URL(`${redirectPath}?github=connected`, request.url)
    )
    response.cookies.delete('github_oauth_state')
    response.cookies.delete('github_oauth_employee')

    return response
  } catch (error) {
    console.error('GitHub callback error:', error)
    return NextResponse.redirect(
      new URL('/employee?error=github_connection_failed', request.url)
    )
  }
}
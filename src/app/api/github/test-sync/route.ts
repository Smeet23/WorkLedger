import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { GitHubService } from '@/services/github/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get employee record
    const employee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { githubConnection: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    console.log('=== GITHUB CONNECTION TEST ===')
    console.log('Employee ID:', employee.id)
    console.log('Employee Email:', employee.email)
    console.log('GitHub Username:', employee.githubUsername)
    console.log('Has GitHub Connection:', !!employee.githubConnection)

    if (employee.githubConnection) {
      console.log('Connection Active:', employee.githubConnection.isActive)
      console.log('Connection Created:', employee.githubConnection.connectedAt)
      console.log('Has Access Token:', !!employee.githubConnection.encryptedAccessToken)
    }

    // Try to get connection
    const connection = await GitHubService.getConnection(employee.id)
    console.log('Connection Retrieved:', !!connection)

    if (!connection) {
      return NextResponse.json({
        error: 'No GitHub connection found',
        employee: {
          id: employee.id,
          email: employee.email,
          githubUsername: employee.githubUsername,
          hasConnection: !!employee.githubConnection
        }
      }, { status: 404 })
    }

    // Try to fetch repos
    console.log('Creating GitHub client...')
    const github = new GitHubService(connection.accessToken)

    console.log('Fetching repos with getAllAccessibleRepos()...')
    const repos = await github.getAllAccessibleRepos()
    console.log('Repos fetched:', repos.length)

    // Also try getUserRepos as a fallback
    console.log('Trying getUserRepos as fallback...')
    const userRepos = employee.githubUsername
      ? await github.getUserRepos(employee.githubUsername)
      : []
    console.log('User repos fetched:', userRepos.length)

    // Debug: Log the actual API response
    console.log('Sample repo data:', JSON.stringify(repos.slice(0, 1), null, 2))

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        email: employee.email,
        githubUsername: employee.githubUsername
      },
      connection: {
        active: connection.isActive,
        username: connection.githubUsername,
        hasToken: !!connection.accessToken
      },
      repos: {
        count: repos.length,
        userReposCount: userRepos.length,
        sample: repos.slice(0, 3).map(r => ({
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          language: r.language
        })),
        userReposSample: userRepos.slice(0, 3).map(r => ({
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          language: r.language
        }))
      }
    })

  } catch (error: any) {
    console.error('Test sync error:', error)
    return NextResponse.json({
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 })
  }
}

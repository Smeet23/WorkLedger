import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitHubService } from '@/services/github/client'
import { generateSecureToken } from '@/lib/crypto'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Get the return URL from query params (where to redirect after OAuth)
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/employee/dashboard'

    // Get or create employee record for the user
    let employee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { company: true }
    })

    // If no employee record exists, create one
    if (!employee) {
      // First, find or create a company based on email domain
      const emailDomain = session.user.email.split('@')[1]

      let company = await db.company.findFirst({
        where: { domain: emailDomain }
      })

      if (!company) {
        company = await db.company.create({
          data: {
            name: emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1),
            domain: emailDomain
          }
        })
      }

      // Create employee record
      const employeeRole = session.user.role === 'company_admin' ? 'MANAGER' : 'OTHER'
      employee = await db.employee.create({
        data: {
          email: session.user.email,
          firstName: session.user.firstName || session.user.email.split('@')[0],
          lastName: session.user.lastName || '',
          companyId: company.id,
          role: employeeRole
        },
        include: { company: true }
      })
    }

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    // Check if already connected
    const existingConnection = await db.gitHubConnection.findUnique({
      where: { employeeId: employee.id }
    })

    if (existingConnection?.isActive) {
      return NextResponse.json({
        message: 'Already connected to GitHub',
        connected: true
      })
    }

    // Generate state token for CSRF protection
    const state = generateSecureToken()

    // Get OAuth URL
    const oauthUrl = GitHubService.getOAuthUrl(state)
    console.log('=== GITHUB CONNECT ===')
    console.log('Employee ID:', employee.id)
    console.log('OAuth URL:', oauthUrl)
    console.log('State:', state)

    // Store state in session (you might want to use a more persistent storage)
    const response = NextResponse.redirect(oauthUrl)

    // Set state in cookie for verification
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    // Store employee ID in cookie for callback
    response.cookies.set('github_oauth_employee', employee.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    // Store return URL in cookie for callback
    response.cookies.set('github_oauth_return', returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error) {
    console.error('GitHub connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate GitHub connection' },
      { status: 500 }
    )
  }
}
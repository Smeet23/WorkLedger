/**
 * Jira Disconnect Route
 * Disconnects Jira integration for a company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { JiraService } from '@/services/jira/client'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user's company
    const user = await db.employee.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Disconnect integration
    await JiraService.disconnectIntegration(user.companyId)

    console.log('✅ Jira integration disconnected for company:', user.companyId)

    return NextResponse.json({
      success: true,
      message: 'Jira integration disconnected successfully',
    })
  } catch (error) {
    console.error('❌ Error disconnecting Jira:', error)
    return NextResponse.json(
      {
        error: 'Failed to disconnect Jira',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

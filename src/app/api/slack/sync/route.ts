/**
 * Slack Manual Sync Route
 * Triggers a manual sync of Slack workspace data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { SlackSyncService } from '@/services/slack/sync'
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

    // Create sync service
    const syncService = await SlackSyncService.createFromCompany(user.companyId)

    if (!syncService) {
      return NextResponse.json(
        { error: 'Slack integration not found or not active' },
        { status: 404 }
      )
    }

    console.log('🔄 Starting manual Slack sync for company:', user.companyId)

    // Run full sync
    const result = await syncService.fullSync()

    console.log('✅ Manual sync completed')

    return NextResponse.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error during manual sync:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Slack data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

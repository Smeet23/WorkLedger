import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employee record
    const employee = await db.employee.findFirst({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json({
        connected: false,
        connection: null
      })
    }

    // Check GitHub connection
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId: employee.id },
      select: {
        id: true,
        githubUsername: true,
        isActive: true,
        lastSync: true,
        connectedAt: true
      }
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json({
        connected: false,
        connection: null
      })
    }

    // Get repository count
    const repositoryCount = await db.repository.count({
      where: { employeeId: employee.id }
    })

    // Get skill count from GitHub
    const skillRecords = await db.skillRecord.count({
      where: {
        employeeId: employee.id,
        source: 'github'
      }
    })

    return NextResponse.json({
      connected: true,
      connection: {
        ...connection,
        repositoryCount,
        skillCount: skillRecords
      }
    })
  } catch (error) {
    console.error('GitHub status error:', error)
    return NextResponse.json(
      { error: 'Failed to get GitHub status' },
      { status: 500 }
    )
  }
}
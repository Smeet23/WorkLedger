import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if connected
    const connection = await db.gitHubConnection.findUnique({
      where: { employeeId: employee.id }
    })

    if (!connection) {
      return NextResponse.json({ error: 'No GitHub connection found' }, { status: 404 })
    }

    // Soft delete the connection (mark as inactive)
    await db.gitHubConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Clear GitHub info from employee
    await db.employee.update({
      where: { id: employee.id },
      data: {
        githubUsername: null,
        githubId: null
      }
    })

    return NextResponse.json({
      message: 'Successfully disconnected from GitHub',
      success: true
    })
  } catch (error) {
    console.error('GitHub disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect GitHub' },
      { status: 500 }
    )
  }
}
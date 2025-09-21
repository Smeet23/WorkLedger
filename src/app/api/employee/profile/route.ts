import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: {
        company: true,
        skillRecords: {
          include: { skill: true }
        },
        githubConnection: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      title: employee.title,
      department: employee.department,
      bio: employee.bio,
      linkedinUrl: employee.linkedinUrl,
      githubUrl: employee.githubConnection?.githubUsername
        ? `https://github.com/${employee.githubConnection.githubUsername}`
        : '',
      personalWebsite: employee.personalWebsite,
      role: employee.role,
      startDate: employee.startDate,
      company: {
        name: employee.company.name,
        domain: employee.company.domain
      },
      skills: employee.skillRecords.map(sr => sr.skill.name)
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await db.employee.findFirst({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()

    // Update employee profile
    const updated = await db.employee.update({
      where: { id: employee.id },
      data: {
        firstName: body.firstName || employee.firstName,
        lastName: body.lastName || employee.lastName,
        title: body.title,
        department: body.department,
        bio: body.bio,
        linkedinUrl: body.linkedinUrl,
        personalWebsite: body.personalWebsite,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updated
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
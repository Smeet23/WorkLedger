import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      role = 'OTHER',
      title,
      department,
      sendEmail: shouldSendEmail = true
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Get admin user
    const admin = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Find the admin's employee record to get company
    const adminEmployee = await db.employee.findFirst({
      where: { email: admin.email },
      include: { company: true }
    })

    if (!adminEmployee?.company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if employee already exists
    const existingEmployee = await db.employee.findUnique({
      where: { email }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'An employee with this email already exists' },
        { status: 400 }
      )
    }

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email,
        companyId: adminEmployee.company.id,
        status: 'pending'
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation
    const invitation = await db.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        title,
        department,
        companyId: adminEmployee.company.id,
        invitedBy: session.user.email,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    // Send invitation email if requested
    if (shouldSendEmail) {
      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/accept-invitation?token=${invitation.token}`

      await sendEmail({
        to: email,
        subject: `You're invited to join ${adminEmployee.company.name} on WorkLedger`,
        html: `
          <h2>Welcome to WorkLedger!</h2>
          <p>Hi ${firstName},</p>
          <p>${session.user.name || session.user.email} has invited you to join ${adminEmployee.company.name} on WorkLedger.</p>
          <p>WorkLedger helps track and certify your professional skills through automated analysis of your work.</p>
          <h3>Your Invitation Details:</h3>
          <ul>
            <li><strong>Company:</strong> ${adminEmployee.company.name}</li>
            <li><strong>Role:</strong> ${role}</li>
            ${title ? `<li><strong>Title:</strong> ${title}</li>` : ''}
            ${department ? `<li><strong>Department:</strong> ${department}</li>` : ''}
          </ul>
          <p>Click the link below to accept your invitation and set up your account:</p>
          <p><a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
          <p><small>This invitation will expire in 7 days.</small></p>
          <p>If you have any questions, please contact ${session.user.email}.</p>
        `
      })
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: `${invitation.firstName} ${invitation.lastName}`,
        status: invitation.status,
        token: invitation.token
      },
      message: shouldSendEmail
        ? 'Invitation sent successfully'
        : 'Invitation created successfully'
    })

  } catch (error) {
    console.error('Failed to send invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
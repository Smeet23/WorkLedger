import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { config } from '@/lib/config'
import { createApiResponse, withErrorHandling, validateRequest } from '@/lib/api-response'
import { inviteEmployeeSchema } from '@/lib/validations'
import {
  AuthorizationError,
  NotFoundError,
  DuplicateResourceError,
  ConflictError,
  ErrorMessages
} from '@/lib/errors'
import { loggers, eventLoggers } from '@/lib/logger'
import { generateSecureToken } from '@/lib/crypto'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()
  const logger = loggers.apiRequest('POST', '/api/company/invitations/send')

  // Authentication check
  const session = await getServerSession()
  if (!session?.user || session.user.role !== 'company_admin') {
    throw new AuthorizationError(ErrorMessages.INSUFFICIENT_PERMISSIONS)
  }

  logger.info('Processing invitation request', {
    adminId: session.user.id,
    adminEmail: session.user.email
  })

  // Validate request body
  const data = await validateRequest(request, inviteEmployeeSchema)

  // Get admin user with company info
  const adminEmployee = await db.employee.findFirst({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!adminEmployee?.company) {
    throw new NotFoundError('Company', session.user.email)
  }

  const companyLogger = logger.withCompany(adminEmployee.company.id)

  // Check if employee already exists in the company
  const existingEmployee = await db.employee.findUnique({
    where: { email: data.email }
  })

  if (existingEmployee) {
    throw new DuplicateResourceError('Employee', 'email', data.email)
  }

  // Check for existing pending invitation
  const existingInvitation = await db.invitation.findFirst({
    where: {
      email: data.email,
      companyId: adminEmployee.company.id,
      status: 'pending'
    }
  })

  if (existingInvitation) {
    throw new ConflictError(ErrorMessages.INVITATION_ALREADY_ACCEPTED)
  }

  // Calculate expiry date using configuration
  const expiryDate = new Date(
    Date.now() + config.email.templates.invitation.expiryDays * 24 * 60 * 60 * 1000
  )

  // Create invitation with secure token
  const invitation = await db.invitation.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      title: data.title,
      department: data.department,
      companyId: adminEmployee.company.id,
      invitedBy: session.user.email,
      status: 'pending',
      expiresAt: expiryDate,
      token: generateSecureToken() // Use secure token generation
    }
  })

  companyLogger.info('Invitation created', {
    invitationId: invitation.id,
    inviteeEmail: data.email,
    role: data.role
  })

  // Send invitation email if requested
  if (data.sendEmail && config.features.emailNotifications) {
    try {
      const inviteUrl = `${config.app.url}/auth/accept-invitation/${invitation.token}`

      await sendEmail({
        to: data.email,
        subject: config.email.templates.invitation.subject.replace(
          '{companyName}',
          adminEmployee.company.name
        ),
        html: generateInvitationEmailTemplate({
          firstName: data.firstName,
          companyName: adminEmployee.company.name,
          inviterName: session.user.firstName + ' ' + session.user.lastName,
          inviterEmail: session.user.email,
          role: data.role,
          title: data.title,
          department: data.department,
          inviteUrl,
          expiryDays: config.email.templates.invitation.expiryDays
        })
      })

      // Log successful email send
      eventLoggers.invitationSent(
        adminEmployee.company.id,
        data.email,
        session.user.email
      )

      companyLogger.info('Invitation email sent', {
        invitationId: invitation.id,
        recipientEmail: data.email
      })
    } catch (emailError) {
      // Log email error but don't fail the invitation creation
      companyLogger.warn('Failed to send invitation email', {
        invitationId: invitation.id,
        error: emailError
      })
    }
  }

  return apiResponse.created({
    invitation: {
      id: invitation.id,
      email: invitation.email,
      name: `${invitation.firstName} ${invitation.lastName}`,
      status: invitation.status,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString()
    }
  }, data.sendEmail && config.features.emailNotifications
    ? 'Invitation sent successfully'
    : 'Invitation created successfully'
  )
})

// Email template generation function
function generateInvitationEmailTemplate(params: {
  firstName: string
  companyName: string
  inviterName: string
  inviterEmail: string
  role: string
  title?: string
  department?: string
  inviteUrl: string
  expiryDays: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${params.companyName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${config.app.name}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Professional Skill Certification Platform</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #667eea; margin-top: 0;">Welcome to ${params.companyName}!</h2>

        <p>Hi ${params.firstName},</p>

        <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.companyName}</strong> on ${config.app.name}.</p>

        <p>${config.app.name} helps track and certify your professional skills through automated analysis of your work, helping you build a verified portfolio of your achievements.</p>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Your Invitation Details:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Company:</strong> ${params.companyName}</li>
            <li><strong>Role:</strong> ${params.role}</li>
            ${params.title ? `<li><strong>Title:</strong> ${params.title}</li>` : ''}
            ${params.department ? `<li><strong>Department:</strong> ${params.department}</li>` : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.inviteUrl}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;">
            Accept Invitation
          </a>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⏰ Important:</strong> This invitation will expire in ${params.expiryDays} days.
          </p>
        </div>

        <p>If you have any questions, please contact <a href="mailto:${params.inviterEmail}" style="color: #667eea;">${params.inviterEmail}</a>.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          This email was sent by ${config.app.name}. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `
}
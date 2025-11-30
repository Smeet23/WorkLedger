import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { sendEmail } from '@/lib/email'
import { renderInvitationEmail } from '@/lib/email-templates'
import { config } from '@/lib/config'
import { createApiResponse, validateRequest } from '@/lib/api-response'
import { inviteEmployeeSchema } from '@/lib/validations'
import {
  NotFoundError,
  DuplicateResourceError,
  ConflictError,
  ErrorMessages
} from '@/lib/errors'
import { loggers, eventLoggers } from '@/lib/logger'
import { generateSecureToken } from '@/lib/crypto'

const apiResponse = createApiResponse()

export const POST = withCompanyAdmin(async (request, { user, companyId }) => {
  const logger = loggers.apiRequest('POST', '/api/company/invitations/send')

  logger.info('Processing invitation request', {
    adminId: user.id,
    adminEmail: user.email
  })

  // Validate request body
  const data = await validateRequest(request, inviteEmployeeSchema)

  // Get admin user with company info
  const adminEmployee = await db.employee.findFirst({
    where: { email: user.email },
    include: { company: true }
  })

  if (!adminEmployee?.company) {
    throw new NotFoundError('Company', user.email)
  }

  const companyLogger = logger.withCompany(companyId)

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
      invitedBy: user.email,
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
        html: await renderInvitationEmail({
          firstName: data.firstName,
          companyName: adminEmployee.company.name,
          inviterName: user.firstName + ' ' + user.lastName,
          inviterEmail: user.email,
          role: data.role,
          title: data.title,
          department: data.department,
          inviteUrl,
          expiryDays: config.email.templates.invitation.expiryDays,
          appName: config.app.name
        })
      })

      // Log successful email send
      eventLoggers.invitationSent(
        adminEmployee.company.id,
        data.email,
        user.email
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
import { render } from '@react-email/render'
import InvitationEmail from '@/emails/invitation-email'

/**
 * Email template utilities using React Email
 *
 * Benefits:
 * - Type-safe email templates
 * - Reusable React components
 * - Better maintainability
 * - Easy to preview and test
 */

interface InvitationEmailParams {
  firstName: string
  companyName: string
  inviterName: string
  inviterEmail: string
  role: string
  title?: string
  department?: string
  inviteUrl: string
  expiryDays: number
  appName?: string
}

/**
 * Render invitation email template to HTML
 * @param params - Invitation email parameters
 * @returns HTML string
 */
export function renderInvitationEmail(params: InvitationEmailParams): string {
  return render(InvitationEmail(params))
}

// Add more email template renderers here as needed
// Example:
// export function renderWelcomeEmail(params: WelcomeEmailParams): string {
//   return render(WelcomeEmail(params))
// }

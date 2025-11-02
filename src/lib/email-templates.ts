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
 * @returns Promise with HTML string
 */
export async function renderInvitationEmail(params: InvitationEmailParams): Promise<string> {
  return await render(InvitationEmail(params))
}

// Add more email template renderers here as needed
// Example:
// export async function renderWelcomeEmail(params: WelcomeEmailParams): Promise<string> {
//   return await render(WelcomeEmail(params))
// }

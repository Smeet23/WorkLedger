import { Resend } from 'resend'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send email using Resend
 * Industry-standard email service with excellent deliverability
 *
 * @param options - Email options (to, subject, html, text, replyTo, tags)
 * @returns Promise with email result (id, from, to, created_at)
 */
export async function sendEmail(options: EmailOptions) {
  // Development mode: Log to console if no API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log('📧 Email (Development Mode - No RESEND_API_KEY):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Reply-To:', options.replyTo || 'N/A')
    console.log('Tags:', options.tags || 'N/A')
    console.log('Content:', options.html)
    console.log('---')
    return {
      id: 'dev-' + Date.now(),
      from: process.env.RESEND_FROM_EMAIL || 'WorkLedger <noreply@workledger.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      created_at: new Date().toISOString()
    }
  }

  try {
    // Send email using Resend SDK
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'WorkLedger <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
      tags: options.tags,
    })

    // Resend returns { data: {...}, error: null } on success
    if (result.error) {
      console.error('❌ Resend API Error:', result.error)
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    console.log('✅ Email sent successfully via Resend:', result.data?.id)
    return result.data
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    throw error
  }
}

/**
 * Send bulk emails (up to 100 recipients per batch)
 * More efficient than sending individual emails
 */
export async function sendBulkEmails(emails: EmailOptions[]) {
  if (!process.env.RESEND_API_KEY) {
    console.log('📧 Bulk Email (Development Mode - No RESEND_API_KEY):')
    console.log(`Sending ${emails.length} emails...`)
    emails.forEach((email, i) => {
      console.log(`[${i + 1}] To: ${email.to}, Subject: ${email.subject}`)
    })
    console.log('---')
    return emails.map((_, i) => ({
      id: `dev-bulk-${Date.now()}-${i}`,
      created_at: new Date().toISOString()
    }))
  }

  try {
    const result = await resend.batch.send(
      emails.map(email => ({
        from: process.env.RESEND_FROM_EMAIL || 'WorkLedger <onboarding@resend.dev>',
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text || stripHtml(email.html),
        replyTo: email.replyTo,
        tags: email.tags,
      }))
    )

    if (result.error) {
      console.error('❌ Resend Batch API Error:', result.error)
      throw new Error(`Failed to send bulk emails: ${result.error.message}`)
    }

    console.log(`✅ ${emails.length} emails sent successfully via Resend batch`)
    return result.data
  } catch (error) {
    console.error('❌ Bulk email sending failed:', error)
    throw error
  }
}

// Simple HTML stripper for text version
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
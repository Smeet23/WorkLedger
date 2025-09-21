import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create reusable transporter
const createTransporter = () => {
  // For development, use console logging
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    return null
  }

  // For production, use actual SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendEmail(options: EmailOptions) {
  const transporter = createTransporter()

  // In development without SMTP, just log to console
  if (!transporter) {
    console.log('📧 Email (Development Mode):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Content:', options.html)
    console.log('---')
    return { messageId: 'dev-' + Date.now() }
  }

  // Send actual email
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"WorkLedger" <noreply@workledger.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
  })

  return info
}

// Simple HTML stripper for text version
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
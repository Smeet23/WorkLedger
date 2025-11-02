import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface InvitationEmailProps {
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

export const InvitationEmail = ({
  firstName = 'John',
  companyName = 'Acme Corp',
  inviterName = 'Jane Smith',
  inviterEmail = 'jane@acme.com',
  role = 'Developer',
  title = 'Senior Software Engineer',
  department = 'Engineering',
  inviteUrl = 'https://workledger.com/accept',
  expiryDays = 7,
  appName = 'WorkLedger',
}: InvitationEmailProps) => {
  const previewText = `Join ${companyName} on ${appName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{appName}</Heading>
            <Text style={headerSubtitle}>
              Professional Skill Certification Platform
            </Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h2}>Welcome to {companyName}!</Heading>

            <Text style={paragraph}>Hi {firstName},</Text>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{companyName}</strong> on {appName}.
            </Text>

            <Text style={paragraph}>
              {appName} helps track and certify your professional skills
              through automated analysis of your work, helping you build a
              verified portfolio of your achievements.
            </Text>

            {/* Details Box */}
            <Section style={detailsBox}>
              <Heading style={detailsHeading}>Your Invitation Details:</Heading>
              <ul style={detailsList}>
                <li>
                  <strong>Company:</strong> {companyName}
                </li>
                <li>
                  <strong>Role:</strong> {role}
                </li>
                {title && (
                  <li>
                    <strong>Title:</strong> {title}
                  </li>
                )}
                {department && (
                  <li>
                    <strong>Department:</strong> {department}
                  </li>
                )}
              </ul>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            {/* Warning Box */}
            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>⏰ Important:</strong> This invitation will expire in{' '}
                {expiryDays} days.
              </Text>
            </Section>

            <Text style={paragraph}>
              If you have any questions, please contact{' '}
              <a href={`mailto:${inviterEmail}`} style={link}>
                {inviterEmail}
              </a>
              .
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              This email was sent by {appName}. If you didn't expect this
              invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default InvitationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '30px',
  borderRadius: '10px 10px 0 0',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const headerSubtitle = {
  color: '#ffffff',
  fontSize: '16px',
  opacity: 0.9,
  margin: '10px 0 0 0',
  padding: '0',
}

const content = {
  padding: '30px',
}

const h2 = {
  color: '#667eea',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 15px',
}

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 15px',
}

const detailsBox = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
}

const detailsHeading = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px',
}

const detailsList = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
  paddingLeft: '20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
  padding: '15px 30px',
  textDecoration: 'none',
  borderRadius: '8px',
  display: 'inline-block',
  fontWeight: 'bold',
  fontSize: '16px',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
}

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '30px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0',
}

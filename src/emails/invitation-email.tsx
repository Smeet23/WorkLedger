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
  const previewText = `${inviterName} invited you to join ${companyName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Simple Header */}
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h1}>You've been invited to {companyName}</Heading>

            <Text style={paragraph}>Hi {firstName},</Text>

            <Text style={paragraph}>
              {inviterName} ({inviterEmail}) has invited you to join{' '}
              <strong>{companyName}</strong> on {appName}.
            </Text>

            {/* Details Table */}
            <Section style={detailsBox}>
              <table style={detailsTable}>
                <tbody>
                  <tr>
                    <td style={labelCell}>Company</td>
                    <td style={valueCell}>{companyName}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Role</td>
                    <td style={valueCell}>{role}</td>
                  </tr>
                  {title && (
                    <tr>
                      <td style={labelCell}>Title</td>
                      <td style={valueCell}>{title}</td>
                    </tr>
                  )}
                  {department && (
                    <tr>
                      <td style={labelCell}>Department</td>
                      <td style={valueCell}>{department}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept invitation
              </Button>
            </Section>

            <Text style={expiryText}>
              This invitation expires in {expiryDays} days.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              If you have questions, contact{' '}
              <a href={`mailto:${inviterEmail}`} style={link}>
                {inviterEmail}
              </a>
            </Text>

            <Text style={footer}>
              This invitation was intended for {firstName}. If you didn't expect
              this, you can ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              {appName} • Employee Management Platform
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default InvitationEmail

// Styles - Clean, industry-standard design
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  border: '1px solid #e5e5e5',
}

const header = {
  padding: '32px 40px',
  borderBottom: '1px solid #e5e5e5',
}

const logo = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#000000',
  margin: '0',
  letterSpacing: '-0.5px',
}

const content = {
  padding: '40px',
}

const h1 = {
  color: '#000000',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
  letterSpacing: '-0.5px',
}

const paragraph = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const detailsBox = {
  margin: '32px 0',
}

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
}

const labelCell = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#737373',
  borderBottom: '1px solid #f5f5f5',
  width: '140px',
  fontWeight: '500',
}

const valueCell = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#171717',
  borderBottom: '1px solid #f5f5f5',
  fontWeight: '500',
}

const buttonContainer = {
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  padding: '12px 28px',
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
  fontWeight: '500',
  fontSize: '15px',
  lineHeight: '1.5',
}

const expiryText = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 24px',
}

const link = {
  color: '#000000',
  textDecoration: 'underline',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '32px 0',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
}

const footerSection = {
  padding: '24px 40px',
  borderTop: '1px solid #e5e5e5',
  backgroundColor: '#fafafa',
}

const footerText = {
  color: '#a3a3a3',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
}

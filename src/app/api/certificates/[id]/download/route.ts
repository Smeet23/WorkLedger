import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get certificate
    const certificate = await db.certificate.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: { company: true }
        },
        certificateFile: true
      }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check if user has access to this certificate
    if (certificate.employee.email !== session.user.email) {
      // Check if user is a company admin
      const isAdmin = session.user.role === 'company_admin'
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Generate HTML certificate
    const skillsData = certificate.skillsData as any
    const achievements = certificate.achievements as any

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Professional Skills Certificate - ${certificate.employee.firstName} ${certificate.employee.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .certificate {
      background: white;
      max-width: 800px;
      width: 100%;
      padding: 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .company-name {
      font-size: 28px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .certificate-title {
      font-size: 20px;
      color: #667eea;
      font-weight: 500;
      margin-bottom: 30px;
    }
    .decorative-line {
      width: 100px;
      height: 3px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      margin: 20px auto;
    }
    .employee-section {
      text-align: center;
      margin: 50px 0;
    }
    .certify-text {
      font-size: 16px;
      color: #718096;
      margin-bottom: 20px;
    }
    .employee-name {
      font-size: 36px;
      font-weight: 700;
      color: #1a202c;
      margin: 20px 0;
    }
    .employee-title {
      font-size: 18px;
      color: #4a5568;
      margin-bottom: 10px;
    }
    .period {
      font-size: 14px;
      color: #a0aec0;
      font-style: italic;
    }
    .skills-section {
      margin: 40px 0;
      background: #f7fafc;
      border-radius: 12px;
      padding: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .skill-item {
      background: white;
      padding: 10px 15px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
      display: flex;
      flex-direction: column;
    }
    .skill-name {
      font-weight: 600;
      font-size: 13px;
      color: #2d3748;
      text-transform: capitalize;
    }
    .skill-level {
      font-size: 11px;
      color: #667eea;
      margin-top: 4px;
      font-weight: 500;
    }
    .stats-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
      text-align: center;
    }
    .stat-item {
      padding: 20px;
      background: linear-gradient(135deg, #667eea15, #764ba215);
      border-radius: 10px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 5px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .verification-info {
      font-size: 11px;
      color: #718096;
      line-height: 1.6;
    }
    .verification-id {
      font-family: monospace;
      background: #f7fafc;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #2d3748;
    }
    .issue-date {
      margin-top: 10px;
      font-size: 12px;
      color: #a0aec0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #667eea;
      color: white;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        border-radius: 0;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="company-name">${certificate.employee.company.name}</div>
      <div class="certificate-title">Certificate of Professional Skills</div>
      <div class="decorative-line"></div>
    </div>

    <div class="employee-section">
      <div class="certify-text">This is to certify that</div>
      <div class="employee-name">${certificate.employee.firstName} ${certificate.employee.lastName}</div>
      ${certificate.employee.title ? `<div class="employee-title">${certificate.employee.title}</div>` : ''}
      <div class="period">
        For the period of ${format(new Date(certificate.periodStart), 'MMMM dd, yyyy')}
        to ${format(new Date(certificate.periodEnd), 'MMMM dd, yyyy')}
      </div>
    </div>

    ${skillsData?.skills && skillsData.skills.length > 0 ? `
      <div class="skills-section">
        <div class="section-title">
          <span>💻</span>
          Technical Skills Demonstrated (${skillsData.skills.length})
        </div>
        <div class="skills-grid">
          ${skillsData.skills.map((skill: any) => `
            <div class="skill-item">
              <div class="skill-name">${skill.name}</div>
              <div class="skill-level">${skill.level}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-value">${skillsData?.skills?.length || 0}</div>
        <div class="stat-label">Skills</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${achievements?.repositories || 0}</div>
        <div class="stat-label">Projects</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${achievements?.languages?.length || 0}</div>
        <div class="stat-label">Languages</div>
      </div>
    </div>

    <div class="footer">
      <div class="verification-info">
        <div>Certificate ID: <span class="verification-id">${certificate.id}</span></div>
        <div>Verification ID: <span class="verification-id">${certificate.verificationId}</span></div>
        <div class="issue-date">Issued on ${format(new Date(certificate.issueDate), 'MMMM dd, yyyy')}</div>
      </div>
      <div>
        <span class="badge">${certificate.status}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Certificate download error:', error)
    return NextResponse.json(
      { error: 'Failed to download certificate' },
      { status: 500 }
    )
  }
}
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
      font-family: Georgia, 'Times New Roman', serif;
      background: #ece9e4;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    .toolbar a, .toolbar button {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: #111827;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
    }
    .certificate {
      background: #faf8f2; /* ivory */
      width: 1123px; /* A4 landscape at 96dpi approx */
      max-width: 100%;
      min-height: 794px;
      padding: 40px 50px 50px 50px;
      position: relative;
      color: #2b2b2b;
      box-shadow: 0 12px 40px rgba(0,0,0,.18);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    /* Ornate double border */
    .certificate:before, .certificate:after {
      content: '';
      position: absolute;
      inset: 14px;
      border: 3px solid #bfa66a; /* gold */
    }
    .certificate:after {
      inset: 28px;
      border: 1px dashed #d7caa0;
    }
    /* Subtle guilloche pattern */
    .pattern {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(191,166,106,.12), transparent 40%),
                  radial-gradient(circle at 20% 30%, rgba(191,166,106,.08), transparent 45%),
                  radial-gradient(circle at 80% 70%, rgba(191,166,106,.08), transparent 45%);
      opacity: .6;
      pointer-events: none;
    }
    .content-wrapper {
      position: relative;
      z-index: 1;
      flex: 1;
    }
    .header { text-align: center; margin-top: 12px; margin-bottom: 20px; }
    .issuer { font-size: 18px; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; }
    .title { font-size: 44px; letter-spacing: 1px; color: #8b6b20; margin-top: 6px; }
    .subtitle { font-size: 16px; color: #4b5563; margin-top: 4px; }

    .recipient {
      text-align: center;
      margin: 24px 0 20px;
    }
    .lead { font-size: 14px; color: #6b7280; letter-spacing: .4px; }
    .name { font-size: 40px; font-weight: 700; margin: 10px 0 6px; color: #222; }
    .role { font-size: 16px; color: #374151; }
    .period { font-size: 14px; color: #6b7280; margin-top: 8px; font-style: italic; }

    .skills {
      margin: 18px 0;
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
    }
    .skills h3 { font-size: 16px; color: #374151; margin-bottom: 10px; letter-spacing: .5px; }
    .skills-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }
    .skill {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex; flex-direction: column; gap: 4px;
      background: #fcfcfc;
    }
    .skill .n { font-size: 13px; color: #111827; }
    .skill .l { font-size: 11px; color: #8b6b20; text-transform: uppercase; letter-spacing: .6px; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .stat { text-align: center; padding: 12px 10px; border: 1px solid #eadfb8; background: #fffdf6; border-radius: 10px; }
    .stat .v { font-size: 26px; color: #8b6b20; }
    .stat .k { font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: #6b7280; margin-top: 4px; }

    .bottom-section {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 2px solid #bfa66a;
    }

    .digital-sig {
      width: 60%;
      margin: 0 auto 16px auto;
      text-align: center;
      padding: 14px;
      background: #fffdf6;
      border: 1px solid #eadfb8;
      border-radius: 8px;
    }
    .digital-sig-title {
      font-size: 13px;
      color: #8b6b20;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .digital-sig-company {
      font-size: 16px;
      color: #222;
      font-weight: 600;
      margin-bottom: 6px;
      font-style: italic;
    }
    .digital-sig-hash {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #6b7280;
      word-break: break-all;
      margin-top: 4px;
    }

    .footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #6b7280;
      font-size: 10px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer .ids {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .footer .ids span {
      white-space: nowrap;
    }
    .badge {
      background: #8b6b20;
      color: #fff;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 10px;
      letter-spacing: .8px;
      white-space: nowrap;
    }

    @media print {
      @page { size: A4 landscape; margin: 0; }
      body { background: #fff; padding: 0; }
      .toolbar { display: none; }
      .certificate {
        box-shadow: none;
        margin: 0;
        width: 100%;
        min-height: auto;
        height: 100vh;
        padding: 35px 45px 45px 45px;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <a href="/api/certificates/${certificate.id}/pdf" target="_blank" rel="noopener">Download PDF</a>
    <button onclick="window.print()">Print</button>
  </div>
  <div class="certificate">
    <div class="pattern"></div>
    <div class="content-wrapper">
      <div class="header">
        <div class="issuer">${certificate.employee.company.name}</div>
        <div class="title">Certificate of Achievement</div>
        <div class="subtitle">Professional Skills Certification</div>
      </div>

      <div class="recipient">
        <div class="lead">This certifies that</div>
        <div class="name">${certificate.employee.firstName} ${certificate.employee.lastName}</div>
        ${certificate.employee.title ? `<div class="role">${certificate.employee.title}</div>` : ''}
        <div class="period">For the period of ${format(new Date(certificate.periodStart), 'MMMM dd, yyyy')} to ${format(new Date(certificate.periodEnd), 'MMMM dd, yyyy')}</div>
      </div>

      ${skillsData?.skills && skillsData.skills.length > 0 ? `
        <div class="skills">
          <h3>Technical Skills Demonstrated (${skillsData.skills.length})</h3>
          <div class="skills-grid">
            ${skillsData.skills.slice(0,12).map((skill: any) => `
              <div class="skill">
                <div class="n">${skill.name}</div>
                <div class="l">${skill.level}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="stats">
        <div class="stat"><div class="v">${skillsData?.skills?.length || 0}</div><div class="k">Skills</div></div>
        <div class="stat"><div class="v">${achievements?.repositories || 0}</div><div class="k">Projects</div></div>
        <div class="stat"><div class="v">${achievements?.languages?.length || 0}</div><div class="k">Languages</div></div>
      </div>

      <div class="bottom-section">
        <div class="digital-sig">
            <div class="digital-sig-title">Digitally Signed By</div>
            <div class="digital-sig-company">${certificate.employee.company.name}</div>
            <div class="digital-sig-hash">Signature: ${certificate.digitalSignature ? certificate.digitalSignature.substring(0, 32) + '...' : certificate.hashValue ? certificate.hashValue.substring(0, 32) + '...' : certificate.id}</div>
        </div>

        <div class="footer">
          <div class="ids">
            <span>Certificate ID: ${certificate.id}</span>
            <span>Verification ID: ${certificate.verificationId}</span>
            <span>Issued ${format(new Date(certificate.issueDate), 'MMMM dd, yyyy')}</span>
          </div>
          <span class="badge">${certificate.status}</span>
        </div>
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
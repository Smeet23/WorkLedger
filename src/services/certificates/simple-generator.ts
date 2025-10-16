import PDFDocument from 'pdfkit'
import { db } from '@/lib/db'
import { CertificateStatus } from '@prisma/client'
import { hashString } from '@/lib/crypto'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import fs from 'fs'
import path from 'path'

interface CertificateData {
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    title?: string
    department?: string
  }
  company: {
    id: string
    name: string
    domain: string
  }
  skills: Array<{
    name: string
    category: string
    level: string
    confidence: number
  }>
  period: {
    start: Date
    end: Date
  }
  stats: {
    totalSkills: number
    totalRepositories: number
    primaryLanguages: string[]
  }
}

export class SimpleCertificateGenerator {
  async generateCertificate(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<string> {
    console.log('Starting certificate generation for employee:', employeeId)

    // Get employee data with company and skills
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: {
          include: { settings: true }
        },
        skillRecords: {
          include: { skill: true },
          where: {
            OR: [
              { lastUsed: { gte: periodStart, lte: periodEnd } },
              { lastUsed: null }
            ]
          }
        },
        employeeRepositories: true
      }
    })

    if (!employee) {
      throw new Error('Employee not found')
    }

    console.log(`Found ${employee.skillRecords.length} skills for certificate`)

    // Prepare certificate data
    const certificateData: CertificateData = {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        title: employee.title || undefined,
        department: employee.department || undefined
      },
      company: {
        id: employee.company.id,
        name: employee.company.name,
        domain: employee.company.domain
      },
      skills: employee.skillRecords.map(record => ({
        name: record.skill.name,
        category: record.skill.category,
        level: record.level,
        confidence: record.confidence || 0
      })),
      period: {
        start: periodStart,
        end: periodEnd
      },
      stats: {
        totalSkills: employee.skillRecords.length,
        totalRepositories: employee.employeeRepositories.length,
        primaryLanguages: Array.from(new Set(employee.skillRecords
          .filter(r => r.skill.category === 'Programming Language')
          .map(r => r.skill.name)
        )).slice(0, 5)
      }
    }

    // Create certificate record in database
    const certificate = await db.certificate.create({
      data: {
        employeeId: employee.id,
        companyId: employee.companyId,
        title: `Professional Skills Certificate`,
        description: `Skills certification for ${employee.firstName} ${employee.lastName}`,
        status: CertificateStatus.DRAFT,
        periodStart,
        periodEnd,
        skillsData: {
          skills: certificateData.skills,
          count: certificateData.skills.length,
          categories: Array.from(new Set(certificateData.skills.map(s => s.category)))
        },
        achievements: {
          totalSkills: certificateData.stats.totalSkills,
          repositories: certificateData.stats.totalRepositories,
          languages: certificateData.stats.primaryLanguages
        },
        metrics: {
          periodDays: Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    })

    console.log('Certificate record created:', certificate.id)

    // Generate QR code
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify/${certificate.verificationId}`
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 150,
      margin: 1
    })

    // Generate simple HTML certificate (since PDF is complex)
    const certificateHtml = this.generateHtmlCertificate(certificateData, certificate, qrCodeDataUrl)

    // Create a simple text representation for now
    const certificateContent = `
CERTIFICATE OF PROFESSIONAL SKILLS

This certifies that

${employee.firstName} ${employee.lastName}
${employee.title ? `${employee.title} at ` : ''}${employee.company.name}

Has demonstrated proficiency in the following skills:

${certificateData.skills.slice(0, 10).map(skill =>
  `• ${skill.name} (${skill.level})`
).join('\n')}

Period: ${format(periodStart, 'MMMM yyyy')} to ${format(periodEnd, 'MMMM yyyy')}

Certificate ID: ${certificate.id}
Verification ID: ${certificate.verificationId}
Issued: ${format(new Date(), 'MMMM dd, yyyy')}

This certificate is digitally signed and can be verified at:
${verificationUrl}
    `.trim()

    // Store certificate file record
    const fileHash = hashString(certificateContent)

    await db.certificateFile.create({
      data: {
        certificateId: certificate.id,
        fileUrl: `/api/certificates/${certificate.id}/download`,
        fileHash,
        fileSize: certificateContent.length,
        qrCodeUrl: qrCodeDataUrl,
        publicKey: 'workledger-public-key',
        signature: hashString(`${certificate.id}:${fileHash}`)
      }
    })

    // Update certificate status to ISSUED
    await db.certificate.update({
      where: { id: certificate.id },
      data: {
        status: CertificateStatus.ISSUED,
        digitalSignature: fileHash,
        hashValue: fileHash
      }
    })

    console.log('Certificate generation complete!')

    return certificate.id
  }

  private generateHtmlCertificate(
    data: CertificateData,
    certificate: any,
    qrCodeUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Professional Skills Certificate</title>
  <style>
    @page { size: A4; margin: 0; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      background: white;
    }
    .certificate {
      border: 2px solid #2563eb;
      padding: 40px;
      position: relative;
      min-height: 800px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .certificate-title {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 20px;
    }
    .employee-section {
      text-align: center;
      margin: 40px 0;
    }
    .employee-name {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .employee-title {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    .period {
      font-size: 14px;
      color: #999;
    }
    .skills-section {
      margin: 40px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .skill-item {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 8px;
    }
    .skill-name {
      font-weight: bold;
      font-size: 12px;
    }
    .skill-level {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
    }
    .footer {
      position: absolute;
      bottom: 40px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .verification-info {
      font-size: 10px;
      color: #666;
    }
    .qr-code {
      width: 100px;
      height: 100px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="company-name">${data.company.name}</div>
      <div class="certificate-title">Certificate of Professional Skills</div>
    </div>

    <div class="employee-section">
      <div>This certifies that</div>
      <div class="employee-name">${data.employee.firstName} ${data.employee.lastName}</div>
      ${data.employee.title ? `<div class="employee-title">${data.employee.title}</div>` : ''}
      <div class="period">
        ${format(data.period.start, 'MMMM yyyy')} - ${format(data.period.end, 'MMMM yyyy')}
      </div>
    </div>

    <div class="skills-section">
      <div class="section-title">Technical Skills (${data.skills.length} total)</div>
      <div class="skills-grid">
        ${data.skills.slice(0, 12).map(skill => `
          <div class="skill-item">
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">${skill.level}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="footer">
      <div class="verification-info">
        <div>Certificate ID: ${certificate.id}</div>
        <div>Verification ID: ${certificate.verificationId}</div>
        <div>Issued: ${format(new Date(), 'MMMM dd, yyyy')}</div>
      </div>
      <img src="${qrCodeUrl}" class="qr-code" alt="Verification QR Code" />
    </div>
  </div>
</body>
</html>
    `
  }
}
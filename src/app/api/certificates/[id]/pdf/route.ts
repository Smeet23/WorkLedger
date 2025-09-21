import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch certificate with all related data
    const certificate = await db.certificate.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            company: true,
            skillRecords: {
              include: {
                skill: true
              }
            }
          }
        },
        company: true
      }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check access permissions
    const isOwner = certificate.employee.email === session.user.email
    const isCompanyAdmin = session.user.role === 'company_admin' &&
      await db.employee.findFirst({
        where: {
          email: session.user.email,
          companyId: certificate.companyId
        }
      })

    if (!isOwner && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate QR code for verification
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify/${certificate.verificationId}`
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 150,
      margin: 1
    })

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      layout: 'portrait',
      margin: 50,
      info: {
        Title: 'Professional Skills Certificate',
        Author: certificate.company.name,
        Subject: `Skills Certificate for ${certificate.employee.firstName} ${certificate.employee.lastName}`,
        Creator: 'WorkLedger'
      }
    })

    // Collect PDF chunks
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    // Define colors
    const primaryColor = '#2563eb'
    const textColor = '#1f2937'
    const grayColor = '#6b7280'

    // Add decorative border
    doc.lineWidth(2)
       .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .stroke(primaryColor)

    // Company header
    doc.fontSize(24)
       .fillColor(primaryColor)
       .text(certificate.company.name, 50, 70, { align: 'center' })

    doc.fontSize(10)
       .fillColor(grayColor)
       .text('proudly presents this', 50, 110, { align: 'center' })

    // Certificate title
    doc.fontSize(32)
       .fillColor(textColor)
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF ACHIEVEMENT', 50, 140, { align: 'center' })

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(grayColor)
       .text('in Professional Skills & Technical Competencies', 50, 185, { align: 'center' })

    // Decorative line
    doc.moveTo(150, 210)
       .lineTo(doc.page.width - 150, 210)
       .stroke(primaryColor)

    // Recipient name
    doc.fontSize(10)
       .fillColor(grayColor)
       .text('This certificate is awarded to', 50, 240, { align: 'center' })

    doc.fontSize(28)
       .fillColor(textColor)
       .font('Helvetica-Bold')
       .text(`${certificate.employee.firstName} ${certificate.employee.lastName}`, 50, 260, { align: 'center' })

    if (certificate.employee.title) {
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(grayColor)
         .text(certificate.employee.title, 50, 295, { align: 'center' })
    }

    // Certificate details
    const skillsData = certificate.skillsData as any
    const achievements = certificate.achievements as any

    doc.fontSize(11)
       .fillColor(textColor)
       .text('For demonstrating proficiency in', 50, 330, { align: 'center' })

    // Skills summary box
    const boxTop = 360
    doc.rect(100, boxTop, doc.page.width - 200, 100)
       .fillAndStroke('#f3f4f6', '#e5e7eb')

    doc.fillColor(textColor)
       .fontSize(10)
       .text('Skills Certified', 120, boxTop + 15)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(skillsData?.count?.toString() || '0', 120, boxTop + 30)

    doc.fontSize(10)
       .font('Helvetica')
       .text('Projects', 250, boxTop + 15)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(achievements?.repositories?.toString() || '0', 250, boxTop + 30)

    doc.fontSize(10)
       .font('Helvetica')
       .text('Languages', 350, boxTop + 15)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(achievements?.languages?.length?.toString() || '0', 350, boxTop + 30)

    doc.fontSize(10)
       .font('Helvetica')
       .text('Categories', 450, boxTop + 15)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(skillsData?.categories?.length?.toString() || '0', 450, boxTop + 30)

    // Primary languages
    if (achievements?.languages && achievements.languages.length > 0) {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(grayColor)
         .text('Primary Languages: ' + achievements.languages.join(', '), 120, boxTop + 70, {
           width: doc.page.width - 240,
           align: 'center'
         })
    }

    // Period
    doc.fontSize(10)
       .fillColor(textColor)
       .text('Certification Period', 50, 490, { align: 'center' })

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(
         `${new Date(certificate.periodStart).toLocaleDateString()} - ${new Date(certificate.periodEnd).toLocaleDateString()}`,
         50, 510,
         { align: 'center' }
       )

    // Issue date
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(grayColor)
       .text(`Issued on ${new Date(certificate.issueDate).toLocaleDateString()}`, 50, 540, { align: 'center' })

    // QR Code and verification
    if (qrCodeBuffer) {
      doc.image(qrCodeBuffer, doc.page.width / 2 - 50, 570, { width: 100 })
    }

    doc.fontSize(8)
       .fillColor(grayColor)
       .text('Scan to verify', 50, 680, { align: 'center' })

    doc.fontSize(7)
       .text(`Verification ID: ${certificate.verificationId}`, 50, 695, { align: 'center' })

    // Footer
    doc.fontSize(8)
       .text('This certificate has been digitally signed and can be verified at', 50, 730, { align: 'center' })
    doc.fillColor(primaryColor)
       .text(verificationUrl, 50, 742, { align: 'center', link: verificationUrl })

    // End document
    doc.end()

    // Wait for PDF to be generated
    await new Promise<void>((resolve) => doc.on('end', resolve))

    // Create response with PDF
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.verificationId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF certificate' },
      { status: 500 }
    )
  }
}
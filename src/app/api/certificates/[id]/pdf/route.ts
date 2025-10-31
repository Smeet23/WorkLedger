import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle params which might be a Promise in newer Next.js versions
    const resolvedParams = params instanceof Promise ? await params : params

    // Fetch certificate with all related data
    const certificate = await db.certificate.findUnique({
      where: { id: resolvedParams.id },
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

    // Create PDF document - A4 Landscape to match HTML
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      autoFirstPage: true,
      info: {
        Title: 'Professional Skills Certificate',
        Author: certificate.company.name,
        Subject: `Skills Certificate for ${certificate.employee.firstName} ${certificate.employee.lastName}`,
        Creator: 'WorkLedger'
      }
    })
    
    // Prevent automatic page breaks
    doc.switchToPage(0)

    // Collect PDF chunks - need to handle both Buffer and Uint8Array
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.from(chunk))
    })

    // Define colors matching HTML design
    const goldColor = '#bfa66a'
    const lightGold = '#eadfb8'
    const ivoryBg = '#faf8f2'
    const textColor = '#2b2b2b'
    const grayColor = '#6b7280'
    const darkGold = '#8b6b20'
    
    // Certificate details
    const skillsData = certificate.skillsData as any
    const achievements = certificate.achievements as any
    const { format } = await import('date-fns')

    // Background color (ivory)
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill(ivoryBg)

    // Outer gold border
    doc.lineWidth(3)
       .rect(18, 18, doc.page.width - 36, doc.page.height - 36)
       .stroke(goldColor)

    // Inner dashed border
    doc.lineWidth(1)
       .dash(5, { space: 3 })
       .rect(34, 34, doc.page.width - 68, doc.page.height - 68)
       .stroke('#d7caa0')
       .undash()

    // Padding for content - more compact
    const padding = 40
    const contentWidth = doc.page.width - (padding * 2)
    const pageHeight = doc.page.height
    let yPos = 45

    // Header
    doc.fontSize(16)
       .fillColor(grayColor)
       .text(certificate.employee.company.name.toUpperCase(), padding, yPos, {
         align: 'center'
       })
    
    yPos += 28
    doc.fontSize(38)
       .fillColor(darkGold)
       .font('Helvetica-Bold')
       .text('Certificate of Achievement', padding, yPos, {
         align: 'center'
       })

    yPos += 30
    doc.fontSize(14)
       .fillColor('#4b5563')
       .font('Helvetica')
       .text('Professional Skills Certification', padding, yPos, {
         align: 'center'
       })

    yPos += 40

    // Recipient section
    doc.fontSize(12)
       .fillColor(grayColor)
       .text('This certifies that', padding, yPos, {
         align: 'center'
       })

    yPos += 20
    doc.fontSize(34)
       .fillColor(textColor)
       .font('Helvetica-Bold')
       .text(`${certificate.employee.firstName} ${certificate.employee.lastName}`, padding, yPos, {
         align: 'center'
       })

    yPos += 28
    if (certificate.employee.title) {
      doc.fontSize(14)
         .fillColor('#374151')
         .font('Helvetica')
         .text(certificate.employee.title, padding, yPos, {
           align: 'center'
         })
      yPos += 16
    }

    doc.fontSize(12)
       .fillColor(grayColor)
       .font('Helvetica-Oblique')
       .text(
         `For the period of ${format(new Date(certificate.periodStart), 'MMMM dd, yyyy')} to ${format(new Date(certificate.periodEnd), 'MMMM dd, yyyy')}`,
         padding,
         yPos,
         { align: 'center' }
       )

    yPos += 38

    // Skills section - compact
    if (skillsData?.skills && skillsData.skills.length > 0) {
      const skills = skillsData.skills.slice(0, 12)
      const skillsTop = yPos
      const skillsBoxHeight = Math.ceil(skills.length / 4) * 28 + 50
      
      // Skills box background
      doc.rect(padding + 14, skillsTop, contentWidth - 28, skillsBoxHeight)
         .fillAndStroke('#ffffff', '#e5e7eb')
         .lineWidth(1)

      yPos += 16
      doc.fontSize(14)
         .fillColor('#374151')
         .font('Helvetica-Bold')
         .text(`Technical Skills Demonstrated (${skillsData.skills.length})`, padding + 20, yPos)

      yPos += 24
      
      // Skills grid - 4 columns, compact
      const cols = 4
      const skillWidth = (contentWidth - 40) / cols
      const skillHeight = 26
      
      skills.forEach((skill: any, index: number) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = padding + 20 + (col * skillWidth) + 4
        const y = yPos + (row * skillHeight)

        // Skill box
        doc.rect(x, y, skillWidth - 8, 24)
           .fillAndStroke('#fcfcfc', '#e5e7eb')
           .lineWidth(1)

        // Skill name
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica')
           .text(skill.name || 'N/A', x + 6, y + 4, {
             width: skillWidth - 20,
             ellipsis: true
           })

        // Skill level
        doc.fontSize(9)
           .fillColor(darkGold)
           .font('Helvetica-Bold')
           .text((skill.level || '').toUpperCase(), x + 6, y + 14, {
             width: skillWidth - 20,
             ellipsis: true
           })
      })

      yPos += (Math.ceil(skills.length / cols) * skillHeight) + 16
    }

    // Stats section - compact
    const statsTop = yPos
    const statWidth = (contentWidth - 28) / 3
    const statHeight = 55

    // Stat boxes
    for (let i = 0; i < 3; i++) {
      const x = padding + 14 + (i * statWidth)
      doc.rect(x, statsTop, statWidth - 10, statHeight)
         .fillAndStroke('#fffdf6', lightGold)
         .lineWidth(1)

      let label = ''
      let value = ''
      
      if (i === 0) {
        label = 'SKILLS'
        value = (skillsData?.skills?.length || 0).toString()
      } else if (i === 1) {
        label = 'PROJECTS'
        value = (achievements?.repositories || 0).toString()
      } else {
        label = 'LANGUAGES'
        value = (achievements?.languages?.length || 0).toString()
      }

      // Value
      doc.fontSize(24)
         .fillColor(darkGold)
         .font('Helvetica-Bold')
         .text(value, x, statsTop + 12, {
           width: statWidth - 10,
           align: 'center'
         })

      // Label
      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica-Bold')
         .text(label, x, statsTop + 40, {
           width: statWidth - 10,
           align: 'center'
         })
    }

    yPos = statsTop + statHeight + 24

    // Bottom section with border
    const borderY = yPos
    doc.lineWidth(2)
       .moveTo(padding, borderY)
       .lineTo(doc.page.width - padding, borderY)
       .stroke(goldColor)

    yPos += 22

    // Digital signature - compact
    const sigWidth = contentWidth * 0.55
    const sigX = (doc.page.width - sigWidth) / 2
    
    doc.rect(sigX, yPos, sigWidth, 58)
       .fillAndStroke('#fffdf6', lightGold)
       .lineWidth(1)

    yPos += 14
    doc.fontSize(11)
       .fillColor(darkGold)
       .font('Helvetica-Bold')
       .text('DIGITALLY SIGNED BY', sigX, yPos, {
         width: sigWidth,
         align: 'center'
       })

    yPos += 14
    doc.fontSize(14)
       .fillColor(textColor)
       .font('Helvetica-Bold')
       .text(certificate.employee.company.name, sigX, yPos, {
         width: sigWidth,
         align: 'center'
       })

    yPos += 12
    const sigHash = certificate.digitalSignature 
      ? certificate.digitalSignature.substring(0, 28) + '...'
      : certificate.hashValue 
      ? certificate.hashValue.substring(0, 28) + '...'
      : certificate.id.substring(0, 28) + '...'

    doc.fontSize(9)
       .fillColor(grayColor)
       .font('Courier')
       .text(`Signature: ${sigHash}`, sigX, yPos, {
         width: sigWidth,
         align: 'center'
       })

    yPos += 40

    // Footer - ensure it fits
    if (yPos > pageHeight - 40) {
      yPos = pageHeight - 40
    }
    
    doc.fontSize(9)
       .fillColor(grayColor)
       .font('Helvetica')
       .moveTo(padding, yPos)
       .lineTo(doc.page.width - padding, yPos)
       .stroke('#e5e7eb')
       .lineWidth(1)

    yPos += 14
    const footerText = `Certificate ID: ${certificate.id}  Verification ID: ${certificate.verificationId}  Issued ${format(new Date(certificate.issueDate), 'MMMM dd, yyyy')}`
    doc.fontSize(9)
       .fillColor(grayColor)
       .text(footerText, padding, yPos, {
         width: contentWidth - 80,
         align: 'left'
       })

    // Status badge on right
    doc.rect(doc.page.width - padding - 55, yPos - 4, 48, 18)
       .fill(darkGold)
    
    doc.fontSize(9)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(certificate.status, doc.page.width - padding - 55, yPos, {
         width: 48,
         align: 'center'
       })

    // Wait for PDF to be generated before ending
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(chunks)
          resolve(pdfBuffer)
        } catch (error) {
          reject(error)
        }
      })
      doc.on('error', reject)
    })

    // End document
    doc.end()

    // Wait for PDF buffer to be ready
    const pdfBuffer = await pdfPromise

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.verificationId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Failed to generate PDF:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF certificate',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
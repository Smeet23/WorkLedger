import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { SimpleCertificateGenerator } from '@/services/certificates/simple-generator'
import { db } from '@/lib/db'
import { subMonths } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { periodMonths = 3, title, description } = body

    // Get employee record
    const employee = await db.employee.findFirst({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if employee has skills
    const skillCount = await db.skillRecord.count({
      where: { employeeId: employee.id }
    })

    if (skillCount === 0) {
      return NextResponse.json(
        { error: 'No skills tracked. Please sync your GitHub account first.' },
        { status: 400 }
      )
    }

    // Calculate period
    const periodEnd = new Date()
    const periodStart = subMonths(periodEnd, periodMonths)

    console.log(`Generating certificate for ${employee.firstName} ${employee.lastName}`)
    console.log(`Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`)

    // Generate certificate
    const generator = new SimpleCertificateGenerator()
    const certificateId = await generator.generateCertificate(
      employee.id,
      periodStart,
      periodEnd
    )

    // Update certificate with custom title/description if provided
    if (title || description) {
      await db.certificate.update({
        where: { id: certificateId },
        data: {
          ...(title && { title }),
          ...(description && { description })
        }
      })
    }

    // Get the generated certificate
    const certificate = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        certificateFile: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate!.id,
        verificationId: certificate!.verificationId,
        title: certificate!.title,
        status: certificate!.status,
        issueDate: certificate!.issueDate,
        fileUrl: certificate!.certificateFile?.fileUrl,
        qrCodeUrl: certificate!.certificateFile?.qrCodeUrl
      }
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate certificate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
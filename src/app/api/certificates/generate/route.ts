import { SimpleCertificateGenerator } from '@/services/certificates/simple-generator'
import { db } from '@/lib/db'
import { subMonths } from 'date-fns'
import { generateCertificateRequestSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { withAuth } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

export const POST = withAuth(async (request, { employee }) => {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateCertificateRequestSchema.parse(body)
    const { periodMonths, title, description } = validatedData

    // Get full employee record with company
    const employeeWithCompany = await db.employee.findUnique({
      where: { id: employee.id },
      include: { company: true }
    })

    if (!employeeWithCompany) {
      return apiResponse.notFound('Employee', employee.id)
    }

    // Check if employee has skills
    const skillCount = await db.skillRecord.count({
      where: { employeeId: employee.id }
    })

    if (skillCount === 0) {
      return apiResponse.badRequest('No skills tracked. Please sync your GitHub account first.')
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

    return apiResponse.success({
      certificate: {
        id: certificate!.id,
        verificationId: certificate!.verificationId,
        title: certificate!.title,
        status: certificate!.status,
        issueDate: certificate!.issueDate,
        fileUrl: certificate!.certificateFile?.fileUrl,
        qrCodeUrl: certificate!.certificateFile?.qrCodeUrl
      }
    }, 'Certificate generated successfully')
  } catch (error) {
    console.error('Certificate generation error:', error)

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return apiResponse.validation(
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    return apiResponse.internalError(
      error instanceof Error ? error.message : 'Failed to generate certificate'
    )
  }
})
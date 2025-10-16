import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

const updateSettingsSchema = z.object({
  companyId: z.string(),
  shareSkills: z.boolean(),
  shareAchievements: z.boolean(),
  shareProjectTypes: z.boolean(),
  shareTraining: z.boolean(),
  shareTenure: z.boolean(),
  companyBranding: z.boolean(),
  autoIssueEnabled: z.boolean(),
  minTrackingDays: z.number().min(1).max(365),
  // Company profile fields
  name: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional()
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in')
    }

    if (session.user.role !== 'company_admin') {
      return apiResponse.forbidden('Only company administrators can update settings')
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Verify the company belongs to the user
    const employee = await db.employee.findFirst({
      where: {
        email: session.user.email,
        companyId: validatedData.companyId
      }
    })

    if (!employee) {
      return apiResponse.forbidden('You do not have permission to update this company')
    }

    // Update company profile if provided
    if (validatedData.name || validatedData.website || validatedData.industry || validatedData.size) {
      await db.company.update({
        where: { id: validatedData.companyId },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.website !== undefined && { website: validatedData.website || null }),
          ...(validatedData.industry !== undefined && { industry: validatedData.industry || null }),
          ...(validatedData.size !== undefined && { size: validatedData.size || null })
        }
      })
    }

    // Update or create settings
    const settings = await db.companySettings.upsert({
      where: {
        companyId: validatedData.companyId
      },
      update: {
        shareSkills: validatedData.shareSkills,
        shareAchievements: validatedData.shareAchievements,
        shareProjectTypes: validatedData.shareProjectTypes,
        shareTraining: validatedData.shareTraining,
        shareTenure: validatedData.shareTenure,
        companyBranding: validatedData.companyBranding,
        autoIssueEnabled: validatedData.autoIssueEnabled,
        minTrackingDays: validatedData.minTrackingDays
      },
      create: {
        companyId: validatedData.companyId,
        shareSkills: validatedData.shareSkills,
        shareAchievements: validatedData.shareAchievements,
        shareProjectTypes: validatedData.shareProjectTypes,
        shareTraining: validatedData.shareTraining,
        shareTenure: validatedData.shareTenure,
        companyBranding: validatedData.companyBranding,
        autoIssueEnabled: validatedData.autoIssueEnabled,
        minTrackingDays: validatedData.minTrackingDays
      }
    })

    return apiResponse.success(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors)
    }

    console.error('Settings update error:', error)
    return apiResponse.error('Failed to update settings')
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in')
    }

    // Get company for the user
    const employee = await db.employee.findFirst({
      where: {
        email: session.user.email
      },
      include: {
        company: {
          include: {
            settings: true
          }
        }
      }
    })

    if (!employee?.company) {
      return apiResponse.notFound('Company not found')
    }

    return apiResponse.success(employee.company.settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return apiResponse.error('Failed to fetch settings')
  }
}

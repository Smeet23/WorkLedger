import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

const updateSettingsSchema = z.object({
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

export const PUT = withCompanyAdmin(async (request, { companyId }) => {
  try {
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Update company profile if provided
    if (validatedData.name || validatedData.website || validatedData.industry || validatedData.size) {
      await db.company.update({
        where: { id: companyId },
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
      where: { companyId },
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
        companyId,
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

    return apiResponse.success(settings, 'Settings updated successfully')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.validation(
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    console.error('Settings update error:', error)
    return apiResponse.internalError('Failed to update settings')
  }
})

export const GET = withAuth(async (request, { companyId }) => {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { settings: true }
    })

    if (!company) {
      return apiResponse.notFound('Company')
    }

    return apiResponse.success(company.settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return apiResponse.internalError('Failed to fetch settings')
  }
})

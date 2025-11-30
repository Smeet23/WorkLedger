import { db } from '@/lib/db'
import { withCompanyAdmin } from '@/lib/api-auth'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const apiResponse = createApiResponse()

export const GET = withCompanyAdmin(async (request, { companyId }) => {
  try {
    const invitations = await db.invitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    })

    return apiResponse.success({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        role: inv.role,
        title: inv.title,
        department: inv.department,
        status: inv.status,
        invitedBy: inv.invitedBy,
        invitedAt: inv.createdAt,
        expiresAt: inv.expiresAt
      })),
      total: invitations.length,
      pending: invitations.filter(i => i.status === 'pending').length,
      accepted: invitations.filter(i => i.status === 'accepted').length,
      expired: invitations.filter(i => i.status === 'expired').length
    })
  } catch (error) {
    console.error('Failed to fetch invitations:', error)
    return apiResponse.internalError('Failed to fetch invitations')
  }
})

import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { SettingsForm } from "./settings-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

async function getCompanySettings(companyId: string) {
  const settings = await db.companySettings.findUnique({
    where: { companyId },
    include: {
      company: true
    }
  })

  // If no settings exist, create default settings
  if (!settings) {
    return await db.companySettings.create({
      data: {
        companyId,
        shareSkills: true,
        shareAchievements: true,
        shareProjectTypes: true,
        shareTraining: true,
        shareTenure: true,
        companyBranding: false,
        autoIssueEnabled: false,
        minTrackingDays: 30
      },
      include: {
        company: true
      }
    })
  }

  return settings
}

export default async function CompanySettingsPage() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo
  const settings = await getCompanySettings(company.id)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
              <p className="text-slate-600 mt-1">Manage your company preferences and configurations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <SettingsForm settings={settings} company={company} />
      </div>
    </div>
  )
}

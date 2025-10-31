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
    <div className="container mx-auto p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-3">
        <h1 className="text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
          Company Settings
        </h1>
        <p className="text-lg text-slate-600">Manage your company preferences and configurations</p>
      </div>

      <div className="max-w-5xl mx-auto mt-6">
        <SettingsForm settings={settings} company={company} />
      </div>
    </div>
  )
}

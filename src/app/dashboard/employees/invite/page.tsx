import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { InviteEmployeeForm } from "@/components/forms/invite-employee-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function InviteEmployeePage() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invite New Employee</h1>
            <p className="mt-2 text-gray-600">
              Add a new team member to {company.name} and start tracking their professional development
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>
                Fill in the details below to send an invitation to your new team member.
                They'll receive an email with instructions to create their account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteEmployeeForm companyDomain={company.domain} />
            </CardContent>
          </Card>
      </div>
  )
}
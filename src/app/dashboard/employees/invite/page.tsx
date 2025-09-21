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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-3xl font-bold text-gray-900 hover:text-blue-600">
                WorkLedger
              </Link>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Invite Employee
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.firstName} {session.user.lastName}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/employees">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Employees
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
      </main>
    </div>
  )
}
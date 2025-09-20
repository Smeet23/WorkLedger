import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function CompanyDashboard() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company, employee } = userInfo

  // Fetch actual stats
  const [employeeCount, certificateCount, skillCount, pendingInvitations] = await Promise.all([
    db.employee.count({
      where: {
        companyId: company.id,
        isActive: true
      }
    }),
    db.certificate.count({
      where: {
        companyId: company.id
      }
    }),
    db.skillRecord.count({
      where: {
        employee: {
          companyId: company.id
        }
      }
    }),
    db.invitation.count({
      where: {
        companyId: company.id,
        status: "pending"
      }
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">WorkLedger</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Company Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.firstName} {session.user.lastName}
              </span>
              <Button variant="outline" size="sm">
                <Link href="/api/auth/signout">Sign Out</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Company Overview */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {company.name}
                  <span className="text-sm font-normal text-gray-500">
                    {company.domain}
                  </span>
                </CardTitle>
                <CardDescription>
                  Company dashboard - Track your team's skill development and issue certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{employeeCount}</div>
                    <div className="text-sm text-gray-600">Active Employees</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{certificateCount}</div>
                    <div className="text-sm text-gray-600">Certificates Issued</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{skillCount}</div>
                    <div className="text-sm text-gray-600">Skills Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">👥 Employee Management</CardTitle>
                <CardDescription>
                  Add, view, and manage your team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/employees">
                    Manage Employees
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔗 GitHub Integration</CardTitle>
                <CardDescription>
                  Connect GitHub for automatic skill tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Setup GitHub
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Analytics</CardTitle>
                <CardDescription>
                  View team performance and skill insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏆 Certificates</CardTitle>
                <CardDescription>
                  Generate and manage skill certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Certificates
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Settings</CardTitle>
                <CardDescription>
                  Configure privacy controls and branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Company Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Getting Started</CardTitle>
                <CardDescription>
                  Follow our setup guide for best results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Setup Guide
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>No activity yet</p>
                <p className="text-sm">Start by adding team members or connecting GitHub</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
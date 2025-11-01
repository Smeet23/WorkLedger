import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Award,
  TrendingUp,
  Activity,
  Eye,
  Zap,
  ArrowRight,
  UserPlus,
  GitBranch,
  BarChart3
} from "lucide-react"
import Link from "next/link"

// Cache for 30 seconds with ISR
export const revalidate = 30

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

  // Calculate average skills per employee
  const avgSkillsPerEmployee = employeeCount > 0 ? (skillCount / employeeCount).toFixed(1) : "0"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header - Clean & Professional */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              {session.user.firstName} {session.user.lastName}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {company.name}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Employees Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{employeeCount}</div>
            <div className="text-sm text-gray-600 mb-2">Active Employees</div>
            <div className="text-xs text-gray-500">Team members</div>
          </div>

          {/* Certificates Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{certificateCount}</div>
            <div className="text-sm text-gray-600 mb-2">Certificates Issued</div>
            <div className="text-xs text-gray-500">Total achievements</div>
          </div>

          {/* Skills Tracked Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{skillCount}</div>
            <div className="text-sm text-gray-600 mb-2">Skills Tracked</div>
            <div className="text-xs text-gray-500">Across all employees</div>
          </div>

          {/* Avg Skills Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{avgSkillsPerEmployee}</div>
            <div className="text-sm text-gray-600 mb-2">Avg Skills/Employee</div>
            <div className="text-xs text-gray-500">Company average</div>
          </div>
        </div>

        {/* Command Center Alert */}
        {employeeCount > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Team Command Center Available</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get real-time insights into your team's productivity and performance across all platforms.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <Eye className="w-4 h-4 text-gray-700" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Live Activity Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <Zap className="w-4 h-4 text-gray-700" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Performance Metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <Users className="w-4 h-4 text-gray-700" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Team Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button asChild>
                <Link href="/dashboard/manager">
                  Open Command Center
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Team Management */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-700" />
                  </div>
                  {pendingInvitations > 0 && (
                    <Badge variant="secondary">{pendingInvitations} pending</Badge>
                  )}
                </div>
                <CardTitle className="text-base">Team Management</CardTitle>
                <CardDescription>Add, view, and manage your team members</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/employees">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Manage Team
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* GitHub Integration */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <GitBranch className="w-5 h-5 text-gray-700" />
                </div>
                <CardTitle className="text-base">GitHub Integration</CardTitle>
                <CardDescription>Connect and sync with GitHub repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/integrations/github">
                    Configure Integration
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                </div>
                <CardTitle className="text-base">Analytics Dashboard</CardTitle>
                <CardDescription>View team performance and skill insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/analytics">
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest updates from your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Start by adding team members or connecting GitHub to see activity here"
              variant="compact"
              action={{
                label: "Invite Team Members",
                href: "/dashboard/employees/invite"
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

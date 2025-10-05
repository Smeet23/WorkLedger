import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { StatCard } from "@/components/ui/stat-card"
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
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              Dashboard Overview
            </span>
          </div>
          <h1 className="text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
            Welcome back, {session.user.firstName}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Here's what's happening with {company.name} today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Employees"
            value={employeeCount}
            icon={Users}
            description="Team members"
            trend={{ value: 12, label: "vs last month" }}
            variant="gradient"
            color="blue"
            className="animate-slide-up"
          />

          <StatCard
            title="Certificates Issued"
            value={certificateCount}
            icon={Award}
            description="Total achievements"
            trend={{ value: 8, direction: "up" }}
            variant="gradient"
            color="green"
            className="animate-slide-up"
            style={{ animationDelay: "50ms" }}
          />

          <StatCard
            title="Skills Tracked"
            value={skillCount}
            icon={TrendingUp}
            description="Across all employees"
            variant="gradient"
            color="purple"
            className="animate-slide-up"
            style={{ animationDelay: "100ms" }}
          />

          <StatCard
            title="Avg Skills/Employee"
            value={avgSkillsPerEmployee}
            icon={BarChart3}
            description="Company average"
            trend={{ value: 5, direction: "up", label: "Growing" }}
            variant="gradient"
            color="orange"
            className="animate-slide-up"
            style={{ animationDelay: "150ms" }}
          />
        </div>

        {/* Command Center Alert */}
        {employeeCount > 0 && (
          <div className="group relative animate-slide-up">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Alert className="relative border-blue-200/50 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 backdrop-blur-sm shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <AlertTitle className="text-xl font-bold text-slate-900 mt-1">Team Command Center Available</AlertTitle>
              <AlertDescription className="mt-3">
                <p className="mb-5 text-slate-600 leading-relaxed">
                  Get real-time insights into your team's productivity and performance across all platforms.
                </p>
                <div className="flex flex-wrap items-center gap-5 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Live Activity Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                      <Zap className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Performance Metrics</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Team Analytics</span>
                  </div>
                </div>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-0">
                  <Link href="/dashboard/manager">
                    Open Command Center
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                      <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    {pendingInvitations > 0 && (
                      <Badge variant="warning-soft" size="sm" className="shadow-sm">
                        {pendingInvitations} pending
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4 font-bold text-slate-900">Team Management</CardTitle>
                  <CardDescription className="text-slate-600">
                    Add, view, and manage your team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm">
                    <Link href="/dashboard/employees">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 hover:border-cyan-200 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-200/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/20">
                    <GitBranch className="w-7 h-7 text-cyan-600" />
                  </div>
                  <CardTitle className="text-lg mt-4 font-bold text-slate-900">GitHub Integration</CardTitle>
                  <CardDescription className="text-slate-600">
                    Connect and sync with GitHub repositories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                    <Link href="/dashboard/integrations/github">
                      Configure Integration
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                    <BarChart3 className="w-7 h-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg mt-4 font-bold text-slate-900">Analytics Dashboard</CardTitle>
                  <CardDescription className="text-slate-600">
                    View team performance and skill insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                    <Link href="/company">
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-400/20 to-slate-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 hover:border-slate-200 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/50 transition-all duration-300 group-hover:scale-110">
                    <Award className="w-7 h-7 text-slate-500" />
                  </div>
                  <CardTitle className="text-lg mt-4 font-bold text-slate-900">Certificates</CardTitle>
                  <CardDescription className="text-slate-600">
                    Generate and manage skill certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-600">
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

import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Upload, Download, Filter, TrendingUp, Award } from "lucide-react"
import Link from "next/link"
import { EmployeeListClient } from "@/components/employees/employee-list-client"

// Cache for 30 seconds with ISR
export const revalidate = 30

export default async function EmployeeManagement() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo

  // Fetch ALL employees and invitations for client-side pagination
  const [employees, invitations] = await Promise.all([
    db.employee.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      include: {
        skillRecords: {
          include: {
            skill: true
          }
        },
        certificates: true
      }
    }),
    db.invitation.findMany({
      where: {
        companyId: company.id,
        status: "pending"
      },
      orderBy: { createdAt: "desc" }
    })
  ])

  const activeEmployees = employees.filter(emp => emp.isActive)
  const inactiveEmployees = employees.filter(emp => !emp.isActive)

  const totalSkills = employees.reduce((acc, emp) => acc + emp.skillRecords.length, 0);
  const totalCertificates = employees.reduce((acc, emp) => acc + emp.certificates.length, 0);
  const avgSkillsPerEmployee = employees.length > 0 ? (totalSkills / employees.length).toFixed(1) : "0";

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">

          {/* Page Header */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                    Team Overview
                  </span>
                </div>
                <h1 className="text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight">Team Management</h1>
                <p className="mt-2 text-lg text-slate-600 leading-relaxed">
                  Manage your team members, track their skills, and organize departments
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" asChild className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <Link href="/dashboard/employees/import">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-0">
                  <Link href="/dashboard/employees/invite">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Employee
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Total Employees</p>
                      <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/50">
                      <div className="h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="h-3 w-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Active</p>
                      <p className="text-3xl font-bold text-emerald-600">{activeEmployees.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-200/50">
                      <TrendingUp className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Avg Skills/Employee</p>
                      <p className="text-3xl font-bold text-cyan-600">{avgSkillsPerEmployee}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Certificates</p>
                      <p className="text-3xl font-bold text-amber-600">{totalCertificates}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                <Filter className="w-4 h-4 mr-2" />
                All Employees
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Active ({activeEmployees.length})
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Inactive ({inactiveEmployees.length})
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Employee and Invitation Lists with Client-Side Pagination */}
          <EmployeeListClient
            invitations={invitations}
            employees={employees}
          />
      </div>
  )
}
import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, UserPlus, Upload, Download, Filter, Clock, Mail, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { CopyInvitationLink } from "@/components/ui/copy-invitation-link"

async function getCompanyEmployees(companyId: string) {
  return await db.employee.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      skillRecords: {
        include: {
          skill: true
        }
      },
      certificates: true
    }
  })
}

async function getPendingInvitations(companyId: string) {
  return await db.invitation.findMany({
    where: {
      companyId,
      status: "pending"
    },
    orderBy: { createdAt: "desc" }
  })
}

function getRoleColor(role: string) {
  switch (role) {
    case "DEVELOPER": return "bg-blue-100 text-blue-800"
    case "DESIGNER": return "bg-purple-100 text-purple-800"
    case "MANAGER": return "bg-green-100 text-green-800"
    case "SALES": return "bg-orange-100 text-orange-800"
    case "MARKETING": return "bg-pink-100 text-pink-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default async function EmployeeManagement() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo
  const employees = await getCompanyEmployees(company.id)
  const invitations = await getPendingInvitations(company.id)
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

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="group relative mb-6">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              <Card className="relative border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Pending Invitations ({invitations.length})
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Employees who have not accepted their invitation yet
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="group/item relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-xl blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                        <div className="relative border border-amber-200/60 rounded-xl p-4 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center border border-amber-200/50">
                                <Mail className="h-6 w-6 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">
                                  {invitation.firstName} {invitation.lastName}
                                </h4>
                                <p className="text-sm text-slate-600">{invitation.email}</p>
                                <div className="flex items-center space-x-2 mt-1.5">
                                  <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                    {invitation.role}
                                  </Badge>
                                  {invitation.title && (
                                    <span className="text-xs text-slate-500">• {invitation.title}</span>
                                  )}
                                  <span className="text-xs text-slate-500">
                                    • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CopyInvitationLink token={invitation.token} />
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Employee List */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Team Members</CardTitle>
                    <CardDescription className="text-slate-600">
                      Manage your team members and track their professional development
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200/50 mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No employees yet</h3>
                    <p className="mt-2 text-slate-600 max-w-sm mx-auto">
                      Get started by inviting your first team member.
                    </p>
                    <div className="mt-6">
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-0">
                        <Link href="/dashboard/employees/invite">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Employee
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="grid gap-4">
                      {employees.map((employee) => (
                        <div key={employee.id} className="group/emp relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover/emp:opacity-100 transition-opacity duration-300" />
                          <div className="relative border border-slate-200/60 rounded-xl p-5 bg-white/80 backdrop-blur-sm hover:bg-white transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center border border-blue-200/50 group-hover/emp:scale-110 transition-transform duration-300">
                                  <span className="text-blue-600 font-bold text-lg">
                                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900">
                                    {employee.firstName} {employee.lastName}
                                  </h3>
                                  <p className="text-sm text-slate-600">{employee.email}</p>
                                  <div className="flex items-center space-x-2 mt-1.5">
                                    <Badge className={getRoleColor(employee.role)}>
                                      {employee.role}
                                    </Badge>
                                    {employee.title && (
                                      <span className="text-sm text-slate-600">• {employee.title}</span>
                                    )}
                                    {employee.department && (
                                      <span className="text-sm text-slate-600">• {employee.department}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-6">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">{employee.skillRecords.length}</p>
                                  <p className="text-xs text-slate-500 font-medium">Skills</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-emerald-600">{employee.certificates.length}</p>
                                  <p className="text-xs text-slate-500 font-medium">Certificates</p>
                                </div>
                                <div className="text-center">
                                  <Badge variant={employee.isActive ? "default" : "secondary"} className={employee.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                                    {employee.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <Button variant="outline" size="sm" asChild className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                  <Link href={`/dashboard/employees/${employee.id}`}>
                                    View Profile
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            {employee.skillRecords.length > 0 && (
                              <div className="mt-5 pt-5 border-t border-slate-200/60">
                                <p className="text-sm font-semibold text-slate-700 mb-3">Recent Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                  {employee.skillRecords.slice(0, 5).map((record) => (
                                    <Badge key={record.id} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50/50">
                                      {record.skill.name}
                                    </Badge>
                                  ))}
                                  {employee.skillRecords.length > 5 && (
                                    <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                                      +{employee.skillRecords.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
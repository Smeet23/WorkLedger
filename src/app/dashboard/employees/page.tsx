import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, UserPlus, Upload, Download, Filter, Clock, Mail } from "lucide-react"
import Link from "next/link"
import { CopyInvitationLink } from "@/components/ui/copy-invitation-link"

async function getCompanyEmployees(companyId: string) {
  return await db.employee.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
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
    orderBy: { createdAt: 'desc' }
  })
}

function getRoleColor(role: string) {
  switch (role) {
    case 'DEVELOPER': return 'bg-blue-100 text-blue-800'
    case 'DESIGNER': return 'bg-purple-100 text-purple-800'
    case 'MANAGER': return 'bg-green-100 text-green-800'
    case 'SALES': return 'bg-orange-100 text-orange-800'
    case 'MARKETING': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
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

  // Calculate stats
  const totalSkills = employees.reduce((acc, emp) => acc + emp.skillRecords.length, 0)
  const totalCertificates = employees.reduce((acc, emp) => acc + emp.certificates.length, 0)
  const avgSkillsPerEmployee = employees.length > 0 ? (totalSkills / employees.length).toFixed(1) : '0'

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
                Employee Management
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.firstName} {session.user.lastName}
              </span>
              <Button variant="outline" size="sm">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="mt-2 text-gray-600">
                  Manage your team members, track their skills, and organize departments
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/employees/import">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Link>
                </Button>
                <Button asChild>
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeEmployees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">S</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Skills/Employee</p>
                    <p className="text-2xl font-bold text-purple-600">{avgSkillsPerEmployee}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">C</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Certificates</p>
                    <p className="text-2xl font-bold text-orange-600">{totalCertificates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                All Employees
              </Button>
              <Button variant="ghost" size="sm">
                Active ({activeEmployees.length})
              </Button>
              <Button variant="ghost" size="sm">
                Inactive ({inactiveEmployees.length})
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Pending Invitations ({invitations.length})
                    </CardTitle>
                    <CardDescription>
                      Employees who haven't accepted their invitation yet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {invitation.firstName} {invitation.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{invitation.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {invitation.role}
                              </Badge>
                              {invitation.title && (
                                <span className="text-xs text-gray-500">• {invitation.title}</span>
                              )}
                              <span className="text-xs text-gray-500">
                                • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CopyInvitationLink token={invitation.token} />
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and track their professional development
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No employees yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by inviting your first team member.
                  </p>
                  <div className="mt-6">
                    <Button asChild>
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
                      <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-lg">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className="text-sm text-gray-500">{employee.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getRoleColor(employee.role)}>
                                  {employee.role}
                                </Badge>
                                {employee.title && (
                                  <span className="text-sm text-gray-600">• {employee.title}</span>
                                )}
                                {employee.department && (
                                  <span className="text-sm text-gray-600">• {employee.department}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{employee.skillRecords.length}</p>
                              <p className="text-xs text-gray-500">Skills</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{employee.certificates.length}</p>
                              <p className="text-xs text-gray-500">Certificates</p>
                            </div>
                            <div className="text-center">
                              <Badge variant={employee.isActive ? "default" : "secondary"}>
                                {employee.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/employees/${employee.id}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {employee.skillRecords.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Recent Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {employee.skillRecords.slice(0, 5).map((record) => (
                                <Badge key={record.id} variant="outline" className="text-xs">
                                  {record.skill.name}
                                </Badge>
                              ))}
                              {employee.skillRecords.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{employee.skillRecords.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
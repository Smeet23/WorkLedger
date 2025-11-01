import { requireAuth } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  Users,
  UserPlus,
  Award,
  TrendingUp,
  Settings,
  Building,
  ShieldCheck,
  BarChart,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  Calendar,
  Target
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CompanyDashboard() {
  const session = await requireAuth()

  // Check if user is a company admin
  if (session.user.role !== 'company_admin') {
    redirect('/employee')
  }

  // Get user data
  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Get employee record with company
  const userEmployee = await db.employee.findFirst({
    where: { email: user.email },
    include: { company: true }
  })

  if (!userEmployee?.company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Company Not Found</CardTitle>
            <CardDescription>
              Your company account is not properly configured. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const company = userEmployee.company

  // Get company statistics (optimized queries)
  const [
    employeeCount,
    certificateCount,
    skillCount,
    invitationCount,
    activeEmployees,
    recentCertificates,
    repositories
  ] = await Promise.all([
    db.employee.count({ where: { companyId: company.id } }),
    db.certificate.count({
      where: { companyId: company.id }
    }),
    db.skillRecord.count({
      where: { employee: { companyId: company.id } }
    }),
    db.invitation.count({
      where: { companyId: company.id, status: 'pending' }
    }),
    db.employee.findMany({
      where: { companyId: company.id, isActive: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            skillRecords: true,
            certificates: true
          }
        }
      }
    }),
    db.certificate.findMany({
      where: { companyId: company.id },
      take: 5,
      orderBy: { issueDate: 'desc' },
      select: {
        id: true,
        title: true,
        issueDate: true,
        verificationId: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    db.repository.findMany({
      where: { companyId: company.id },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        fullName: true,
        description: true,
        language: true,
        updatedAt: true,
        employeeRepositories: {
          take: 1,
          orderBy: {
            commitCount: 'desc'
          },
          select: {
            commitCount: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            commits: true
          }
        }
      }
    })
  ])

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
      {/* Page intro to match dashboard */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
            {company.name} Dashboard
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Manage your team's skills and certifications
          </p>
        </div>
        <Badge variant="outline" className="h-9 items-center hidden sm:inline-flex">
          <Building className="w-4 h-4 mr-2" />
          Company Admin
        </Badge>
      </div>

      <main className="space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{employeeCount}</div>
              {invitationCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">{invitationCount} pending invites</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Certificates Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{certificateCount}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Skills Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{skillCount}</div>
              <p className="text-xs text-gray-500 mt-1">Across all employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Avg Skills/Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {employeeCount > 0 ? Math.round(skillCount / employeeCount) : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Company average</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Team Management
              </CardTitle>
              <CardDescription>
                Invite and manage employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/employees">
                <Button className="w-full">
                  Manage Team
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Skills Analytics
              </CardTitle>
              <CardDescription>
                View team skill distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/company/skills">
                <Button variant="outline" className="w-full">
                  View Skills Matrix
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificates
              </CardTitle>
              <CardDescription>
                Manage certificate templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Company preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Employees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Employees
              </CardTitle>
              <CardDescription>
                Newest team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeEmployees.length > 0 ? (
                <div className="space-y-3">
                  {activeEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{employee._count.skillRecords} skills</p>
                        <p className="text-xs text-gray-500">{employee._count.certificates} certificates</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No employees yet</p>
                  <Link href="/company/team">
                    <Button className="mt-3">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite First Employee
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Recent Certificates
              </CardTitle>
              <CardDescription>
                Latest achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentCertificates.length > 0 ? (
                <div className="space-y-3">
                  {recentCertificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{cert.title}</p>
                        <p className="text-xs text-gray-500">
                          {cert.employee.firstName} {cert.employee.lastName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No certificates issued yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Repositories Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Team Repositories
            </CardTitle>
            <CardDescription>
              View detailed contribution analytics for each repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            {repositories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repositories.map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/company/repos/${repo.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {repo.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {repo.fullName}
                          </p>
                        </div>
                        <Badge variant={repo.isPrivate ? "secondary" : "outline"} className="text-xs ml-2">
                          {repo.isPrivate ? "Private" : "Public"}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {repo.description || 'No description'}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <GitCommitHorizontal className="w-3 h-3" />
                            {repo._count.commits} commits
                          </span>
                          {repo.primaryLanguage && (
                            <Badge variant="outline" className="text-xs">
                              {repo.primaryLanguage}
                            </Badge>
                          )}
                        </div>
                        {repo.employeeRepositories[0] && (
                          <p className="text-xs text-gray-500">
                            by {repo.employeeRepositories[0].employee.firstName} {repo.employeeRepositories[0].employee.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No repositories synced yet</p>
                <p className="text-xs mt-1">Employees need to connect their GitHub accounts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
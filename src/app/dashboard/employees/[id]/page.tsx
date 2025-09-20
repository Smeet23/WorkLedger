import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Calendar, Building, Briefcase, Star, Award, Github, Edit } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface EmployeeProfilePageProps {
  params: {
    id: string
  }
}

async function getEmployeeDetails(employeeId: string, companyId: string) {
  return await db.employee.findFirst({
    where: {
      id: employeeId,
      companyId: companyId
    },
    include: {
      company: true,
      skillRecords: {
        include: {
          skill: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      },
      certificates: {
        orderBy: {
          issueDate: 'desc'
        }
      },
      activities: {
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10
      }
    }
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

function getSkillLevelColor(level: string) {
  switch (level) {
    case 'BEGINNER': return 'bg-red-100 text-red-800'
    case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800'
    case 'ADVANCED': return 'bg-blue-100 text-blue-800'
    case 'EXPERT': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo
  const employee = await getEmployeeDetails(params.id, company.id)

  if (!employee) {
    notFound()
  }

  // Calculate stats
  const totalSkills = employee.skillRecords.length
  const advancedSkills = employee.skillRecords.filter(r => r.level === 'ADVANCED' || r.level === 'EXPERT').length
  const totalCertificates = employee.certificates.length
  const daysSinceJoining = Math.floor((new Date().getTime() - employee.startDate.getTime()) / (1000 * 60 * 60 * 24))

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
                Employee Profile
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Employee Header */}
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-2xl">
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </h1>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{employee.email}</span>
                        </div>
                        <Badge className={getRoleColor(employee.role)}>
                          {employee.role}
                        </Badge>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                        {employee.title && (
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            <span>{employee.title}</span>
                          </div>
                        )}
                        {employee.department && (
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            <span>{employee.department}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Joined {format(employee.startDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button>
                      Generate Certificate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Skills</p>
                    <p className="text-2xl font-bold text-blue-600">{totalSkills}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Advanced Skills</p>
                    <p className="text-2xl font-bold text-green-600">{advancedSkills}</p>
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Days at Company</p>
                    <p className="text-2xl font-bold text-purple-600">{daysSinceJoining}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Skills & Activities */}
            <div className="lg:col-span-2 space-y-8">

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                  <CardDescription>
                    Tracked skills and proficiency levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.skillRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No skills tracked yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Skills will appear here as they're detected through integrations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Group skills by category */}
                      {Object.entries(
                        employee.skillRecords.reduce((acc, record) => {
                          const category = record.skill.category || 'Other'
                          if (!acc[category]) acc[category] = []
                          acc[category].push(record)
                          return acc
                        }, {} as Record<string, typeof employee.skillRecords>)
                      ).map(([category, skills]) => (
                        <div key={category}>
                          <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {skills.map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{record.skill.name}</p>
                                  {record.lastUsed && (
                                    <p className="text-sm text-gray-500">
                                      Last used {format(record.lastUsed, 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                                <Badge className={getSkillLevelColor(record.level)}>
                                  {record.level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest tracked activities and contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Github className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No activity tracked yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Activity will appear here when integrations are connected.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employee.activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Github className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{activity.repoName}</p>
                              <p className="text-sm text-gray-500">
                                {activity.commits} commits • {activity.linesAdded} lines added
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(activity.updatedAt, 'MMM d')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Certificates & Integration */}
            <div className="space-y-8">

              {/* Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificates</CardTitle>
                  <CardDescription>
                    Issued skill certificates and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.certificates.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Certificates will appear as they're generated.
                      </p>
                      <div className="mt-4">
                        <Button size="sm">
                          Generate Certificate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employee.certificates.map((certificate) => (
                        <div key={certificate.id} className="p-4 border rounded-lg">
                          <h4 className="font-medium text-gray-900">{certificate.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{certificate.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant={certificate.status === 'ISSUED' ? 'default' : 'secondary'}>
                              {certificate.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(certificate.issueDate, 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Integration Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>
                    Connected accounts and data sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Github className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">GitHub</p>
                          <p className="text-sm text-gray-500">
                            {employee.githubUsername ? `@${employee.githubUsername}` : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={employee.githubUsername ? 'default' : 'secondary'}>
                        {employee.githubUsername ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-5 w-5 bg-blue-500 rounded mr-3"></div>
                        <div>
                          <p className="font-medium text-gray-900">Salesforce</p>
                          <p className="text-sm text-gray-500">
                            {employee.salesforceId ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={employee.salesforceId ? 'default' : 'secondary'}>
                        {employee.salesforceId ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
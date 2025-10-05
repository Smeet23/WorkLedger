import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Calendar, Building, Briefcase, Star, Award, Github, Edit, Activity, Zap } from "lucide-react"
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
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">

          {/* Employee Header */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-lg" />
                        <div className="relative h-24 w-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center border-2 border-blue-200/50">
                          <span className="text-blue-600 font-bold text-3xl">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h1 className="text-[2.5rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
                          {employee.firstName} {employee.lastName}
                        </h1>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <Mail className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-slate-700 font-medium">{employee.email}</span>
                          </div>
                          <Badge className={getRoleColor(employee.role)}>
                            {employee.role}
                          </Badge>
                          <Badge variant={employee.isActive ? "default" : "secondary"} className={employee.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                            {employee.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600">
                          {employee.title && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{employee.title}</span>
                            </div>
                          )}
                          {employee.department && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-cyan-500" />
                              <span className="font-medium">{employee.department}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Joined {format(employee.startDate, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" className="border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-0">
                        Generate Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Total Skills</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{totalSkills}</p>
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Award className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Advanced Skills</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{advancedSkills}</p>
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 group-hover:scale-110 transition-transform duration-300">
                      <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Certificates</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{totalCertificates}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Days at Company</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{daysSinceJoining}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Skills & Activities */}
            <div className="lg:col-span-2 space-y-8">

              {/* Skills */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                        <Star className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Skills & Expertise</CardTitle>
                        <CardDescription className="text-slate-600">
                          Tracked skills and proficiency levels
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {employee.skillRecords.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 mx-auto mb-4">
                          <Star className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No skills tracked yet</h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          Skills will appear here as they're detected through integrations.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
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
                            <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {skills.map((record) => (
                                <div key={record.id} className="group/skill relative">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur opacity-0 group-hover/skill:opacity-100 transition-opacity duration-300" />
                                  <div className="relative flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                                    <div>
                                      <p className="font-semibold text-slate-900">{record.skill.name}</p>
                                      {record.lastUsed && (
                                        <p className="text-xs text-slate-500 mt-1 font-medium">
                                          Last used {format(record.lastUsed, 'MMM d, yyyy')}
                                        </p>
                                      )}
                                    </div>
                                    <Badge className={getSkillLevelColor(record.level)}>
                                      {record.level}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-200/50">
                        <Activity className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
                        <CardDescription className="text-slate-600">
                          Latest tracked activities and contributions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {employee.activities.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 mx-auto mb-4">
                          <Github className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No activity tracked yet</h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          Activity will appear here when integrations are connected.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employee.activities.map((activity) => (
                          <div key={activity.id} className="group/activity relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover/activity:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50">
                                  <Github className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{activity.repoName}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                    {activity.commits} commits • {activity.linesAdded} lines added
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 font-semibold">
                                {format(activity.updatedAt, 'MMM d')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Certificates & Integration */}
            <div className="space-y-8">

              {/* Certificates */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Certificates</CardTitle>
                        <CardDescription className="text-slate-600">
                          Issued skill certificates and achievements
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {employee.certificates.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 mx-auto mb-4">
                          <Award className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No certificates yet</h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed mb-5">
                          Certificates will appear as they're generated.
                        </p>
                        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30">
                          Generate Certificate
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employee.certificates.map((certificate) => (
                          <div key={certificate.id} className="group/cert relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl blur opacity-0 group-hover/cert:opacity-100 transition-opacity duration-300" />
                            <div className="relative p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                              <h4 className="font-semibold text-slate-900">{certificate.title}</h4>
                              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{certificate.description}</p>
                              <div className="flex items-center justify-between mt-3">
                                <Badge variant={certificate.status === 'ISSUED' ? 'default' : 'secondary'}>
                                  {certificate.status}
                                </Badge>
                                <span className="text-xs text-slate-500 font-semibold">
                                  {format(certificate.issueDate, 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Integration Status */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Integrations</CardTitle>
                        <CardDescription className="text-slate-600">
                          Connected accounts and data sources
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="group/int relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/10 to-slate-600/10 rounded-xl blur opacity-0 group-hover/int:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50">
                              <Github className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">GitHub</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {employee.githubUsername ? `@${employee.githubUsername}` : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={employee.githubUsername ? 'default' : 'secondary'}>
                            {employee.githubUsername ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </div>
                      </div>

                      <div className="group/int relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl blur opacity-0 group-hover/int:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200/50">
                              <div className="h-4 w-4 bg-blue-500 rounded"></div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Salesforce</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {employee.salesforceId ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={employee.salesforceId ? 'default' : 'secondary'}>
                            {employee.salesforceId ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
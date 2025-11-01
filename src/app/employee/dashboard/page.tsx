import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { db } from "@/lib/db"
import {
  Trophy,
  Code,
  GitBranch,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  GitCommitHorizontal,
  Calendar,
  TrendingUp,
  Target,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { format, formatDistance } from 'date-fns'

export default async function EmployeePortal() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    return (
      <div className="min-h-screen gradient-bg-subtle flex items-center justify-center p-4">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-error">No Company Found</CardTitle>
            <CardDescription>
              You're not associated with any company yet. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { company, employee } = userInfo

  if (!employee) {
    return (
      <div className="min-h-screen gradient-bg-subtle flex items-center justify-center p-4">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-error">Employee Profile Not Found</CardTitle>
            <CardDescription>
              Your employee profile has not been created yet. Please contact your company administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch real data for the employee
  const [skillRecords, certificates, employeeRepos, totalCommitCount] = await Promise.all([
    db.skillRecord.findMany({
      where: { employeeId: employee.id },
      include: { skill: true },
      orderBy: { updatedAt: 'desc' }
    }),
    db.certificate.findMany({
      where: { employeeId: employee.id },
      orderBy: { issueDate: 'desc' }
    }),
    db.employeeRepository.findMany({
      where: { employeeId: employee.id },
      include: {
        repository: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            _count: {
              select: { commits: true }
            }
          }
        }
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 10
    }),
    db.commit.count({
      where: {
        authorEmail: employee.email
      }
    })
  ])

  // Extract repositories from employeeRepos
  const repositories = employeeRepos.map(er => er.repository)

  const skillCount = skillRecords.length
  const certificateCount = certificates.length
  const repositoryCount = repositories.length
  const daysAtCompany = employee?.startDate
    ? Math.floor((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Get skill level distribution
  const skillLevels = skillRecords.reduce((acc, record) => {
    acc[record.level] = (acc[record.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header - Clean & Professional */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Welcome back</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {company.name} · {daysAtCompany} days
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{skillCount}</div>
                <div className="text-xs text-gray-500">Skills</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">{certificateCount}</div>
                <div className="text-xs text-gray-500">Certificates</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">{totalCommitCount}</div>
                <div className="text-xs text-gray-500">Commits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Skill Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Code className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{skillCount}</div>
            <div className="text-sm text-gray-600 mb-2">Skills Tracked</div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              {skillLevels.EXPERT > 0 ? `${skillLevels.EXPERT} Expert` : 'Keep learning'}
            </div>
          </div>

          {/* Certificates Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{certificateCount}</div>
            <div className="text-sm text-gray-600 mb-2">Certificates Earned</div>
            <div className="text-xs text-gray-500">
              Professional achievements
            </div>
          </div>

          {/* Commits Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <GitCommitHorizontal className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{totalCommitCount}</div>
            <div className="text-sm text-gray-600 mb-2">Total Commits</div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Target className="w-3 h-3" />
              {repositoryCount} repositories
            </div>
          </div>

          {/* Days at Company Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{daysAtCompany}</div>
            <div className="text-sm text-gray-600 mb-2">Days at Company</div>
            <div className="text-xs text-gray-500">
              Your journey continues
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Generate Certificate */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-gray-700" />
                </div>
                <CardTitle className="text-base">Generate Certificate</CardTitle>
                <CardDescription>Create a new professional certificate</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/employee/certificates/generate">
                    Create Certificate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* My Certificates */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gray-700" />
                  </div>
                  {certificateCount > 0 && (
                    <Badge variant="secondary">{certificateCount}</Badge>
                  )}
                </div>
                <CardTitle className="text-base">My Certificates</CardTitle>
                <CardDescription>View and download your certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/employee/certificates">
                    View Certificates
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Repositories */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <GitBranch className="w-5 h-5 text-gray-700" />
                </div>
                <CardTitle className="text-base">Repositories ({repositoryCount})</CardTitle>
                <CardDescription>Browse your repos and commits</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/employee/repositories">
                    View Repositories
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-gray-700" />
                </div>
                <CardTitle className="text-base">Skill Progress</CardTitle>
                <CardDescription>See your development over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/employee/skills">
                    View Progress
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skills and Repositories Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Skills Section */}
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Code className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-base">Your Skills</CardTitle>
                  <CardDescription className="text-sm">
                    {skillCount > 0 ? `${skillCount} skills tracked` : 'No skills tracked yet'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {skillRecords.length > 0 ? (
                <div className="space-y-2">
                  {skillRecords.slice(0, 8).map((record, index) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center">
                          <Code className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{record.skill.name}</p>
                          <p className="text-xs text-gray-500">{record.skill.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {record.level}
                        </Badge>
                        {record.confidence && (
                          <span className="text-xs text-gray-600">
                            {Math.round(record.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {skillRecords.length > 8 && (
                    <div className="text-center pt-3">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/employee/skills">
                          View all {skillRecords.length} skills
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Code className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No skills tracked yet</h3>
                  <p className="text-sm text-gray-600">Your manager will sync skills from your work</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repositories Section */}
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-base">Recent Repositories</CardTitle>
                  <CardDescription className="text-sm">
                    {repositories.length > 0
                      ? `${totalCommitCount} commits across ${repositoryCount} repos`
                      : 'No repositories synced yet'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {repositories.length > 0 ? (
                <div className="space-y-2">
                  {repositories.slice(0, 5).map((repo) => (
                    <div key={repo.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <GitBranch className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            <p className="font-medium text-gray-900 text-sm truncate">{repo.name}</p>
                            {repo.isPrivate && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{repo.description}</p>
                          )}
                          {repo.primaryLanguage && (
                            <Badge variant="secondary" className="text-xs">{repo.primaryLanguage}</Badge>
                          )}
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Star className="w-3 h-3" />
                            {repo.stars}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {repo._count.commits}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {repositories.length > 5 && (
                    <div className="text-center pt-3">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/employee/repositories">
                          View all {repositories.length} repositories
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <GitBranch className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No repositories yet</h3>
                  <p className="text-sm text-gray-600">Your manager will sync repositories from your organization</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Certificates */}
        {certificates.length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Recent Certificates</CardTitle>
                    <CardDescription>Your newest achievements</CardDescription>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/employee/certificates">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {certificates.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Award className="w-5 h-5 text-gray-600" />
                      </div>
                      <Badge variant={cert.status === 'ISSUED' ? 'default' : 'secondary'} className="text-xs">
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 mb-1 text-sm">{cert.title}</p>
                    <p className="text-xs text-gray-500">
                      Issued: {format(new Date(cert.issueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

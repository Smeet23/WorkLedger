import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitHubIntegrationWrapper } from "@/components/github/github-integration-wrapper"
import Link from "next/link"
import { db } from "@/lib/db"
import { Trophy, Code, GitBranch, Star, Award, Download, GitCommitHorizontal, Activity } from 'lucide-react'
import { format, formatDistance } from 'date-fns'

export default async function EmployeePortal() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">No Company Found</CardTitle>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Employee Profile Not Found</CardTitle>
            <CardDescription>
              Your employee profile has not been created yet. Please contact your company administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch real data for the employee
  const [skillRecords, certificates, repositories, totalRepositoryCount, totalCommitCount, githubConnection] = await Promise.all([
    db.skillRecord.findMany({
      where: { employeeId: employee.id },
      include: { skill: true },
      orderBy: { updatedAt: 'desc' }
    }),
    db.certificate.findMany({
      where: { employeeId: employee.id },
      orderBy: { issueDate: 'desc' }
    }),
    db.repository.findMany({
      where: { employeeId: employee.id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { commits: true }
        }
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 10 // Show more repos in recent activity
    }),
    // Get total repository count
    db.repository.count({
      where: { employeeId: employee.id }
    }),
    // Get total commit count
    db.commit.count({
      where: {
        repository: { employeeId: employee.id }
      }
    }),
    db.gitHubConnection.findUnique({
      where: { employeeId: employee.id }
    })
  ])

  const skillCount = skillRecords.length
  const certificateCount = certificates.length
  const repositoryCount = totalRepositoryCount
  const daysAtCompany = employee?.startDate ?
    Math.floor((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Calculate total commits and PRs
  const totalActivity = {
    commits: totalCommitCount,
    prs: repositories.reduce((acc, repo) => {
      const activity = repo.activities[0]
      return acc + (activity?.pullRequests || 0)
    }, 0)
  }

  // Get skill level distribution
  const skillLevels = skillRecords.reduce((acc, record) => {
    acc[record.level] = (acc[record.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">WorkLedger</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                Employee Portal
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

          {/* Welcome Section with Real Stats */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  Welcome to {company.name}
                </CardTitle>
                <CardDescription>
                  Track your professional growth and view your skill certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{skillCount}</div>
                    <div className="text-sm text-gray-600">Skills Tracked</div>
                    {skillLevels.EXPERT > 0 && (
                      <div className="text-xs text-blue-500 mt-1">{skillLevels.EXPERT} Expert</div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{certificateCount}</div>
                    <div className="text-sm text-gray-600">Certificates Earned</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{totalActivity.commits}</div>
                    <div className="text-sm text-gray-600">Total Commits</div>
                    {repositoryCount > 0 && (
                      <div className="text-xs text-purple-500 mt-1">
                        {repositoryCount} repos • {Math.round(totalActivity.commits / repositoryCount)} avg
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{daysAtCompany}</div>
                    <div className="text-sm text-gray-600">Days at Company</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Certificate Generation Card */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Generate Certificate
                </CardTitle>
                <CardDescription>
                  Create a new professional certificate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/certificates/generate">
                  <Button className="w-full">
                    Generate New Certificate
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* My Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  My Certificates ({certificateCount})
                </CardTitle>
                <CardDescription>
                  View and download your certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/certificates">
                  <Button variant="outline" className="w-full">
                    View All Certificates
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <GitHubIntegrationWrapper />

            {/* My Repositories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  My Repositories ({repositoryCount})
                </CardTitle>
                <CardDescription>
                  Browse your repositories and commits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/repositories">
                  <Button variant="outline" className="w-full">
                    View Repositories
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Skill Progress</CardTitle>
                <CardDescription>
                  See your skill development over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/skills">
                  <Button variant="outline" className="w-full">
                    View Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">👤 Profile</CardTitle>
                <CardDescription>
                  Update your information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/profile/edit">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Public Profile</CardTitle>
                <CardDescription>
                  Share your achievements with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee/public-profile">
                  <Button variant="outline" className="w-full">
                    View Public Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
                <CardDescription>
                  {skillCount > 0 ? `${skillCount} skills detected from your GitHub activity` : 'No skills tracked yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillRecords.length > 0 ? (
                  <div className="space-y-3">
                    {skillRecords.slice(0, 8).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Code className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">{record.skill.name}</p>
                            <p className="text-xs text-gray-500">{record.skill.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            record.level === 'EXPERT' ? 'default' :
                            record.level === 'ADVANCED' ? 'secondary' :
                            'outline'
                          }>
                            {record.level}
                          </Badge>
                          {record.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(record.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {skillRecords.length > 8 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        +{skillRecords.length - 8} more skills
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🚀</div>
                    <p>No skills tracked yet</p>
                    <p className="text-sm">Connect your GitHub to start tracking</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repositories Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Repositories</CardTitle>
                <CardDescription>
                  {repositories.length > 0 ? `${totalCommitCount} commits across ${repositoryCount} repositories` : 'No repositories synced yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {repositories.length > 0 ? (
                  <div className="space-y-3">
                    {repositories.map((repo) => {
                      return (
                        <div key={repo.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-gray-500" />
                                <p className="font-medium text-sm truncate">{repo.name}</p>
                                {repo.isPrivate && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                                {repo.isFork && (
                                  <Badge variant="secondary" className="text-xs">Fork</Badge>
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{repo.description}</p>
                              )}
                              {repo.primaryLanguage && (
                                <p className="text-xs text-blue-600 mt-1">{repo.primaryLanguage}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Star className="w-3 h-3" />
                                {repo.stars}
                              </div>
                              <p className="text-xs text-purple-600 mt-1 font-bold">
                                <GitCommitHorizontal className="inline w-3 h-3 mr-1" />
                                {repo._count.commits} commits
                              </p>
                              {repo.pushedAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistance(new Date(repo.pushedAt), new Date(), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {githubConnection && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          Last synced: {format(new Date(githubConnection.lastSync || githubConnection.connectedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📁</div>
                    <p>No repositories yet</p>
                    <p className="text-sm">Connect GitHub and sync your repos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Certificates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Certificates</CardTitle>
                <CardDescription>
                  Your newest achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {certificates.length > 0 ? (
                  <div className="space-y-3">
                    {certificates.slice(0, 3).map((cert) => (
                      <div key={cert.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{cert.title}</p>
                            <p className="text-xs text-gray-500">
                              Issued: {format(new Date(cert.issueDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={cert.status === 'ISSUED' ? 'default' : 'secondary'}>
                              {cert.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <p>No certificates yet</p>
                    <p className="text-sm">Generate your first certificate above!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
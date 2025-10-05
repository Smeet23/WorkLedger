import { requireAuth, getUserWithCompany } from "@/lib/session"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { db } from "@/lib/db"
import {
  Trophy,
  Code,
  GitBranch,
  Star,
  Award,
  Github,
  AlertCircle,
  CheckCircle,
  GitCommitHorizontal,
  Calendar,
  TrendingUp
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
  const [skillRecords, certificates, repositories, totalCommitCount, githubConnection] = await Promise.all([
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
      take: 10
    }),
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
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* GitHub Connection Alert */}
        {!githubConnection && (
          <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent animate-slide-up">
            <Github className="h-5 w-5 text-primary" />
            <AlertTitle className="text-lg font-semibold">Connect Your GitHub Account</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4 text-muted-foreground">
                Unlock automatic skill tracking by connecting your GitHub account. WorkLedger will analyze your contributions to generate verified skill certificates.
              </p>
              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Automatic skill detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Track all contributions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Generate certificates</span>
                </div>
              </div>
              <Button
                asChild
                className="bg-gray-900 hover:bg-gray-800 shadow-sm interactive"
              >
                <Link href="/api/github/connect">
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub Now
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* GitHub Connected Status */}
        {githubConnection && githubConnection.isActive && (
          <Alert className="border-success/20 bg-success-light animate-slide-up">
            <CheckCircle className="h-5 w-5 text-success" />
            <AlertTitle className="text-lg font-semibold">GitHub Connected</AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Connected as <span className="font-mono font-semibold">@{githubConnection.githubUsername}</span>
                  </p>
                  {githubConnection.lastSync && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last synced: {formatDistance(new Date(githubConnection.lastSync), new Date(), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link href="/dashboard/integrations/github">
                    Manage Connection
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to {company.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your professional growth and view your skill certificates
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Skills Tracked"
            value={skillCount}
            icon={Code}
            description={skillLevels.EXPERT > 0 ? `${skillLevels.EXPERT} Expert Level` : 'Keep learning'}
            trend={{ value: 15, label: "Growing" }}
            variant="gradient"
            color="blue"
            className="animate-slide-up"
          />

          <StatCard
            title="Certificates Earned"
            value={certificateCount}
            icon={Award}
            description="Professional achievements"
            variant="gradient"
            color="green"
            className="animate-slide-up"
            style={{ animationDelay: "50ms" }}
          />

          <StatCard
            title="Total Commits"
            value={totalCommitCount}
            icon={GitCommitHorizontal}
            description={repositoryCount > 0 ? `${repositoryCount} repositories` : 'Connect GitHub'}
            trend={{ value: 22, direction: "up" }}
            variant="gradient"
            color="purple"
            className="animate-slide-up"
            style={{ animationDelay: "100ms" }}
          />

          <StatCard
            title="Days at Company"
            value={daysAtCompany}
            icon={Calendar}
            description="Your journey"
            variant="gradient"
            color="orange"
            className="animate-slide-up"
            style={{ animationDelay: "150ms" }}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover group border-2 border-primary/20">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Trophy className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mt-4">Generate Certificate</CardTitle>
                <CardDescription>Create a new professional certificate</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full shadow-sm interactive">
                  <Link href="/employee/certificates/generate">
                    Generate New Certificate
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 transition-transform group-hover:scale-110">
                    <Award className="w-6 h-6" />
                  </div>
                  {certificateCount > 0 && (
                    <Badge variant="success-soft" size="sm">{certificateCount}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-4">My Certificates</CardTitle>
                <CardDescription>View and download your certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full interactive">
                  <Link href="/employee/certificates">
                    View All Certificates
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {githubConnection ? (
              <Card className="card-hover group border-success/20 bg-success-light/30">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-white transition-transform group-hover:scale-110">
                    <Github className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg mt-4">GitHub Connected</CardTitle>
                  <CardDescription>Syncing {repositoryCount} repositories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Commits:</span>
                      <span className="font-semibold">{totalCommitCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Skills Detected:</span>
                      <span className="font-semibold">{skillCount}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full interactive" asChild>
                    <Link href="/dashboard/integrations/github">
                      Manage GitHub
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-hover group border-warning/20 bg-warning-light/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning transition-transform group-hover:scale-110">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-4">GitHub Not Connected</CardTitle>
                  <CardDescription>Connect to track your contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full bg-gray-900 hover:bg-gray-800 interactive"
                  >
                    <Link href="/api/github/connect">
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="card-hover group">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110">
                  <GitBranch className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mt-4">My Repositories ({repositoryCount})</CardTitle>
                <CardDescription>Browse your repositories and commits</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full interactive">
                  <Link href="/employee/repositories">
                    View Repositories
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover group">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-110">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mt-4">Skill Progress</CardTitle>
                <CardDescription>See your skill development over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full interactive">
                  <Link href="/employee/skills">
                    View Progress
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skills and Repositories Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skills Section */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Your Skills
              </CardTitle>
              <CardDescription>
                {skillCount > 0 ? `${skillCount} skills detected from your GitHub activity` : 'No skills tracked yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skillRecords.length > 0 ? (
                <div className="space-y-3">
                  {skillRecords.slice(0, 8).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <Code className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{record.skill.name}</p>
                          <p className="text-xs text-muted-foreground">{record.skill.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            record.level === 'EXPERT' ? 'success' :
                            record.level === 'ADVANCED' ? 'default' :
                            'outline'
                          }
                          size="sm"
                        >
                          {record.level}
                        </Badge>
                        {record.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(record.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {skillRecords.length > 8 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{skillRecords.length - 8} more skills
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Code}
                  title="No skills tracked yet"
                  description="Connect your GitHub to start tracking"
                  variant="compact"
                />
              )}
            </CardContent>
          </Card>

          {/* Repositories Section */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Recent Repositories
              </CardTitle>
              <CardDescription>
                {repositories.length > 0
                  ? `${totalCommitCount} commits across ${repositoryCount} repositories`
                  : 'No repositories synced yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repositories.length > 0 ? (
                <div className="space-y-3">
                  {repositories.slice(0, 5).map((repo) => (
                    <div key={repo.id} className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-sm truncate">{repo.name}</p>
                            {repo.isPrivate && (
                              <Badge variant="outline" size="sm">Private</Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground truncate-2 mb-1">{repo.description}</p>
                          )}
                          {repo.primaryLanguage && (
                            <Badge variant="info-soft" size="sm">{repo.primaryLanguage}</Badge>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3" />
                            {repo.stars}
                          </div>
                          <p className="text-xs text-primary font-semibold mt-1">
                            {repo._count.commits} commits
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={GitBranch}
                  title="No repositories yet"
                  description="Connect GitHub and sync your repos"
                  variant="compact"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Certificates */}
        {certificates.length > 0 && (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Recent Certificates
              </CardTitle>
              <CardDescription>Your newest achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {certificates.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-5 h-5 text-primary" />
                      <Badge variant={cert.status === 'ISSUED' ? 'success' : 'secondary'} size="sm">
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm mb-1">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {format(new Date(cert.issueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  )
}

import { requireAuth } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/db"
import { redirect } from 'next/navigation'
import Link from "next/link"
import {
  GitCommitHorizontal,
  Users,
  Calendar,
  GitBranch,
  Code,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  ExternalLink,
  GitPullRequest,
  Activity
} from 'lucide-react'

interface PageProps {
  params: { repoId: string }
}

export default async function RepositoryContributions({ params }: PageProps) {
  const session = await requireAuth()

  // Check if user is a company admin or manager
  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect('/login')
  }

  // Get employee record
  const userEmployee = await db.employee.findFirst({
    where: { email: user.email },
    include: { company: true }
  })

  const isCompanyAdmin = user.role === 'company_admin'
  const isManager = userEmployee?.role === 'MANAGER'

  if (!isCompanyAdmin && !isManager) {
    redirect('/employee')
  }

  // Get repository with detailed information
  const repository = await db.repository.findUnique({
    where: { id: params.repoId },
    include: {
      company: true,
      employeeRepositories: {
        include: {
          employee: true
        }
      },
      commits: {
        orderBy: { authorDate: 'desc' }
      }
    }
  })

  if (!repository) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Repository Not Found</CardTitle>
            <CardDescription>
              The requested repository could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check access permissions
  const canAccess = isCompanyAdmin && userEmployee?.company?.id === repository.companyId ||
                    isManager && userEmployee?.companyId === repository.companyId

  if (!canAccess) {
    redirect('/company')
  }

  // Get the primary owner/contributor
  const primaryOwner = repository.employeeRepositories.find(er => er.isOwner) ||
                       repository.employeeRepositories[0]

  // Calculate contributor statistics
  const contributorMap = new Map<string, {
    name: string
    email: string
    commits: number
    additions: number
    deletions: number
    filesChanged: number
    firstCommit: Date
    lastCommit: Date
  }>()

  repository.commits.forEach(commit => {
    const key = commit.authorEmail
    const existing = contributorMap.get(key)
    
    if (existing) {
      existing.commits++
      existing.additions += commit.additions
      existing.deletions += commit.deletions
      existing.filesChanged += commit.filesChanged
      if (commit.authorDate < existing.firstCommit) {
        existing.firstCommit = commit.authorDate
      }
      if (commit.authorDate > existing.lastCommit) {
        existing.lastCommit = commit.authorDate
      }
    } else {
      contributorMap.set(key, {
        name: commit.authorName,
        email: commit.authorEmail,
        commits: 1,
        additions: commit.additions,
        deletions: commit.deletions,
        filesChanged: commit.filesChanged,
        firstCommit: commit.authorDate,
        lastCommit: commit.authorDate
      })
    }
  })

  const contributors = Array.from(contributorMap.values())
    .sort((a, b) => b.commits - a.commits)

  const totalCommits = repository.commits.length
  const totalAdditions = repository.commits.reduce((sum, c) => sum + c.additions, 0)
  const totalDeletions = repository.commits.reduce((sum, c) => sum + c.deletions, 0)
  const totalFilesChanged = repository.commits.reduce((sum, c) => sum + c.filesChanged, 0)

  // Calculate activity over last 12 months
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const monthlyActivity = new Map<string, number>()
  repository.commits
    .filter(c => c.authorDate >= twelveMonthsAgo)
    .forEach(commit => {
      const monthKey = `${commit.authorDate.getFullYear()}-${String(commit.authorDate.getMonth() + 1).padStart(2, '0')}`
      monthlyActivity.set(monthKey, (monthlyActivity.get(monthKey) || 0) + 1)
    })

  const activityData = Array.from(monthlyActivity.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }))

  const maxActivity = Math.max(...activityData.map(d => d.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link href="/company" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{repository.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {repository.description || 'No description available'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant={repository.isPrivate ? "secondary" : "default"}>
                    {repository.isPrivate ? "Private" : "Public"}
                  </Badge>
                  {primaryOwner && (
                    <span className="text-sm text-gray-500">
                      Owner: {primaryOwner.employee.firstName} {primaryOwner.employee.lastName}
                    </span>
                  )}
                  <a
                    href={`https://github.com/${repository.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View on GitHub
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Repository Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Commits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 flex items-center">
                <GitCommitHorizontal className="w-5 h-5 mr-2" />
                {totalCommits}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {contributors.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Additions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                {totalAdditions.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Deletions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2" />
                {totalDeletions.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Files Changed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {totalFilesChanged.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contributors Breakdown */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contributors Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed contribution metrics for each contributor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contributors.map((contributor, index) => {
                    const contributionPercentage = (contributor.commits / totalCommits) * 100
                    const isTopContributor = index === 0
                    
                    return (
                      <div key={contributor.email} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{contributor.name}</h3>
                              {isTopContributor && (
                                <Badge className="text-xs" variant="default">
                                  Top Contributor
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{contributor.email}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{contributor.commits}</div>
                            <div className="text-xs text-gray-500">commits</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Contribution</span>
                            <span>{contributionPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={contributionPercentage} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Additions</span>
                            <p className="font-medium text-green-600">+{contributor.additions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Deletions</span>
                            <p className="font-medium text-red-600">-{contributor.deletions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Files</span>
                            <p className="font-medium">{contributor.filesChanged.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                          <span>First: {new Date(contributor.firstCommit).toLocaleDateString()}</span>
                          <span>Last: {new Date(contributor.lastCommit).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity and Languages */}
          <div className="space-y-6">
            {/* Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monthly Activity
                </CardTitle>
                <CardDescription>
                  Commit activity over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityData.length > 0 ? (
                  <div className="space-y-2">
                    {activityData.map(({ month, count }) => {
                      const [year, monthNum] = month.split('-')
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })
                      
                      return (
                        <div key={month} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">{monthName}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${(count / maxActivity) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </CardContent>
            </Card>

            {/* Languages & Frameworks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Technologies
                </CardTitle>
                <CardDescription>
                  Languages and frameworks used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {repository.primaryLanguage && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Primary Language</p>
                      <Badge variant="outline" className="text-sm">
                        {repository.primaryLanguage}
                      </Badge>
                    </div>
                  )}
                  
                  {repository.languages && Array.isArray(repository.languages) && repository.languages.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">All Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {(repository.languages as string[]).map((lang) => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {repository.frameworks && Array.isArray(repository.frameworks) && repository.frameworks.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Frameworks</p>
                      <div className="flex flex-wrap gap-1">
                        {(repository.frameworks as string[]).map((framework) => (
                          <Badge key={framework} variant="outline" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Repository Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Repository Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stars</span>
                    <span className="font-medium">{repository.stars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Forks</span>
                    <span className="font-medium">{repository.forks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Open Issues</span>
                    <span className="font-medium">{repository.openIssues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium">
                      {new Date(repository.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium">
                      {new Date(repository.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Commits */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Commits
            </CardTitle>
            <CardDescription>
              Latest 10 commits to this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repository.commits.slice(0, 10).map((commit) => (
                <div key={commit.sha} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {commit.message.split('\n')[0]}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {commit.authorName} on {new Date(commit.authorDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs ml-4">
                    <span className="text-green-600">+{commit.additions}</span>
                    <span className="text-red-600">-{commit.deletions}</span>
                    <Badge variant="outline" className="text-xs">
                      {commit.sha.substring(0, 7)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import Link from "next/link"
import { GitBranch, Star, GitFork, Code, Calendar, Eye, Github, Sparkles, ArrowRight, Zap, Target } from 'lucide-react'
import { formatDistance } from 'date-fns'

export default async function RepositoriesPage() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md rounded-3xl shadow-xl border-2">
          <CardHeader>
            <CardTitle className="text-red-600">No Employee Record Found</CardTitle>
            <CardDescription>
              Please contact your administrator to set up your employee profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch all repositories with commit counts
  const employeeRepos = await db.employeeRepository.findMany({
    where: { employeeId: userInfo.employee.id },
    include: {
      repository: {
        include: {
          _count: {
            select: { commits: true }
          }
        }
      }
    },
    orderBy: {
      repository: {
        pushedAt: 'desc'
      }
    }
  })

  // Extract repositories from employeeRepos
  const repositories = employeeRepos.map(er => er.repository)

  // Get GitHub connection status
  const githubConnection = await db.gitHubConnection.findUnique({
    where: { employeeId: userInfo.employee.id }
  })

  // Get total commit count from database
  const totalCommits = await db.commit.count({
    where: {
      authorEmail: userInfo.employee.email
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              My Repositories
            </h1>
            <p className="text-sm text-gray-600">
              {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'} • {totalCommits} total commits
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {repositories.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">{repositories.length}</div>
                <div className="text-sm text-gray-600">Repositories</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Code className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">{totalCommits}</div>
                <div className="text-sm text-gray-600">Total Commits</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {repositories.reduce((sum, repo) => sum + (repo.stars || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Stars</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <GitFork className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {repositories.reduce((sum, repo) => sum + (repo.forks || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Forks</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {repositories.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <GitBranch className="w-8 h-8 text-gray-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No Repositories Found
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your GitHub account and sync to see your repositories and start tracking your development journey
                </p>

                {!githubConnection ? (
                  <Link href="/employee/dashboard">
                    <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white h-10 px-6">
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
                    <Zap className="w-4 h-4 mr-2" />
                    Sync Repositories
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {repositories.map((repo) => {
              const languages = repo.languages as Record<string, number> || {}
              const frameworks = repo.frameworks as string[] || []
              const topLanguages = Object.entries(languages)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([lang]) => lang)

              return (
                <Card
                  key={repo.id}
                  className="border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {repo.isPrivate && (
                              <Badge className="bg-gray-700 text-white text-xs">Private</Badge>
                            )}
                            {repo.isFork && (
                              <Badge variant="outline" className="text-xs border-purple-300">Fork</Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {repo.name}
                        </CardTitle>
                        {repo.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {repo.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Repository Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <Star className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">{repo.stars}</div>
                          <div className="text-xs text-gray-600">Stars</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <GitFork className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">{repo.forks}</div>
                          <div className="text-xs text-gray-600">Forks</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <Code className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">{repo._count.commits}</div>
                          <div className="text-xs text-gray-600">Commits</div>
                        </div>
                      </div>

                      {/* Languages & Frameworks */}
                      {(topLanguages.length > 0 || frameworks.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {topLanguages.map((lang) => (
                            <Badge
                              key={lang}
                              variant="outline"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                          {frameworks.slice(0, 2).map((fw) => (
                            <Badge
                              key={fw}
                              variant="outline"
                              className="text-xs"
                            >
                              {fw}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Last Activity */}
                      {repo.pushedAt && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            Last pushed {formatDistance(new Date(repo.pushedAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      {/* Primary Language */}
                      {repo.primaryLanguage && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Primary: {repo.primaryLanguage}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        <Link href={`/employee/repositories/${repo.id}`}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            View Commits & Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

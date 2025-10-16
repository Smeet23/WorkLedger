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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 md:p-12 mb-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  My Repositories
                </h1>
                <p className="text-white/90">
                  {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'} • {totalCommits} total commits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {repositories.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{repositories.length}</div>
                </div>
                <div className="text-sm font-medium text-gray-600">Repositories</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{totalCommits}</div>
                </div>
                <div className="text-sm font-medium text-gray-600">Total Commits</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {repositories.reduce((sum, repo) => sum + (repo.stars || 0), 0)}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Total Stars</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <GitFork className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {repositories.reduce((sum, repo) => sum + (repo.forks || 0), 0)}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Total Forks</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {repositories.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400"></div>
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                {/* Cute illustration */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-indigo-300 rounded-3xl transform -rotate-6 animate-pulse" style={{ animationDuration: '3s' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                          <GitBranch className="w-14 h-14 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Repositories Found
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Connect your GitHub account and sync to see your repositories and start tracking your development journey
                </p>

                {!githubConnection ? (
                  <Link href="/employee/dashboard">
                    <Button size="lg" className="rounded-full h-12 px-8 shadow-lg bg-gray-900 hover:bg-gray-800">
                      <Github className="w-5 h-5 mr-2" />
                      Connect GitHub Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="rounded-full h-12 px-8 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Zap className="w-5 h-5 mr-2" />
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
                  className="group border-2 border-transparent hover:border-purple-300 transition-all duration-300 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl"
                >
                  <div className="h-2 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400"></div>

                  <CardHeader className="bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <GitBranch className="w-5 h-5 text-white" />
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
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center">
                          <Star className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                          <div className="text-lg font-bold text-yellow-700">{repo.stars}</div>
                          <div className="text-xs text-yellow-600">Stars</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                          <GitFork className="w-4 h-4 text-green-600 mx-auto mb-1" />
                          <div className="text-lg font-bold text-green-700">{repo.forks}</div>
                          <div className="text-xs text-green-600">Forks</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                          <Code className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                          <div className="text-lg font-bold text-blue-700">{repo._count.commits}</div>
                          <div className="text-xs text-blue-600">Commits</div>
                        </div>
                      </div>

                      {/* Languages & Frameworks */}
                      {(topLanguages.length > 0 || frameworks.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {topLanguages.map((lang) => (
                            <Badge
                              key={lang}
                              className="bg-purple-100 text-purple-700 border-purple-200"
                            >
                              {lang}
                            </Badge>
                          ))}
                          {frameworks.slice(0, 2).map((fw) => (
                            <Badge
                              key={fw}
                              className="bg-indigo-100 text-indigo-700 border-indigo-200"
                            >
                              {fw}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Last Activity */}
                      {repo.pushedAt && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-xl p-3">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">
                            Last pushed {formatDistance(new Date(repo.pushedAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      {/* Primary Language */}
                      {repo.primaryLanguage && (
                        <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-700">Primary: {repo.primaryLanguage}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        <Link href={`/employee/repositories/${repo.id}`}>
                          <Button className="w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md">
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

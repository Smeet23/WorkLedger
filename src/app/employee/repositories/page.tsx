import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, GitBranch, Star, GitFork, Code, Calendar, Eye } from 'lucide-react'
import { format, formatDistance } from 'date-fns'
import { FullSyncButton } from "@/components/github/full-sync-button"

export default async function RepositoriesPage() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
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
  const repositories = await db.repository.findMany({
    where: { employeeId: userInfo.employee.id },
    orderBy: { pushedAt: 'desc' },
    include: {
      _count: {
        select: { commits: true }
      }
    }
  })

  // Get GitHub connection status
  const githubConnection = await db.gitHubConnection.findUnique({
    where: { employeeId: userInfo.employee.id }
  })

  // Get total commit count from database
  const totalCommits = await db.commit.count({
    where: {
      repository: { employeeId: userInfo.employee.id }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Repositories</h1>
              <p className="text-sm text-gray-500 mt-1">
                {repositories.length} repositories • {totalCommits} total commits
              </p>
            </div>
            <div className="flex gap-3">
              {githubConnection && (
                <FullSyncButton />
              )}
              <Link href="/employee">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {repositories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <GitBranch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Repositories Found
                </h3>
                <p className="text-gray-500 mb-6">
                  Connect your GitHub account and sync to see your repositories
                </p>
                {!githubConnection && (
                  <Link href="/employee">
                    <Button>
                      Connect GitHub Account
                    </Button>
                  </Link>
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
                <Card key={repo.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {repo.name}
                          {repo.isPrivate && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                          {repo.isFork && (
                            <Badge variant="outline" className="text-xs">Fork</Badge>
                          )}
                        </CardTitle>
                        {repo.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {repo.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Repository Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {repo.stars}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="w-4 h-4" />
                          {repo.forks}
                        </div>
                        <div className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          {repo._count.commits} commits
                        </div>
                      </div>

                      {/* Languages */}
                      {topLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {topLanguages.map((lang) => (
                            <Badge key={lang} variant="default" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                          {frameworks.length > 0 && frameworks.map((fw) => (
                            <Badge key={fw} variant="secondary" className="text-xs">
                              {fw}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Last Activity */}
                      {repo.pushedAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          Last pushed {formatDistance(new Date(repo.pushedAt), new Date(), { addSuffix: true })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        <Link href={`/employee/repositories/${repo.id}`}>
                          <Button className="w-full" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View Commits & Details
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
      </main>
    </div>
  )
}
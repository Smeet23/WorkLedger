import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { ArrowLeft, GitBranch, GitCommit, Plus, Minus, FileText, Calendar, User, Hash, ExternalLink } from 'lucide-react'
import { format, formatDistance } from 'date-fns'

interface PageProps {
  params: { id: string }
  searchParams: { page?: string }
}

const COMMITS_PER_PAGE = 20

export default async function RepositoryDetailPage({ params, searchParams }: PageProps) {
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

  // Fetch repository with commit count
  const repository = await db.repository.findFirst({
    where: {
      id: params.id,
      employeeId: userInfo.employee.id
    },
    include: {
      _count: {
        select: { commits: true }
      }
    }
  })

  if (!repository) {
    notFound()
  }

  // Parse pagination
  const currentPage = parseInt(searchParams.page || '1')
  const skip = (currentPage - 1) * COMMITS_PER_PAGE

  // Fetch paginated commits
  const [commits, totalCommits] = await Promise.all([
    db.commit.findMany({
      where: { repositoryId: repository.id },
      orderBy: { authorDate: 'desc' },
      skip,
      take: COMMITS_PER_PAGE
    }),
    db.commit.count({
      where: { repositoryId: repository.id }
    })
  ])

  const totalPages = Math.ceil(totalCommits / COMMITS_PER_PAGE)
  const languages = repository.languages as Record<string, number> || {}
  const frameworks = repository.frameworks as string[] || []

  // Calculate repository statistics
  const totalAdditions = commits.reduce((sum, commit) => sum + commit.additions, 0)
  const totalDeletions = commits.reduce((sum, commit) => sum + commit.deletions, 0)
  const totalFilesChanged = commits.reduce((sum, commit) => sum + commit.filesChanged, 0)

  // Get language percentages
  const languageEntries = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, percentage]) => ({
      name: lang,
      percentage: Math.round(percentage)
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <GitBranch className="w-8 h-8" />
                {repository.name}
                {repository.isPrivate && <Badge variant="secondary">Private</Badge>}
                {repository.isFork && <Badge variant="outline">Fork</Badge>}
              </h1>
              {repository.description && (
                <p className="text-gray-600 mt-2">{repository.description}</p>
              )}
            </div>
            <Link href="/employee/repositories">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Repositories
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Repository Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Commits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCommits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Lines Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{totalAdditions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Lines Deleted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{totalDeletions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Files Changed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFilesChanged.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="commits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="commits">Commits ({totalCommits})</TabsTrigger>
            <TabsTrigger value="languages">Languages & Frameworks</TabsTrigger>
            <TabsTrigger value="info">Repository Info</TabsTrigger>
          </TabsList>

          <TabsContent value="commits" className="space-y-4">
            {commits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitCommit className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No commits found for this repository</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {commits.map((commit) => (
                    <Card key={commit.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <GitCommit className="w-4 h-4 text-gray-500" />
                              <p className="font-medium text-gray-900 line-clamp-1">
                                {commit.message.split('\n')[0]}
                              </p>
                            </div>
                            {commit.message.split('\n').length > 1 && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {commit.message.split('\n').slice(1).join('\n')}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {commit.authorName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDistance(new Date(commit.authorDate), new Date(), { addSuffix: true })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                <code className="font-mono text-xs">{commit.sha.substring(0, 7)}</code>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-green-600 font-medium">+{commit.additions}</span>
                              <span className="text-red-600 font-medium">-{commit.deletions}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {commit.filesChanged} files
                            </Badge>
                            {commit.htmlUrl && (
                              <a
                                href={commit.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {commit.files && (commit.files as string[]).length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                              View changed files
                            </summary>
                            <div className="mt-2 space-y-1">
                              {(commit.files as string[]).slice(0, 10).map((file, idx) => (
                                <div key={idx} className="text-xs font-mono text-gray-500 pl-4">
                                  {file}
                                </div>
                              ))}
                              {(commit.files as string[]).length > 10 && (
                                <div className="text-xs text-gray-400 pl-4">
                                  ...and {(commit.files as string[]).length - 10} more files
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Link
                      href={`/employee/repositories/${repository.id}?page=${Math.max(1, currentPage - 1)}`}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="outline" disabled={currentPage === 1}>
                        Previous
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                        if (pageNum > totalPages) return null
                        return (
                          <Link
                            key={pageNum}
                            href={`/employee/repositories/${repository.id}?page=${pageNum}`}
                          >
                            <Button
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                            >
                              {pageNum}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                    <Link
                      href={`/employee/repositories/${repository.id}?page=${Math.min(totalPages, currentPage + 1)}`}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="outline" disabled={currentPage === totalPages}>
                        Next
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="languages">
            <Card>
              <CardHeader>
                <CardTitle>Languages & Frameworks</CardTitle>
                <CardDescription>Technologies used in this repository</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Languages */}
                  {languageEntries.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Programming Languages</h3>
                      <div className="space-y-2">
                        {languageEntries.map((lang) => (
                          <div key={lang.name} className="flex items-center gap-3">
                            <div className="w-32 font-mono text-sm">{lang.name}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6">
                              <div
                                className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${lang.percentage}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {lang.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Frameworks */}
                  {frameworks.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Frameworks & Libraries</h3>
                      <div className="flex flex-wrap gap-2">
                        {frameworks.map((framework) => (
                          <Badge key={framework} variant="secondary" className="py-1 px-3">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {languageEntries.length === 0 && frameworks.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No language or framework information available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Repository Information</CardTitle>
                <CardDescription>Detailed information about this repository</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Default Branch</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.defaultBranch || 'main'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(repository.createdAt), 'MMM dd, yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Pushed</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {repository.pushedAt
                        ? formatDistance(new Date(repository.pushedAt), new Date(), { addSuffix: true })
                        : 'Never'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.size} KB</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Open Issues</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.openIssues}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stars</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.stars}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Forks</dt>
                    <dd className="mt-1 text-sm text-gray-900">{repository.forks}</dd>
                  </div>
                  {repository.homepage && (
                    <div className="col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Homepage</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a
                          href={repository.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {repository.homepage}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </dd>
                    </div>
                  )}
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">GitHub ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{repository.githubRepoId}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { Github, Mail, Share2, Star, GitCommitHorizontal, Award, Code2, Trophy, Calendar, Building2, Link2 } from 'lucide-react'
import { format } from 'date-fns'
import { ShareProfile } from '@/components/profile/share-profile'

export default async function PublicProfilePage() {
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

  const employee = userInfo.employee
  const company = userInfo.company

  // Fetch all data for public profile
  const [
    skillRecords,
    certificates,
    employeeRepos,
    totalCommits,
    githubConnection
  ] = await Promise.all([
    db.skillRecord.findMany({
      where: { employeeId: employee.id },
      include: { skill: true },
      orderBy: [
        { level: 'desc' },
        { confidence: 'desc' }
      ]
    }),
    db.certificate.findMany({
      where: { employeeId: employee.id },
      orderBy: { issueDate: 'desc' },
      take: 5
    }),
    db.employeeRepository.findMany({
      where: { employeeId: employee.id },
      include: {
        repository: {
          include: {
            _count: { select: { commits: true } }
          }
        }
      },
      orderBy: {
        repository: {
          stars: 'desc'
        }
      },
      take: 6
    }),
    db.commit.count({
      where: {
        authorEmail: employee.email
      }
    }),
    db.gitHubConnection.findUnique({
      where: { employeeId: employee.id }
    })
  ])

  // Extract repositories from employeeRepos
  const repositories = employeeRepos.map(er => er.repository)

  const profileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/profile/${employee.id}`

  // Group skills by category
  const skillsByCategory = skillRecords.reduce((acc, record) => {
    const category = record.skill.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(record)
    return acc
  }, {} as Record<string, typeof skillRecords>)

  const expertSkills = skillRecords.filter(r => r.level === 'EXPERT').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Profile Header */}
        <Card className="border border-gray-200">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-gray-700">
                  {employee.firstName[0]}{employee.lastName?.[0] || ''}
                </span>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-gray-600 mb-1">{employee.title || employee.role}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {company?.name}
                  </div>
                  {githubConnection?.githubUsername && (
                    <a
                      href={`https://github.com/${githubConnection.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      @{githubConnection.githubUsername}
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">{skillRecords.length}</div>
                      <div className="text-xs text-gray-500">Skills</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">{expertSkills}</div>
                      <div className="text-xs text-gray-500">Expert</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <GitCommitHorizontal className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">{totalCommits}</div>
                      <div className="text-xs text-gray-500">Commits</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">{certificates.length}</div>
                      <div className="text-xs text-gray-500">Certificates</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="w-5 h-5 text-gray-700" />
              Share Your Profile
            </CardTitle>
            <CardDescription>
              Share this link to showcase your professional profile with others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareProfile profileUrl={profileUrl} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Section */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Technical Skills</CardTitle>
              <CardDescription>
                Your strongest technical competencies organized by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(skillsByCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).slice(0, 3).map(([category, skills]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 6).map((record) => (
                          <Badge
                            key={record.id}
                            variant="outline"
                            className="text-xs font-medium"
                          >
                            {record.skill.name}
                          </Badge>
                        ))}
                        {skills.length > 6 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No skills tracked yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certificates Section */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Professional Certificates</CardTitle>
              <CardDescription>
                Your verified professional achievements and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 mb-1">{cert.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Issued {format(new Date(cert.issueDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Award className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No certificates yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Repositories */}
          <Card className="lg:col-span-2 border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Featured Repositories</CardTitle>
              <CardDescription>
                Your most notable open source contributions and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repositories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900">{repo.name}</h4>
                        {repo.isPrivate && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stars || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitCommitHorizontal className="w-3 h-3" />
                          {repo._count.commits}
                        </span>
                        {repo.primaryLanguage && (
                          <Badge variant="outline" className="text-xs">
                            {repo.primaryLanguage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Code2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No repositories synced yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
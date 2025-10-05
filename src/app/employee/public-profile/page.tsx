import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { Github, Mail, Share2, Star, GitCommitHorizontal, Award } from 'lucide-react'
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
    repositories,
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
    db.repository.findMany({
      where: { employeeId: employee.id },
      include: {
        _count: { select: { commits: true } }
      },
      orderBy: { stars: 'desc' },
      take: 6
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
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Profile Preview */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          <CardContent className="relative -mt-16">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-700">
                  {employee.firstName[0]}{employee.lastName?.[0] || ''}
                </span>
              </div>
              <div className="flex-1 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-gray-600">{employee.title || employee.role}</p>
                <p className="text-sm text-gray-500">{company?.name}</p>

                <div className="flex items-center gap-4 mt-3">
                  {githubConnection?.githubUsername && (
                    <a
                      href={`https://github.com/${githubConnection.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Github className="w-4 h-4" />
                      {githubConnection.githubUsername}
                    </a>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mt-8 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{skillRecords.length}</div>
                <div className="text-sm text-gray-500">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{expertSkills}</div>
                <div className="text-sm text-gray-500">Expert Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalCommits}</div>
                <div className="text-sm text-gray-500">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
                <div className="text-sm text-gray-500">Certificates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShareProfile profileUrl={profileUrl} />
            <p className="text-sm text-gray-500 mt-2">
              Share this link to showcase your professional profile
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Top Skills</CardTitle>
              <CardDescription>
                Your strongest technical competencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(skillsByCategory).slice(0, 3).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 5).map((record) => (
                        <Badge
                          key={record.id}
                          variant={
                            record.level === 'EXPERT' ? 'default' :
                            record.level === 'ADVANCED' ? 'secondary' :
                            'outline'
                          }
                        >
                          {record.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Certificates</CardTitle>
              <CardDescription>
                Latest professional achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-sm">{cert.title}</p>
                          <p className="text-xs text-gray-500">
                            Issued {format(new Date(cert.issueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No certificates yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Repositories */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Featured Repositories</CardTitle>
              <CardDescription>
                Most starred open source contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repositories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{repo.name}</h4>
                      {repo.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stars}
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
                <p className="text-sm text-gray-500 text-center py-4">
                  No repositories synced yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
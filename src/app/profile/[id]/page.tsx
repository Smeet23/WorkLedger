import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { notFound } from 'next/navigation'
import { Github, Globe, Mail, Star, GitCommitHorizontal, Award, Building, Calendar } from 'lucide-react'
import { format, formatDistance } from 'date-fns'

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function PublicProfileViewPage({ params }: ProfilePageProps) {
  const employee = await db.employee.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      skillRecords: {
        include: { skill: true },
        orderBy: [
          { level: 'desc' },
          { confidence: 'desc' }
        ]
      },
      certificates: {
        orderBy: { issueDate: 'desc' },
        take: 5
      },
      repositories: {
        include: {
          _count: { select: { commits: true } }
        },
        orderBy: { stars: 'desc' },
        take: 6
      },
      gitHubConnection: true,
      _count: {
        select: {
          repositories: true,
          certificates: true
        }
      }
    }
  })

  if (!employee) {
    notFound()
  }

  // Calculate total commits
  const totalCommits = await db.commit.count({
    where: {
      repository: { employeeId: employee.id }
    }
  })

  // Group skills by category
  const skillsByCategory = employee.skillRecords.reduce((acc, record) => {
    const category = record.skill.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(record)
    return acc
  }, {} as Record<string, typeof employee.skillRecords>)

  const expertSkills = employee.skillRecords.filter(r => r.level === 'EXPERT').length
  const daysAtCompany = employee.startDate
    ? Math.floor((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-48"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        {/* Profile Card */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl">
                <span className="text-4xl font-bold">
                  {employee.firstName[0]}{employee.lastName?.[0] || ''}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-gray-600 mt-1">{employee.title || employee.role}</p>
                <div className="flex items-center gap-4 mt-3 text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {employee.company.name}
                  </span>
                  {employee.department && (
                    <span>{employee.department}</span>
                  )}
                  {daysAtCompany > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDistance(new Date(employee.startDate!), new Date(), { addSuffix: false })}
                    </span>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4 mt-4">
                  {employee.gitHubConnection?.githubUsername && (
                    <a
                      href={`https://github.com/${employee.gitHubConnection.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {employee.linkedinUrl && (
                    <a
                      href={employee.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {employee.personalWebsite && (
                    <a
                      href={employee.personalWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {employee.bio && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-700">{employee.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8 pt-6 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{employee.skillRecords.length}</div>
                <div className="text-sm text-gray-500">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{expertSkills}</div>
                <div className="text-sm text-gray-500">Expert Skills</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{totalCommits}</div>
                <div className="text-sm text-gray-500">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{employee._count.repositories}</div>
                <div className="text-sm text-gray-500">Repositories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{employee._count.certificates}</div>
                <div className="text-sm text-gray-500">Certificates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skills by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>
                Proficiency across different technology domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(skillsByCategory).slice(0, 4).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 8).map((record) => (
                        <Badge
                          key={record.id}
                          variant={
                            record.level === 'EXPERT' ? 'default' :
                            record.level === 'ADVANCED' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {record.skill.name}
                          {record.level === 'EXPERT' && ' ⭐'}
                        </Badge>
                      ))}
                      {skills.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{skills.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle>Certificates & Achievements</CardTitle>
              <CardDescription>
                Professional certifications and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employee.certificates.length > 0 ? (
                <div className="space-y-3">
                  {employee.certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cert.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(cert.issueDate), 'MMMM yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {employee._count.certificates > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{employee._count.certificates - 5} more certificates
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No certificates earned yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Repositories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Featured Projects</CardTitle>
            <CardDescription>
              Notable open source contributions and repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employee.repositories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.repositories.map((repo) => (
                  <div key={repo.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      {repo.name}
                      {repo.isPrivate && (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                    </h4>
                    {repo.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
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
                        {repo._count.commits} commits
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
              <p className="text-sm text-gray-500 text-center py-8">
                No public repositories available
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Code2, Star, Calendar, Target, Award } from 'lucide-react'
import { format } from 'date-fns'

export default async function SkillProgressPage() {
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

  // Fetch skill records with full details
  const skillRecords = await db.skillRecord.findMany({
    where: { employeeId: userInfo.employee.id },
    include: {
      skill: true
    },
    orderBy: [
      { level: 'desc' },
      { confidence: 'desc' }
    ]
  })

  // Get skill statistics
  const skillsByCategory = skillRecords.reduce((acc, record) => {
    const category = record.skill.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(record)
    return acc
  }, {} as Record<string, typeof skillRecords>)

  const levelCounts = {
    EXPERT: skillRecords.filter(r => r.level === 'EXPERT').length,
    ADVANCED: skillRecords.filter(r => r.level === 'ADVANCED').length,
    INTERMEDIATE: skillRecords.filter(r => r.level === 'INTERMEDIATE').length,
    BEGINNER: skillRecords.filter(r => r.level === 'BEGINNER').length,
  }

  const averageConfidence = skillRecords.length > 0
    ? Math.round((skillRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / skillRecords.length) * 100)
    : 0

  // Get recent commits to show skill activity
  const recentActivity = await db.commit.findMany({
    where: {
      repository: {
        employeeId: userInfo.employee.id
      }
    },
    orderBy: { authorDate: 'desc' },
    take: 10,
    include: {
      repository: {
        select: {
          name: true,
          primaryLanguage: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Skill Progress</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your professional development journey
              </p>
            </div>
            <Link href="/employee">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{skillRecords.length}</div>
              <p className="text-xs text-gray-500 mt-1">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Expert Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{levelCounts.EXPERT}</div>
              <p className="text-xs text-gray-500 mt-1">Mastery level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Average Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{averageConfidence}%</div>
              <Progress value={averageConfidence} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{Object.keys(skillsByCategory).length}</div>
              <p className="text-xs text-gray-500 mt-1">Skill domains</p>
            </CardContent>
          </Card>
        </div>

        {/* Skill Level Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Skill Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(levelCounts).map(([level, count]) => (
                <div key={level} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{level}</div>
                  <div className="flex-1">
                    <Progress
                      value={skillRecords.length > 0 ? (count / skillRecords.length) * 100 : 0}
                      className="h-3"
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-500">{count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  {category}
                </span>
                <Badge variant="secondary">{skills.length} skills</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium capitalize">{record.skill.name}</h4>
                        {record.lastUsed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last used: {new Date(record.lastUsed).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          record.level === 'EXPERT' ? 'default' :
                          record.level === 'ADVANCED' ? 'secondary' :
                          record.level === 'INTERMEDIATE' ? 'outline' :
                          'outline'
                        }
                      >
                        {record.level}
                      </Badge>
                    </div>

                    {record.confidence && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Confidence</span>
                          <span>{Math.round(record.confidence * 100)}%</span>
                        </div>
                        <Progress value={record.confidence * 100} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {record.isAutoDetected && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Auto-detected
                        </span>
                      )}
                      {record.source && (
                        <span>Source: {record.source}</span>
                      )}
                    </div>

                    {record.lastUsed && (
                      <p className="text-xs text-gray-400 mt-2">
                        Last used: {format(new Date(record.lastUsed), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Skill Activity
            </CardTitle>
            <CardDescription>
              Your latest commits showing skill usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((commit) => (
                  <div key={commit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {commit.message.split('\n')[0]}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{commit.repository.name}</span>
                        {commit.repository.primaryLanguage && (
                          <Badge variant="outline" className="text-xs">
                            {commit.repository.primaryLanguage}
                          </Badge>
                        )}
                        <span>{format(new Date(commit.authorDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Sync your GitHub to see activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
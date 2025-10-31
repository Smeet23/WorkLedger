import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/db"
import { TrendingUp, Code2, Star, Calendar, Target, Sparkles, Zap, Award, ArrowRight, Code } from 'lucide-react'
import { format } from 'date-fns'
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SkillProgressPage() {
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
      authorEmail: userInfo.employee.email
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Skill Progress
            </h1>
            <p className="text-sm text-gray-600">
              {skillRecords.length} {skillRecords.length === 1 ? 'skill' : 'skills'} tracked • {averageConfidence}% average confidence
            </p>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Skills */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-1">{skillRecords.length}</div>
              <div className="text-sm text-gray-600">Total Skills</div>
              <div className="text-xs text-gray-500 mt-1">Across all categories</div>
            </CardContent>
          </Card>

          {/* Expert Skills */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-1">{levelCounts.EXPERT}</div>
              <div className="text-sm text-gray-600">Expert Skills</div>
              <div className="text-xs text-gray-500 mt-1">Mastery level</div>
            </CardContent>
          </Card>

          {/* Average Confidence */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-1">{averageConfidence}%</div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
              <Progress value={averageConfidence} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-1">{Object.keys(skillsByCategory).length}</div>
              <div className="text-sm text-gray-600">Categories</div>
              <div className="text-xs text-gray-500 mt-1">Skill domains</div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Level Distribution */}
        <Card className="border border-gray-200 mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-xl">Skill Level Distribution</CardTitle>
                <CardDescription className="text-sm">Your progression across proficiency levels</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { level: 'EXPERT' },
                { level: 'ADVANCED' },
                { level: 'INTERMEDIATE' },
                { level: 'BEGINNER' }
              ].map(({ level }) => {
                const count = levelCounts[level as keyof typeof levelCounts]
                const percentage = skillRecords.length > 0 ? (count / skillRecords.length) * 100 : 0

                return (
                  <div key={level} className="text-center">
                    <div className="text-2xl font-semibold text-gray-900 mb-1">{count}</div>
                    <div className="text-sm text-gray-600 mb-1">{level}</div>
                    <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Skills by Category */}
        {skillRecords.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Code className="w-8 h-8 text-gray-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No Skills Tracked Yet
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your GitHub account to automatically detect and track your skills from your code contributions
                </p>

                <Link href="/employee/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
                    <Zap className="w-4 h-4 mr-2" />
                    Connect GitHub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <Card key={category} className="border border-gray-200 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-gray-700" />
                      </div>
                      <CardTitle className="text-xl">{category}</CardTitle>
                    </div>
                    <Badge className="bg-gray-700 text-white text-lg px-4 py-1">{skills.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((record) => (
                      <div
                        key={record.id}
                        className="group p-5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 capitalize mb-1">{record.skill.name}</h4>
                            {record.lastUsed && (
                              <p className="text-xs text-gray-500">
                                Last used: {format(new Date(record.lastUsed), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-gray-700 text-white">
                            {record.level}
                          </Badge>
                        </div>

                        {record.confidence && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                              <span className="font-medium">Confidence</span>
                              <span className="font-bold">{Math.round(record.confidence * 100)}%</span>
                            </div>
                            <Progress value={record.confidence * 100} className="h-2" />
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {record.isAutoDetected && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Auto-detected
                            </Badge>
                          )}
                          {record.source && (
                            <Badge variant="outline" className="text-xs">
                              {record.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Recent Activity */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recent Skill Activity</CardTitle>
                    <CardDescription>Your latest commits showing skill usage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((commit) => (
                      <div key={commit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {commit.message.split('\n')[0]}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-gray-600">{commit.repository.name}</span>
                            {commit.repository.primaryLanguage && (
                              <Badge variant="outline" className="text-xs">
                                {commit.repository.primaryLanguage}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{format(new Date(commit.authorDate), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-sm text-gray-600">Sync your GitHub to see activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

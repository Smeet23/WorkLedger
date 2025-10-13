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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 mb-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  Skill Progress
                </h1>
                <p className="text-white/90">
                  {skillRecords.length} {skillRecords.length === 1 ? 'skill' : 'skills'} tracked • {averageConfidence}% average confidence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Skills */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
            <div className="relative bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{skillRecords.length}</div>
              </div>
              <div className="text-sm font-medium text-gray-600">Total Skills</div>
              <div className="text-xs text-gray-500 mt-1">Across all categories</div>
            </div>
          </div>

          {/* Expert Skills */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
            <div className="relative bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{levelCounts.EXPERT}</div>
              </div>
              <div className="text-sm font-medium text-gray-600">Expert Skills</div>
              <div className="text-xs text-gray-500 mt-1">Mastery level</div>
            </div>
          </div>

          {/* Average Confidence */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
            <div className="relative bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{averageConfidence}%</div>
              </div>
              <div className="text-sm font-medium text-gray-600">Avg Confidence</div>
              <Progress value={averageConfidence} className="mt-2 h-2" />
            </div>
          </div>

          {/* Categories */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
            <div className="relative bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{Object.keys(skillsByCategory).length}</div>
              </div>
              <div className="text-sm font-medium text-gray-600">Categories</div>
              <div className="text-xs text-gray-500 mt-1">Skill domains</div>
            </div>
          </div>
        </div>

        {/* Skill Level Distribution */}
        <Card className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden mb-8">
          <div className="h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
          <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Skill Level Distribution</CardTitle>
                <CardDescription className="text-sm">Your progression across proficiency levels</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { level: 'EXPERT', color: 'from-green-500 to-emerald-500', textColor: 'text-green-600' },
                { level: 'ADVANCED', color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-600' },
                { level: 'INTERMEDIATE', color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-600' },
                { level: 'BEGINNER', color: 'from-gray-500 to-slate-500', textColor: 'text-gray-600' }
              ].map(({ level, color, textColor }) => {
                const count = levelCounts[level as keyof typeof levelCounts]
                const percentage = skillRecords.length > 0 ? (count / skillRecords.length) * 100 : 0

                return (
                  <div key={level} className="flex items-center gap-4">
                    <div className={`w-28 text-sm font-semibold ${textColor}`}>{level}</div>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} transition-all duration-500 flex items-center justify-end pr-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          {count > 0 && (
                            <span className="text-xs font-bold text-white">{count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-semibold text-gray-700">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Skills by Category */}
        {skillRecords.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-3xl transform rotate-12 animate-pulse" style={{ animationDuration: '3s' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                          <Code className="w-14 h-14 text-indigo-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Skills Tracked Yet
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Connect your GitHub account to automatically detect and track your skills from your code contributions
                </p>

                <Link href="/employee/dashboard">
                  <Button size="lg" className="rounded-full h-12 px-8 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Zap className="w-5 h-5 mr-2" />
                    Connect GitHub
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <Card key={category} className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden mb-6">
                <div className="h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-xl">{category}</CardTitle>
                    </div>
                    <Badge className="bg-indigo-500 text-white text-lg px-4 py-1">{skills.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((record) => (
                      <div
                        key={record.id}
                        className="group p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all"
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
                          <Badge
                            className={
                              record.level === 'EXPERT' ? 'bg-green-500 text-white' :
                              record.level === 'ADVANCED' ? 'bg-blue-500 text-white' :
                              record.level === 'INTERMEDIATE' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }
                          >
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
                            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700">
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
            <Card className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
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
                      <div key={commit.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {commit.message.split('\n')[0]}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-gray-600">{commit.repository.name}</span>
                            {commit.repository.primaryLanguage && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
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
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
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

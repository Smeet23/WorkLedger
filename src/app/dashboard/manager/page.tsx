import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  GitCommit,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  Target,
  BarChart3,
  Brain,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import Link from "next/link"
import { format, formatDistance, startOfDay, subDays } from 'date-fns'

// Get real-time team data
async function getTeamAnalytics(companyId: string) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekAgo = subDays(now, 7)

  const [
    employees,
    todayActivities,
    weekActivities,
    activeTickets,
    blockedItems,
    recentCommits,
    skillRecords
  ] = await Promise.all([
    // Get all employees with their connections
    db.employee.findMany({
      where: { companyId, isActive: true },
      include: {
        githubConnection: true,
        _count: {
          select: {
            repositories: true,
            certificates: true,
            skillRecords: true
          }
        }
      }
    }),

    // Today's activities
    db.commit.count({
      where: {
        repository: { employee: { companyId } },
        authorDate: { gte: todayStart }
      }
    }),

    // Week's activities
    db.commit.count({
      where: {
        repository: { employee: { companyId } },
        authorDate: { gte: weekAgo }
      }
    }),

    // Active work items (simplified - would integrate with Jira)
    db.repository.count({
      where: {
        employee: { companyId },
        pushedAt: { gte: weekAgo }
      }
    }),

    // Blocked items (placeholder - would come from Jira)
    Promise.resolve(3), // Placeholder

    // Recent commits for activity feed
    db.commit.findMany({
      where: {
        repository: { employee: { companyId } }
      },
      include: {
        repository: {
          include: { employee: true }
        }
      },
      orderBy: { authorDate: 'desc' },
      take: 10
    }),

    // Skills distribution
    db.skillRecord.findMany({
      where: { employee: { companyId } },
      include: { skill: true, employee: true }
    })
  ])

  // Calculate team metrics
  const connectedEmployees = employees.filter(e => e.githubConnection?.isActive).length
  const totalEmployees = employees.length
  const connectionRate = totalEmployees > 0 ? (connectedEmployees / totalEmployees) * 100 : 0

  // Calculate productivity metrics
  const avgCommitsPerDev = weekActivities / (connectedEmployees || 1)
  const todayVelocity = todayActivities
  const weekTrend = calculateTrend(weekActivities, connectedEmployees)

  // Identify top performers and those needing attention
  const employeeMetrics = employees.map(emp => ({
    ...emp,
    score: (emp._count.repositories * 10) + (emp._count.skillRecords * 5) + (emp._count.certificates * 3),
    lastActive: recentCommits.find(c => c.repository.employee.id === emp.id)?.authorDate
  })).sort((a, b) => b.score - a.score)

  const topPerformers = employeeMetrics.slice(0, 3)
  const needsAttention = employeeMetrics
    .filter(emp => !emp.lastActive || (now.getTime() - new Date(emp.lastActive).getTime()) > 72 * 60 * 60 * 1000)

  return {
    employees,
    connectedEmployees,
    connectionRate,
    todayActivities,
    weekActivities,
    avgCommitsPerDev,
    todayVelocity,
    weekTrend,
    activeTickets,
    blockedItems,
    recentCommits,
    topPerformers,
    needsAttention,
    skillRecords,
    employeeMetrics
  }
}

function calculateTrend(current: number, baseline: number): 'up' | 'down' | 'stable' {
  const expected = baseline * 7 // Expected for a week
  const difference = ((current - expected) / expected) * 100
  if (difference > 10) return 'up'
  if (difference < -10) return 'down'
  return 'stable'
}

export default async function ManagerDashboard() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo
  const analytics = await getTeamAnalytics(company.id)

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
        {/* Critical Alerts */}
        {analytics.needsAttention.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>Immediate Attention Required</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {analytics.needsAttention.slice(0, 3).map(emp => (
                  <li key={emp.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                      {emp.lastActive
                        ? ` - No activity for ${formatDistance(new Date(emp.lastActive), new Date())}`
                        : ' - No activity recorded'
                      }
                    </span>
                    <Button size="sm" variant="link" className="text-red-600">
                      Check Status →
                    </Button>
                  </li>
                ))}
                {analytics.blockedItems > 0 && (
                  <li className="text-sm">
                    <span className="font-medium">{analytics.blockedItems} blocked tickets</span> need resolution
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Size</p>
                  <p className="text-2xl font-bold">{analytics.employees.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.connectedEmployees} connected
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Progress value={analytics.connectionRate} className="mt-3 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Velocity</p>
                  <p className="text-2xl font-bold">{analytics.todayVelocity}</p>
                  <p className="text-xs text-gray-500 mt-1">commits today</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                {analytics.weekTrend === 'up' && <ArrowUp className="w-4 h-4 text-green-500 mr-1" />}
                {analytics.weekTrend === 'down' && <ArrowDown className="w-4 h-4 text-red-500 mr-1" />}
                {analytics.weekTrend === 'stable' && <Minus className="w-4 h-4 text-gray-500 mr-1" />}
                <span className="text-xs text-gray-600">
                  {analytics.weekTrend === 'up' ? 'Above' : analytics.weekTrend === 'down' ? 'Below' : 'Meeting'} target
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Work</p>
                  <p className="text-2xl font-bold">{analytics.activeTickets}</p>
                  <p className="text-xs text-gray-500 mt-1">in progress</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              {analytics.blockedItems > 0 && (
                <div className="mt-3 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600">{analytics.blockedItems} blocked</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Output</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.avgCommitsPerDev)}</p>
                  <p className="text-xs text-gray-500 mt-1">commits/dev/week</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="realtime">
              <Activity className="w-4 h-4 mr-2" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Team Status
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="workload">
              <Clock className="w-4 h-4 mr-2" />
              Workload
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Brain className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Real-time Activity Tab */}
          <TabsContent value="realtime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Activity Feed</CardTitle>
                  <CardDescription>Real-time team activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {analytics.recentCommits.map((commit, idx) => (
                      <div key={commit.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${idx === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{commit.repository.employee.firstName}</span>
                            {' committed to '}
                            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{commit.repository.name}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {commit.message?.split('\n')[0] || 'No message'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistance(new Date(commit.authorDate), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Pulse */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Pulse</CardTitle>
                  <CardDescription>Current team activity status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Online/Active Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Currently Active</span>
                        <span className="font-semibold">{analytics.connectedEmployees} / {analytics.employees.length}</span>
                      </div>
                      <Progress value={analytics.connectionRate} className="h-2" />
                    </div>

                    {/* Top Performers */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Performers</h4>
                      <div className="space-y-2">
                        {analytics.topPerformers.map((emp, idx) => (
                          <div key={emp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                              </span>
                              <span className="text-sm font-medium">
                                {emp.firstName} {emp.lastName}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {emp.score} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Timer className="w-4 h-4 mr-2" />
                        Start Daily Standup
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <GitCommit className="w-4 h-4 mr-2" />
                        Review Code Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Status Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Member Status</CardTitle>
                <CardDescription>Individual performance and activity tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Employee</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Last Activity</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Repositories</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Skills</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Score</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.employeeMetrics.map(emp => (
                        <tr key={emp.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                emp.githubConnection?.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                              <div>
                                <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-gray-500">{emp.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            {emp.githubConnection?.isActive ? (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Connected
                              </Badge>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="text-sm text-gray-600">
                              {emp.lastActive
                                ? formatDistance(new Date(emp.lastActive), new Date(), { addSuffix: true })
                                : 'Never'
                              }
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center">
                              <GitCommit className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="text-sm">{emp._count.repositories}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-sm">{emp._count.skillRecords}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center">
                              <span className="text-sm font-semibold">{emp.score}</span>
                              {emp.score > 100 && <TrendingUp className="w-3 h-3 ml-1 text-green-500" />}
                            </div>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sprint Velocity</CardTitle>
                  <CardDescription>Team delivery metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="w-16 h-16 text-gray-300" />
                    <p className="ml-4">Velocity chart will be here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                  <CardDescription>Team expertise overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      analytics.skillRecords.reduce((acc, record) => {
                        const category = record.skill.category
                        if (!acc[category]) acc[category] = 0
                        acc[category]++
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category}</span>
                          <span className="text-gray-500">{count} skills</span>
                        </div>
                        <Progress value={(count / analytics.skillRecords.length) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workload Tab */}
          <TabsContent value="workload">
            <Card>
              <CardHeader>
                <CardTitle>Team Workload Distribution</CardTitle>
                <CardDescription>Current work allocation across the team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>Workload distribution coming soon</p>
                  <p className="text-sm mt-2">Will integrate with Jira/Linear for task tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>Smart recommendations based on team data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.needsAttention.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Performance Alert</AlertTitle>
                      <AlertDescription>
                        {analytics.needsAttention.length} team member(s) haven't been active in 3+ days.
                        Consider checking in or redistributing work.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert className="border-blue-200 bg-blue-50">
                    <Brain className="h-4 w-4" />
                    <AlertTitle>Optimization Opportunity</AlertTitle>
                    <AlertDescription>
                      Your team's velocity is {analytics.weekTrend === 'up' ? 'above' : 'below'} average.
                      Consider {analytics.weekTrend === 'up'
                        ? 'maintaining current practices and documenting successful patterns'
                        : 'scheduling a retrospective to identify blockers'
                      }.
                    </AlertDescription>
                  </Alert>

                  {analytics.connectionRate < 100 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Zap className="h-4 w-4" />
                      <AlertTitle>Integration Gap</AlertTitle>
                      <AlertDescription>
                        {analytics.employees.length - analytics.connectedEmployees} team member(s) haven't connected GitHub.
                        This limits visibility into {Math.round(100 - analytics.connectionRate)}% of your team's work.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}
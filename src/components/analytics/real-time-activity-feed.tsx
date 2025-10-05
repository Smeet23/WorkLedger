"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  Code,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  FileCode,
  Bug,
  Sparkles
} from "lucide-react"
import { formatDistance } from 'date-fns'

interface Activity {
  id: string
  type: 'commit' | 'pr' | 'review' | 'ticket' | 'message' | 'merge' | 'deploy'
  employee: {
    name: string
    avatar?: string
    role: string
  }
  title: string
  description?: string
  timestamp: Date
  metadata?: {
    repository?: string
    branch?: string
    ticketId?: string
    language?: string
    linesAdded?: number
    linesRemoved?: number
    status?: 'success' | 'failed' | 'pending'
  }
}

interface RealTimeActivityFeedProps {
  companyId: string
  limit?: number
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'commit':
      return <GitCommit className="w-4 h-4" />
    case 'pr':
      return <GitPullRequest className="w-4 h-4" />
    case 'merge':
      return <GitMerge className="w-4 h-4" />
    case 'review':
      return <Code className="w-4 h-4" />
    case 'ticket':
      return <CheckCircle className="w-4 h-4" />
    case 'message':
      return <MessageSquare className="w-4 h-4" />
    case 'deploy':
      return <Zap className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'commit':
      return 'text-blue-600 bg-blue-100'
    case 'pr':
      return 'text-purple-600 bg-purple-100'
    case 'merge':
      return 'text-green-600 bg-green-100'
    case 'review':
      return 'text-orange-600 bg-orange-100'
    case 'ticket':
      return 'text-cyan-600 bg-cyan-100'
    case 'message':
      return 'text-gray-600 bg-gray-100'
    case 'deploy':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function RealTimeActivityFeed({ companyId, limit = 20 }: RealTimeActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(true)

  // Fetch initial activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/analytics/activities?companyId=${companyId}&limit=${limit}`)
        const data = await response.json()
        setActivities(data.activities || [])
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()

    // Set up polling for real-time updates (in production, use WebSocket or SSE)
    const interval = setInterval(fetchActivities, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [companyId, limit])

  // Simulate real-time activity (for demo purposes)
  useEffect(() => {
    if (!isLive) return

    const simulateActivity = () => {
      const mockActivities: Partial<Activity>[] = [
        {
          type: 'commit',
          employee: { name: 'John Doe', role: 'Senior Developer' },
          title: 'feat: Add user authentication',
          description: 'Implemented JWT-based auth system',
          metadata: { repository: 'workledger-app', linesAdded: 245, linesRemoved: 32 }
        },
        {
          type: 'pr',
          employee: { name: 'Sarah Chen', role: 'Frontend Engineer' },
          title: 'PR #124: Update dashboard UI',
          metadata: { repository: 'workledger-app', branch: 'feature/dashboard-v2' }
        },
        {
          type: 'ticket',
          employee: { name: 'Mike Wilson', role: 'Backend Developer' },
          title: 'Resolved: API performance issue',
          metadata: { ticketId: 'WORK-456', status: 'success' }
        },
        {
          type: 'review',
          employee: { name: 'Lisa Anderson', role: 'Tech Lead' },
          title: 'Code review on PR #123',
          description: 'Approved with suggestions',
          metadata: { repository: 'workledger-api' }
        },
        {
          type: 'merge',
          employee: { name: 'Tom Baker', role: 'DevOps Engineer' },
          title: 'Merged feature/oauth to main',
          metadata: { repository: 'workledger-app', status: 'success' }
        }
      ]

      const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)]
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        timestamp: new Date(),
        ...randomActivity
      } as Activity

      setActivities(prev => [newActivity, ...prev].slice(0, limit))
    }

    const interval = setInterval(simulateActivity, 8000) // Add new activity every 8 seconds
    return () => clearInterval(interval)
  }, [isLive, limit])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Activity Feed</CardTitle>
            <CardDescription>Real-time team activities across all platforms</CardDescription>
          </div>
          <Badge variant={isLive ? "default" : "secondary"} className="animate-pulse">
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </>
            ) : (
              'PAUSED'
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No recent activities</p>
                <p className="text-xs text-gray-400 mt-1">Activities will appear here as they happen</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 ${
                    index === 0 ? 'animate-slide-in-from-top' : ''
                  }`}
                >
                  {/* Activity Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    getActivityColor(activity.type)
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Employee Info */}
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={activity.employee.avatar} />
                            <AvatarFallback className="text-xs">
                              {activity.employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {activity.employee.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {activity.employee.role}
                          </span>
                        </div>

                        {/* Activity Title */}
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.title}
                        </p>

                        {/* Activity Description */}
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {activity.description}
                          </p>
                        )}

                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="flex items-center space-x-3 mt-2">
                            {activity.metadata.repository && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <FileCode className="w-3 h-3 mr-1" />
                                {activity.metadata.repository}
                              </span>
                            )}
                            {activity.metadata.branch && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <GitMerge className="w-3 h-3 mr-1" />
                                {activity.metadata.branch}
                              </span>
                            )}
                            {activity.metadata.ticketId && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.ticketId}
                              </Badge>
                            )}
                            {activity.metadata.linesAdded && (
                              <span className="inline-flex items-center text-xs">
                                <span className="text-green-600">+{activity.metadata.linesAdded}</span>
                                {activity.metadata.linesRemoved && (
                                  <span className="text-red-600 ml-1">-{activity.metadata.linesRemoved}</span>
                                )}
                              </span>
                            )}
                            {activity.metadata.status && (
                              <Badge
                                variant={
                                  activity.metadata.status === 'success' ? 'default' :
                                  activity.metadata.status === 'failed' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {activity.metadata.status}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Activity Summary */}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Showing {activities.length} recent activities</span>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3" />
                <span>Auto-updating every 5 seconds</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Add animation styles
const styles = `
@keyframes slide-in-from-top {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in-from-top {
  animation: slide-in-from-top 0.3s ease-out;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
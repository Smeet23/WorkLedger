'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MessageSquare, Users, Hash, RefreshCw, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SlackStatus {
  connected: boolean
  workspace: {
    teamId: string
    teamName: string
    teamDomain?: string
    icon?: string
  } | null
  stats: {
    users: number
    channels: number
    messages: number
  }
  lastSync: string | null
  createdAt: string
}

export function SlackIntegrationCard() {
  const [status, setStatus] = useState<SlackStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/slack/status')
      const data = await response.json()

      if (response.ok) {
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch Slack status:', error)
      toast.error('Failed to load Slack status')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/slack/connect'
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/slack/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Slack workspace synced successfully!')
        await fetchStatus()
      } else {
        toast.error(data.error || 'Failed to sync Slack workspace')
      }
    } catch (error) {
      console.error('Failed to sync Slack:', error)
      toast.error('Failed to sync Slack workspace')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack? This will stop tracking workspace activity.')) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/slack/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Slack workspace disconnected')
        await fetchStatus()
      } else {
        toast.error(data.error || 'Failed to disconnect Slack')
      }
    } catch (error) {
      console.error('Failed to disconnect Slack:', error)
      toast.error('Failed to disconnect Slack')
    } finally {
      setDisconnecting(false)
    }
  }

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never'

    const date = new Date(lastSync)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>
                Track team communication and collaboration patterns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Slack workspace to automatically track:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Channel activity and message volume
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Team member communication patterns
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Response times and availability
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Collaboration insights
              </li>
            </ul>
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>Privacy: We aggregate data by hour. Message content is never stored.</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleConnect} className="w-full bg-purple-600 hover:bg-purple-700">
            <MessageSquare className="mr-2 h-4 w-4" />
            Connect Slack Workspace
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{status.workspace?.teamName}</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <CardDescription>
                {status.workspace?.teamDomain && `@${status.workspace.teamDomain}`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </div>
              <p className="text-2xl font-bold">{status.stats.users.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Channels</span>
              </div>
              <p className="text-2xl font-bold">{status.stats.channels.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </div>
              <p className="text-2xl font-bold">{status.stats.messages.toLocaleString()}</p>
            </div>
          </div>

          {/* Last Sync */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last synced</span>
              <span className="font-medium">{formatLastSync(status.lastSync)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          className="flex-1"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {disconnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Disconnect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SlackIntegrationCard

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, GitlabIcon as GitLab, CheckCircle, XCircle, RefreshCw, Unplug } from 'lucide-react'

interface GitLabIntegrationCardProps {
  employeeId?: string
  compact?: boolean
}

export function GitLabIntegrationCard({ employeeId, compact = false }: GitLabIntegrationCardProps) {
  const [loading, setLoading] = useState(true)
  const [syncing, setsyncing] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gitlab/status')
      const data = await response.json()

      if (data.success) {
        setStatus(data.data)
        setError(null)
      } else {
        setError(data.error?.message || 'Failed to fetch status')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gitlab/connect')
      const data = await response.json()

      if (data.success && data.data.authUrl) {
        // Redirect to GitLab OAuth
        window.location.href = data.data.authUrl
      } else {
        setError('Failed to initiate GitLab connection')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setsyncing(true)
      const response = await fetch('/api/gitlab/sync', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        alert(`Sync completed! Detected ${data.data.skillsDetected} skills.`)
        await fetchStatus()
      } else {
        setError(data.error?.message || 'Sync failed')
      }
    } catch (err) {
      setError('Failed to sync')
    } finally {
      setsyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitLab? Your skill data will be preserved.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/gitlab/disconnect', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        await fetchStatus()
      } else {
        setError(data.error?.message || 'Failed to disconnect')
      }
    } catch (err) {
      setError('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitLab className="h-6 w-6 text-orange-500" />
            <div>
              <CardTitle>GitLab</CardTitle>
              <CardDescription>
                {status?.connected
                  ? 'Connected and syncing your projects'
                  : 'Connect to track skills from GitLab'}
              </CardDescription>
            </div>
          </div>
          {status?.connected && (
            <Badge variant={status.integration?.isActive ? 'default' : 'secondary'}>
              {status.integration?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status?.connected ? (
          <>
            {status.integration?.user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {status.integration.user.avatarUrl && (
                  <img
                    src={status.integration.user.avatarUrl}
                    alt={status.integration.user.username}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{status.integration.user.name}</p>
                  <p className="text-sm text-gray-500">@{status.integration.user.username}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            )}

            {status.integration?.stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {status.integration.stats.skillsDetected || 0}
                  </p>
                  <p className="text-sm text-gray-600">Skills Detected</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Sync</p>
                  <p className="text-sm font-medium">
                    {status.integration.lastSync
                      ? new Date(status.integration.lastSync).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            )}

            {!compact && (
              <div className="text-sm text-gray-500 space-y-2">
                <p>✓ Project language detection</p>
                <p>✓ Framework identification</p>
                <p>✓ CI/CD pipeline analysis</p>
                <p>✓ Contribution tracking</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Connect your GitLab account to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Automatically detect skills from your projects</li>
              <li>Track programming languages and frameworks</li>
              <li>Analyze CI/CD configurations</li>
              <li>Monitor contribution activity</li>
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {status?.connected ? (
          <>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
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
              onClick={handleDisconnect}
              variant="destructive"
              disabled={loading}
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <GitLab className="mr-2 h-4 w-4" />
                Connect GitLab
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

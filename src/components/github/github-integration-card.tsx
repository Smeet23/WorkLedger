'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Github, Link2, Unlink, RefreshCw, CheckCircle, Code2, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface GitHubIntegrationCardProps {
  employeeId?: string
}

export function GitHubIntegrationCard({ employeeId }: GitHubIntegrationCardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isFullSyncing, setIsFullSyncing] = useState(false)
  const [connectionData, setConnectionData] = useState<any>(null)
  const [syncData, setSyncData] = useState<any>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    checkConnection()
    // Check if we just connected
    if (searchParams.get('github') === 'connected') {
      setIsConnected(true)
      // Trigger initial sync
      setTimeout(() => handleSync(), 1000)
    }
  }, [searchParams])

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github/status')
      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.connected)
        setConnectionData(data.connection)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to check GitHub connection:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = () => {
    // Redirect to GitHub OAuth
    window.location.href = '/api/github/connect'
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github/disconnect', {
        method: 'POST'
      })

      if (response.ok) {
        setIsConnected(false)
        setConnectionData(null)
        setSyncData(null)
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSyncData(data.data)

        // Refresh connection data
        await checkConnection()

        // Refresh the page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        console.error('Sync failed:', data.error)
        alert(data.error || 'Failed to sync repositories')
      }
    } catch (error) {
      console.error('Failed to sync GitHub:', error)
      alert('Failed to sync GitHub repositories. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFullSync = async () => {
    const confirmed = confirm(
      'Full Sync will fetch ALL your repositories and ALL commits.\n\n' +
      'This includes:\n' +
      '• All owned repositories (public and private)\n' +
      '• Organization repositories\n' +
      '• Repositories where you contributed\n' +
      '• ALL commits for each repository\n\n' +
      'This may take several minutes. Continue?'
    )

    if (!confirmed) return

    setIsFullSyncing(true)
    try {
      const response = await fetch('/api/github/sync-complete', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSyncData(data.data)
        alert(`Full Sync Complete!\n\n` +
              `✓ ${data.data?.totalRepos || 0} repositories\n` +
              `✓ ${data.data?.totalCommits || 0} commits\n` +
              `✓ ${data.data?.languages?.length || 0} languages detected`)

        // Refresh connection data
        await checkConnection()

        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.error('Full sync failed:', data.error)
        alert(data.error || 'Failed to complete full sync')
      }
    } catch (error) {
      console.error('Failed to complete full sync:', error)
      alert('Failed to complete full sync. Please try again.')
    } finally {
      setIsFullSyncing(false)
    }
  }

  if (isLoading && !connectionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to automatically track your development skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">What we track:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Programming languages used
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Frameworks and libraries
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Contribution patterns
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Project complexity
                </li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              className="w-full"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Connect GitHub Account
            </Button>

            <p className="text-xs text-gray-500 text-center">
              We only access public repository data and respect your privacy
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </CardTitle>
        </div>
        <CardDescription>
          {connectionData?.githubUsername && (
            <div className="flex items-center gap-2 mt-2">
              <Code2 className="w-4 h-4" />
              <span className="font-mono text-sm">@{connectionData.githubUsername}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectionData?.lastSync && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last synced:</span>
                <span className="text-sm font-medium">
                  {new Date(connectionData.lastSync).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {syncData && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncData.totalRepos || syncData.repositories || 0}
                  </div>
                  <div className="text-xs text-gray-600">Repositories</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {syncData.skillCount || syncData.totalSkills || 0}
                  </div>
                  <div className="text-xs text-gray-600">Skills</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {syncData.totalCommits || 0}
                  </div>
                  <div className="text-xs text-gray-600">Commits</div>
                </div>
              </div>
              {syncData.skills && syncData.skills.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    ✓ Successfully detected {syncData.skills.length} skills!
                  </p>
                  <p className="text-xs text-green-600">
                    Refreshing page to show updated skills...
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing || isFullSyncing}
              variant="outline"
              className="flex-1"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Quick Sync
                </>
              )}
            </Button>
            <Button
              onClick={handleFullSync}
              disabled={isSyncing || isFullSyncing}
              variant="default"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isFullSyncing ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Full Syncing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Full Sync
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </div>

          {syncData?.languages && syncData.languages.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Detected Languages:</h4>
              <div className="flex flex-wrap gap-2">
                {syncData.languages.slice(0, 8).map((lang: string) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
                {syncData.languages.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{syncData.languages.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {syncData?.frameworks && syncData.frameworks.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Detected Frameworks:</h4>
              <div className="flex flex-wrap gap-2">
                {syncData.frameworks.map((framework: string) => (
                  <Badge key={framework} variant="secondary" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
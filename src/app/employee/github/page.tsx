'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Github, Link2, Unlink, RefreshCw, CheckCircle, Code2, Zap, AlertCircle, GitBranch, Star, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmployeeGitHubPage() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionData, setConnectionData] = useState<any>(null)
  const [syncData, setSyncData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

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
    // Use dedicated OAuth route for employees (not GitHub App)
    // Pass current page as returnUrl so user comes back here after OAuth
    window.location.href = '/api/github/oauth/connect?returnUrl=/employee/github'
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account? This will stop tracking your repositories and skills.')) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/github/disconnect', {
        method: 'POST'
      })

      if (response.ok) {
        setIsConnected(false)
        setConnectionData(null)
        setSyncData(null)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error)
      setError('Failed to disconnect GitHub. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSyncData(data.data)
        await checkConnection()

        // Show success message
        setTimeout(() => {
          router.refresh()
        }, 1500)
      } else {
        setError(data.error || 'Failed to sync repositories')
      }
    } catch (error) {
      console.error('Failed to sync GitHub:', error)
      setError('Failed to sync GitHub repositories. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading && !connectionData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-lg text-gray-500">Loading GitHub status...</span>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">GitHub Integration</h1>
          <p className="text-muted-foreground mt-2">Connect your GitHub account to track skills and repositories</p>
        </div>

        {/* GitHub App Conflict Warning */}
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Important: Remove GitHub App First</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">If you have the <strong>"workledger-skills"</strong> GitHub App installed, you must uninstall it first before connecting via OAuth.</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mb-2"
            >
              <a href="https://github.com/settings/installations" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Check GitHub App Installations
              </a>
            </Button>
            <p className="text-xs mt-2">If you see "workledger-skills" installed, click "Configure" → scroll down → click "Uninstall"</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Connect GitHub Account
            </CardTitle>
            <CardDescription>
              Automatically track your development skills and contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-sm">What we'll track:</h4>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">All Your Repositories</p>
                      <p className="text-xs text-gray-600">Owned, forked, contributed, and organization repos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Programming Languages & Skills</p>
                      <p className="text-xs text-gray-600">Detect languages, frameworks, and technologies you use</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Your Commits & Contributions</p>
                      <p className="text-xs text-gray-600">Track all your code contributions across repos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Skill Certificates</p>
                      <p className="text-xs text-gray-600">Generate verified certificates based on your work</p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Privacy & Permissions</AlertTitle>
                <AlertDescription className="text-sm">
                  We only read repository metadata and commit information. We never access your code content or make changes to your repositories.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnect}
                className="w-full"
                size="lg"
              >
                <Link2 className="w-5 h-5 mr-2" />
                Connect GitHub Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">GitHub Integration</h1>
        <p className="text-muted-foreground mt-2">Manage your GitHub connection and sync data</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Connection
              <Badge variant="default" className="bg-green-100 text-green-800 ml-2">
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
              <div className="bg-blue-50 rounded-lg p-4">
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
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Sync Successful!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your GitHub data has been updated.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {syncData.repositories || syncData.totalRepos || 0}
                    </div>
                    <div className="text-xs text-gray-600">Repositories</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {syncData.skillCount || 0}
                    </div>
                    <div className="text-xs text-gray-600">Skills</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {syncData.newRepos || 0}
                    </div>
                    <div className="text-xs text-gray-600">New Repos</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSync}
                disabled={isSyncing || isLoading}
                variant="default"
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
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleDisconnect}
                disabled={isLoading}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect GitHub
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              What's Being Synced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Owned, forked, and contributed repositories</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Organization repositories you have access to</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Repository languages, frameworks, and metadata</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Your commits and contributions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Click "Sync Now" to update your data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>View your repositories and skills</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Generate skill certificates</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GitHubInstallationStatus } from '@/components/github/installation-status'
import { EmployeeMatchingInterface } from '@/components/github/employee-matching'
import { RepositorySyncStatus } from '@/components/github/repository-sync'
import { SkillDetectionProgress } from '@/components/github/skill-detection-progress'
import { Github, CheckCircle, AlertCircle, Users, GitBranch, Code, Loader2 } from 'lucide-react'

export default function GitHubIntegrationPage() {
  const [loading, setLoading] = useState(true)
  const [installation, setInstallation] = useState<any>(null)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    discoveredEmployees: 0,
    unmatchedMembers: 0,
    syncedRepositories: 0,
    detectedSkills: 0
  })

  useEffect(() => {
    fetchInstallationStatus()
  }, [])

  const fetchInstallationStatus = async () => {
    try {
      const response = await fetch('/api/github/installation/status')
      const data = await response.json()

      if (data.success) {
        setInstallation(data.data.installation)
        setStats(data.data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch installation status:', error)
    } finally {
      setLoading(false)
    }
  }

  const initiateInstallation = () => {
    // Generate state token for security
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('github_install_state', state)

    // Redirect to GitHub App installation
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'workledger-skills'
    window.location.href = `https://github.com/apps/${appName}/installations/new?state=${state}`
  }

  const runAutoDiscovery = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/auto-discover', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        alert('Auto-discovery started successfully!')
        fetchInstallationStatus()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to start auto-discovery')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Github className="h-8 w-8" />
          GitHub Integration
        </h1>
        <p className="text-gray-600 mt-2">
          Connect your GitHub organization to automatically track employee skills
        </p>
      </div>

      {!installation ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect GitHub Organization</CardTitle>
            <CardDescription>
              Install the WorkLedger GitHub App to start automatic skill detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens when you connect:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automatically discover all organization members
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Track programming languages and frameworks used
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Generate skill profiles from code contributions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Privacy-first: Only approved data is shared
                </li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to GitHub to authorize the installation.
                Only organization owners can install GitHub Apps.
              </AlertDescription>
            </Alert>

            <Button
              onClick={initiateInstallation}
              size="lg"
              className="w-full"
            >
              <Github className="mr-2 h-5 w-5" />
              Install GitHub App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Installation Status Card */}
          <GitHubInstallationStatus
            installation={installation}
            onRefresh={fetchInstallationStatus}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Employees</p>
                    <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Discovered</p>
                    <p className="text-2xl font-bold">{stats.discoveredEmployees}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Repositories</p>
                    <p className="text-2xl font-bold">{stats.syncedRepositories}</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Skills Detected</p>
                    <p className="text-2xl font-bold">{stats.detectedSkills}</p>
                  </div>
                  <Code className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="matching" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="matching">Employee Matching</TabsTrigger>
              <TabsTrigger value="repositories">Repositories</TabsTrigger>
              <TabsTrigger value="skills">Skill Detection</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="matching" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Matching</CardTitle>
                  <CardDescription>
                    Match GitHub organization members to company employees
                  </CardDescription>
                  <div className="flex justify-end">
                    <Button onClick={runAutoDiscovery} disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Users className="mr-2 h-4 w-4" />
                      )}
                      Run Auto-Discovery
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <EmployeeMatchingInterface companyId={installation.companyId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repositories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Repository Sync Status</CardTitle>
                  <CardDescription>
                    Monitor synchronized repositories and their analysis status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RepositorySyncStatus companyId={installation.companyId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Detection Progress</CardTitle>
                  <CardDescription>
                    Track the progress of skill detection across your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SkillDetectionProgress companyId={installation.companyId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                  <CardDescription>
                    Configure GitHub integration settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Organization</h4>
                      <p className="text-sm text-gray-500">{installation.accountLogin}</p>
                    </div>
                    <Badge>{installation.repositorySelection === 'all' ? 'All Repos' : 'Selected Repos'}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Installation ID</h4>
                      <p className="text-sm text-gray-500">{installation.installationId}</p>
                    </div>
                    <Badge variant={installation.isActive ? 'default' : 'secondary'}>
                      {installation.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full">
                      Disconnect GitHub Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
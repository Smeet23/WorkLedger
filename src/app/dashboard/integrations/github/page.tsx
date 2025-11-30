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
import { useToast } from '@/components/ui/use-toast'

interface GitHubInstallation {
  id: string
  companyId: string
  installationId: string
  accountLogin: string
  accountType: string
  repositorySelection: string
  isActive: boolean
  installedAt: string
  updatedAt: string
  permissions: Record<string, string>
  events: string[]
}

export default function GitHubIntegrationPage() {
  const [loading, setLoading] = useState(true)
  const [installation, setInstallation] = useState<GitHubInstallation | null>(null)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    discoveredEmployees: 0,
    unmatchedMembers: 0,
    syncedRepositories: 0,
    detectedSkills: 0
  })

  useEffect(() => {
    // Check if user just completed installation
    const urlParams = new URLSearchParams(window.location.search)
    const justInstalled = urlParams.get('installed') === 'true'

    if (justInstalled) {
      // Show syncing state and retry fetching status
      setSyncing(true)
      fetchInstallationStatusWithRetry()
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard/integrations/github')
    } else {
      fetchInstallationStatus()
    }
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

  const fetchInstallationStatusWithRetry = async (retries = 5, delay = 1000) => {
    try {
      const response = await fetch('/api/github/installation/status')
      const data = await response.json()

      if (data.success && data.data.installation) {
        // Installation found!
        setInstallation(data.data.installation)
        setStats(data.data.stats || stats)
        setSyncing(false)
        setLoading(false)
      } else if (retries > 0) {
        // Retry after delay
        setTimeout(() => {
          fetchInstallationStatusWithRetry(retries - 1, delay * 1.5)
        }, delay)
      } else {
        // Max retries reached, still not found
        console.error('Installation not found after retries')
        setSyncing(false)
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch installation status:', error)
      if (retries > 0) {
        setTimeout(() => {
          fetchInstallationStatusWithRetry(retries - 1, delay * 1.5)
        }, delay)
      } else {
        setSyncing(false)
        setLoading(false)
      }
    }
  }

  const initiateInstallation = () => {
    // Redirect to GitHub App installation
    // The callback will be handled by the Setup URL configured in GitHub App settings
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'workledger'
    window.location.href = `https://github.com/apps/${appName}/installations/new`
  }

  const runAutoDiscovery = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/auto-discover', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Auto-discovery started",
          description: "Discovering organization members...",
        })
        fetchInstallationStatus()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start auto-discovery",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {syncing ? 'Syncing GitHub installation...' : 'Loading integration...'}
          </p>
          {syncing && (
            <p className="text-xs text-slate-500 max-w-md text-center">
              We're fetching your GitHub organization data. This may take a few moments.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-pulse" />
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Integrations
            </span>
          </div>
          <h1 className="text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.1] flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl blur-lg opacity-50" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-500/30">
                <Github className="h-7 w-7 text-white" />
              </div>
            </div>
            GitHub Integration
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Connect your GitHub organization to automatically track employee skills
          </p>
        </div>

      {!installation ? (
        <div className="group relative max-w-3xl mx-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-700/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/50">
                  <Github className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Connect GitHub Organization</CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Install the WorkLedger GitHub App to start automatic skill detection
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur" />
                <div className="relative bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 p-6 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg">What happens when you connect:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200/50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Automatically discover all organization members</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200/50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Track programming languages and frameworks used</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200/50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Generate skill profiles from code contributions</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200/50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Privacy-first: Only approved data is shared</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Alert className="border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 border border-amber-200/50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <AlertDescription className="text-slate-700 font-medium">
                  You'll be redirected to GitHub to authorize the installation.
                  Only organization owners can install GitHub Apps.
                </AlertDescription>
              </Alert>

              <Button
                onClick={initiateInstallation}
                size="lg"
                className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
              >
                <Github className="mr-2 h-5 w-5" />
                Install GitHub App
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Installation Status Card */}
          <GitHubInstallationStatus
            installation={installation}
            onRefresh={fetchInstallationStatus}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Total Employees</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Discovered</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.discoveredEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                      <GitBranch className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Repositories</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.syncedRepositories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Code className="h-7 w-7 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Skills Detected</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.detectedSkills}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">Employee Matching</CardTitle>
                          <CardDescription className="text-slate-600 mt-1">
                            Match GitHub organization members to company employees
                          </CardDescription>
                        </div>
                      </div>
                      <Button onClick={runAutoDiscovery} disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30">
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
              </div>
            </TabsContent>

            <TabsContent value="repositories" className="space-y-4">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                        <GitBranch className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Repository Sync Status</CardTitle>
                        <CardDescription className="text-slate-600 mt-1">
                          Monitor synchronized repositories and their analysis status
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RepositorySyncStatus companyId={installation.companyId} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-200/50">
                        <Code className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Skill Detection Progress</CardTitle>
                        <CardDescription className="text-slate-600 mt-1">
                          Track the progress of skill detection across your organization
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SkillDetectionProgress companyId={installation.companyId} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-700/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/50">
                        <Github className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Integration Settings</CardTitle>
                        <CardDescription className="text-slate-600 mt-1">
                          Configure GitHub integration settings
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm">
                      <div>
                        <h4 className="font-semibold text-slate-900">Organization</h4>
                        <p className="text-sm text-slate-600 mt-1 font-medium">{installation.accountLogin}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">{installation.repositorySelection === 'all' ? 'All Repos' : 'Selected Repos'}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm">
                      <div>
                        <h4 className="font-semibold text-slate-900">Installation ID</h4>
                        <p className="text-sm text-slate-600 mt-1 font-medium">{installation.installationId}</p>
                      </div>
                      <Badge variant={installation.isActive ? 'default' : 'secondary'}>
                        {installation.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <Button variant="destructive" className="w-full h-12 font-semibold">
                        Disconnect GitHub Integration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
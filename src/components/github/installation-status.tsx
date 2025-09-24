'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Github, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react'

interface GitHubInstallationStatusProps {
  installation: {
    id: string
    installationId: string
    accountLogin: string
    accountType: string
    repositorySelection: string
    isActive: boolean
    installedAt: string
    updatedAt: string
    permissions: any
    events: string[]
  } | null
  onRefresh: () => void
}

export function GitHubInstallationStatus({ installation, onRefresh }: GitHubInstallationStatusProps) {
  if (!installation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-lg font-semibold">No GitHub Installation Found</p>
            <p className="text-sm text-gray-500 mt-2">
              Please install the GitHub App to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Installation Status
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Organization</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{installation.accountLogin}</span>
                <Badge variant="outline" className="text-xs">
                  {installation.accountType}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              {installation.isActive ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Repository Access</span>
              <Badge variant="secondary">
                {installation.repositorySelection === 'all' ? 'All Repositories' : 'Selected'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Installed</span>
              <span className="text-sm">
                {new Date(installation.installedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Last Updated</span>
              <span className="text-sm">
                {new Date(installation.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Installation ID</span>
              <span className="text-sm font-mono">{installation.installationId}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(installation.permissions || {}).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Webhook Events</h4>
          <div className="flex flex-wrap gap-2">
            {installation.events.map(event => (
              <Badge key={event} variant="secondary" className="text-xs">
                {event}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage on GitHub
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
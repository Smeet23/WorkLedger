'use client'

import { useState, useEffect } from 'react'
import { GitLabIntegrationCard } from '@/components/gitlab/gitlab-integration-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GitlabIcon as GitLab, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function GitLabIntegrationPage() {
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    // Check for URL parameters (success/error from OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success) {
      setMessage({
        type: 'success',
        text: 'GitLab connected successfully! Your projects are being analyzed.',
      })
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      let errorText = 'Failed to connect GitLab'
      if (error === 'unauthorized') errorText = 'You must be signed in to connect GitLab'
      if (error === 'employee_not_found') errorText = 'Employee profile not found'
      if (error === 'connection_failed') errorText = 'Connection to GitLab failed'

      setMessage({
        type: 'error',
        text: errorText,
      })
      // Clear URL parameters
      window.location.search = new URLSearchParams(window.location.pathname)
    }
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <GitLab className="h-8 w-8 text-orange-500" />
          GitLab Integration
        </h1>
        <p className="text-gray-600">
          Connect your GitLab account to automatically track skills and contributions
        </p>
      </div>

      {/* Status Messages */}
      {message && (
        <Alert
          variant={message.type === 'error' ? 'destructive' : 'default'}
          className="mb-6"
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Main Integration Card */}
      <div className="mb-6">
        <GitLabIntegrationCard />
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Gets Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Programming languages used in your projects</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Frameworks and libraries (React, Django, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>DevOps tools (Docker, Kubernetes, CI/CD)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Code contributions and activity</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>We only access project metadata, not source code</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Your credentials are encrypted and never shared</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>You control what data appears on your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Disconnect anytime without losing historical data</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How GitLab Integration Works</CardTitle>
          <CardDescription>
            Automated skill tracking from your GitLab activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Connect Your Account</h4>
                <p className="text-sm text-gray-600">
                  Authorize WorkLedger to access your GitLab profile and project metadata
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Automatic Analysis</h4>
                <p className="text-sm text-gray-600">
                  We analyze your projects to detect programming languages, frameworks, and DevOps tools
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Skill Profile Updates</h4>
                <p className="text-sm text-gray-600">
                  Your skill profile is automatically updated with detected skills and proficiency levels
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Continuous Sync</h4>
                <p className="text-sm text-gray-600">
                  Skills are kept up-to-date as you work on projects and push code
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

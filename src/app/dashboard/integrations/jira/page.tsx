'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface JiraStatus {
  connected: boolean
  site: {
    cloudId: string
    name: string
    url: string
  } | null
  stats?: {
    projects: number
    users: number
    issues: number
    completedIssues: number
  }
  lastSync: string | null
  createdAt?: string
}

export default function JiraIntegrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<JiraStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [registeringWebhook, setRegisteringWebhook] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check for success/error in URL params
  useEffect(() => {
    const successParam = searchParams?.get('success')
    const errorParam = searchParams?.get('error')

    if (successParam === 'true') {
      setSuccess(true)
      // Clear URL params
      router.replace('/dashboard/integrations/jira')
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams, router])

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jira/status')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
      }

      setStatus(data)
    } catch (err) {
      console.error('Error fetching Jira status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/jira/connect'
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)

      const response = await fetch('/api/jira/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setSuccess(true)
      await fetchStatus() // Refresh status
    } catch (err) {
      console.error('Error syncing:', err)
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleRegisterWebhook = async () => {
    try {
      setRegisteringWebhook(true)
      setError(null)

      const response = await fetch('/api/jira/webhooks/manage', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Webhook registration failed')
      }

      setSuccess(true)
      const idsText = data.webhook.ids
        ? `\nWebhook IDs: ${data.webhook.ids.join(', ')}`
        : ''
      alert(`✅ Webhook registered successfully!\n\n${data.webhook.message}${idsText}\n\nJira will now send real-time updates to WorkLedger.`)
    } catch (err) {
      console.error('Error registering webhook:', err)
      setError(err instanceof Error ? err.message : 'Webhook registration failed')
    } finally {
      setRegisteringWebhook(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Jira? This will deactivate the integration.')) {
      return
    }

    try {
      const response = await fetch('/api/jira/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Disconnect failed')
      }

      await fetchStatus() // Refresh status
    } catch (err) {
      console.error('Error disconnecting:', err)
      setError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/integrations"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Integrations
        </Link>
        <h1 className="text-3xl font-bold">Jira Integration</h1>
        <p className="text-gray-600 mt-2">
          Connect your Jira workspace to track project management and task completion skills
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✓ Operation completed successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            ✗ {error}
          </p>
        </div>
      )}

      {/* Connection Status Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          {status?.connected ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Connected
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              Not Connected
            </span>
          )}
        </div>

        {status?.connected && status.site ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Jira Site</h3>
              <p className="text-lg font-medium">{status.site.name}</p>
              <a
                href={status.site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {status.site.url} →
              </a>
            </div>

            {status.lastSync && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Synced</h3>
                <p className="text-lg">{new Date(status.lastSync).toLocaleString()}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : '🔄 Sync Now'}
              </button>
              <button
                onClick={handleRegisterWebhook}
                disabled={registeringWebhook}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                title="Register webhook for real-time updates"
              >
                {registeringWebhook ? 'Registering...' : '🪝 Enable Webhooks'}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Connect your Jira workspace to start tracking project management skills
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Connect Jira Workspace
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {status?.connected && status.stats && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {status.stats.projects}
              </div>
              <div className="text-sm text-gray-600 mt-1">Projects</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {status.stats.users}
              </div>
              <div className="text-sm text-gray-600 mt-1">Users</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {status.stats.issues}
              </div>
              <div className="text-sm text-gray-600 mt-1">Issues</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {status.stats.completedIssues}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* What gets tracked */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">What gets tracked?</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">📋</span>
            <span><strong>Project Management:</strong> Issues created, assigned, and completed</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">⏱️</span>
            <span><strong>Time Tracking:</strong> Story points, time estimates, and actual time logged</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💬</span>
            <span><strong>Collaboration:</strong> Comments on issues and discussions</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📊</span>
            <span><strong>Quality Metrics:</strong> Resolution time, bug vs feature ratio</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🎯</span>
            <span><strong>Accuracy:</strong> Time estimation accuracy and task prioritization</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GitBranch, Code, Clock, CheckCircle, AlertCircle, RefreshCw, Loader2, Eye, GitCommit } from 'lucide-react'
import Link from 'next/link'

interface Repository {
  id: string
  name: string
  fullName: string
  isPrivate: boolean
  primaryLanguage: string | null
  languages: Record<string, number>
  lastActivityAt: string | null
  totalCommits: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  syncProgress: number
}

interface RepositorySyncStatusProps {
  companyId: string
}

export function RepositorySyncStatus({ companyId }: RepositorySyncStatusProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchRepositories()
    // Poll for updates every 10 seconds when syncing
    const interval = setInterval(() => {
      if (syncing) {
        fetchRepositories()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [companyId, syncing])

  const fetchRepositories = async () => {
    try {
      const response = await fetch(`/api/github/repositories?companyId=${companyId}`)
      const data = await response.json()

      if (data.success) {
        setRepositories(data.data)
        // Check if any repos are still syncing
        setSyncing(data.data.some((r: Repository) => r.syncStatus === 'syncing'))
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncRepository = async (repositoryId: string) => {
    try {
      const response = await fetch('/api/github/sync-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId, companyId })
      })

      const data = await response.json()
      if (data.success) {
        setSyncing(true)
        fetchRepositories()
      }
    } catch (error) {
      console.error('Failed to sync repository:', error)
    }
  }

  const syncAllRepositories = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/github/sync-all-repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })

      const data = await response.json()
      if (data.success) {
        fetchRepositories()
      }
    } catch (error) {
      console.error('Failed to sync all repositories:', error)
      setSyncing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Synced</Badge>
      case 'syncing':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-400',
      TypeScript: 'bg-blue-600',
      Python: 'bg-blue-400',
      Java: 'bg-red-500',
      Go: 'bg-cyan-600',
      Rust: 'bg-orange-600',
      Ruby: 'bg-red-600',
      PHP: 'bg-purple-500',
      'C++': 'bg-pink-500',
      'C#': 'bg-green-600',
      HTML: 'bg-orange-500',
      CSS: 'bg-blue-500',
    }
    return colors[language] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Tracking {repositories.length} repositories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRepositories}
            disabled={syncing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={syncAllRepositories}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4 mr-2" />
            )}
            Sync All Repositories
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Languages</TableHead>
              <TableHead>Commits</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map(repo => (
              <TableRow key={repo.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{repo.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {repo.isPrivate && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                        <span className="text-xs text-gray-500">{repo.fullName}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {repo.primaryLanguage ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.primaryLanguage)}`} />
                        <span className="text-sm">{repo.primaryLanguage}</span>
                      </div>
                      {Object.keys(repo.languages || {}).length > 1 && (
                        <div className="flex gap-1">
                          {Object.entries(repo.languages || {})
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([lang, percentage]) => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang} {Math.round(percentage)}%
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">No language detected</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-gray-400" />
                    <span>{repo.totalCommits || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {repo.lastActivityAt ? (
                    <span className="text-sm">
                      {new Date(repo.lastActivityAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {getStatusBadge(repo.syncStatus)}
                    {repo.syncStatus === 'syncing' && (
                      <Progress value={repo.syncProgress} className="w-20 h-2" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/company/repos/${repo.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        title="View commits and contributions"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncRepository(repo.id)}
                      disabled={repo.syncStatus === 'syncing' || syncing}
                      title="Resync repository"
                    >
                      <RefreshCw className={`h-4 w-4 ${repo.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {repositories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No repositories found. Run auto-discovery to find repositories.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
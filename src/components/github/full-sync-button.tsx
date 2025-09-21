'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function FullSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/github/sync-complete', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Full sync complete! Synced ${data.data?.totalRepos || 0} repositories with ${data.data?.totalCommits || 0} commits`)
        router.refresh()
      } else {
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to sync. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Full Sync'}
    </Button>
  )
}
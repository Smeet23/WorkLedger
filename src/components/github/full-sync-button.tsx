'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export function FullSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/github/sync-complete', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Full sync complete!",
          description: `Synced ${data.data?.totalRepos || 0} repositories with ${data.data?.totalCommits || 0} commits`,
        })
        router.refresh()
      } else {
        toast({
          title: "Sync failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Please try again.",
        variant: "destructive",
      })
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
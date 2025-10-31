'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle } from 'lucide-react'

interface ShareProfileProps {
  profileUrl: string
}

export function ShareProfile({ profileUrl }: ShareProfileProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={profileUrl}
        readOnly
        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <Button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-700 text-white">
        {copied ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  )
}
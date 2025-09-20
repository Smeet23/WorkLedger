"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CopyInvitationLinkProps {
  token: string
}

export function CopyInvitationLink({ token }: CopyInvitationLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const invitationUrl = `${window.location.origin}/auth/accept-invitation/${token}`
    navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1" />
          Copy Link
        </>
      )}
    </Button>
  )
}
"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  fallbackUrl?: string
  className?: string
}

function BackButtonInner({ fallbackUrl = "/", className }: BackButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get the "from" parameter if it exists
  const fromUrl = searchParams.get("from")

  const handleBack = () => {
    if (fromUrl) {
      // Navigate back to the page user came from
      router.push(fromUrl)
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      // Use browser history if available
      router.back()
    } else {
      // Fallback to default URL
      router.push(fallbackUrl)
    }
  }

  // Dynamic button text based on where user will go
  const buttonText = fromUrl
    ? "Back to Sign Up"
    : "Go Back"

  return (
    <Button variant="ghost" onClick={handleBack} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  )
}

export function BackButton(props: BackButtonProps) {
  return (
    <Suspense fallback={
      <Button variant="ghost" className={props.className}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>
    }>
      <BackButtonInner {...props} />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, ArrowLeft, BadgeCheck, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function VerifyCertificatePage() {
  const [verificationId, setVerificationId] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!verificationId.trim()) {
      setError("Please enter a verification code")
      return
    }

    // Navigate to the verification page
    router.push(`/verify/${verificationId.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                WorkLedger
              </span>
            </Link>
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <BadgeCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Certificate
              </h1>
              <p className="text-gray-600">
                Enter the verification code to check if a certificate is authentic
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="verificationId" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Input
                    id="verificationId"
                    type="text"
                    placeholder="e.g., abc123-def456-ghi789"
                    value={verificationId}
                    onChange={(e) => setVerificationId(e.target.value)}
                    className="pl-10 h-12"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-12">
                Verify Certificate
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Where to find the code?</h3>
              <p className="text-sm text-gray-600">
                The verification code can be found on the certificate itself, usually at the bottom or in the QR code. It's a unique identifier that looks like a series of letters and numbers.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Certificates are issued through WorkLedger's secure platform.
            <br />
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

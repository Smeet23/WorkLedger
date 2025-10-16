'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function GitHubSetupCompletePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const installationId = searchParams.get('installation_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">
          GitHub App Installed Successfully!
        </h1>

        <p className="mt-2 text-center text-gray-600">
          Your GitHub App has been installed and configured.
        </p>

        {installationId && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Installation ID:</span> {installationId}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>

          <p className="text-center text-sm text-gray-500">
            Redirecting in {countdown} seconds...
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-900">Next Steps:</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Sync your repositories</li>
            <li>Invite employees to connect their GitHub accounts</li>
            <li>View contribution analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

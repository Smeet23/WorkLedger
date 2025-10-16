'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function GitHubSetupErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">
          GitHub Installation Failed
        </h1>

        <p className="mt-2 text-center text-gray-600">
          {error || 'An error occurred while installing the GitHub App'}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Try Again
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900">Troubleshooting:</h3>
          <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Make sure you're logged in as a company admin</li>
            <li>Check that the GitHub App is installed on your account</li>
            <li>Verify your company exists in the database</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from "react"
import Link from "next/link"
import { SignInForm } from "@/components/forms/signin-form"

interface SearchParams {
  type?: 'company' | 'employee'
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const userType = searchParams.type || 'company'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            WorkLedger
          </Link>
          <p className="text-gray-600 mt-2">
            Welcome back to your skill certification platform
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm userType={userType} />
        </Suspense>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href={`/auth/signup?type=${userType}`}
              className="text-blue-600 hover:underline"
            >
              Sign up here
            </Link>
          </p>

          <div className="flex justify-center space-x-4 text-sm">
            <Link
              href="/auth/signin?type=company"
              className={`px-3 py-1 rounded ${
                userType === 'company'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Company Login
            </Link>
            <Link
              href="/auth/signin?type=employee"
              className={`px-3 py-1 rounded ${
                userType === 'employee'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Employee Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
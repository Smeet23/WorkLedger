import { Suspense } from "react"
import Link from "next/link"
import { SignUpForm } from "@/components/forms/signup-form"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SearchParams {
  type?: 'company' | 'employee'
}

export default function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const userType = searchParams.type || 'company'

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden gradient-bg-subtle">

      {/* Back Button - Minimal & Floating */}
      <div className="fixed top-6 left-6 z-50">
        <Button
          variant="ghost"
          asChild
          className="text-slate-600 hover:text-slate-900 hover:bg-white/80 backdrop-blur-sm transition-all duration-200"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back</span>
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-8">

          {/* Logo - Clean & Simple */}
          <Link href="/" className="group relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 shadow-lg shadow-indigo-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-indigo-500/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          </Link>

          {/* Heading - Perfect Typography */}
          <div className="text-center space-y-3 px-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {userType === 'company' ? 'Start free trial' : 'Join your team'}
            </h1>
            <p className="text-base text-slate-600 font-medium">
              {userType === 'company'
                ? 'Create your account in minutes'
                : 'Build your verified portfolio'}
            </p>
          </div>

          {/* Form card */}
          <Card className="w-full border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-md">
            <CardContent className="p-6">
              <div className="w-full">
                <Suspense fallback={
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                }>
                  <SignUpForm userType={userType} />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative w-full px-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs font-medium text-slate-400 bg-white">
                OR
              </span>
            </div>
          </div>

          {/* Sign In Link - Clean */}
          <div className="text-center px-4">
            <p className="text-sm text-slate-600 mb-3">
              Already have an account?
            </p>
            <Link
              href={`/auth/signin?type=${userType}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign in to your account
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>

          {/* User Type Toggle - Minimal Pills */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100">
            <Link
              href="/auth/signup?type=company"
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                userType === 'company'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company
            </Link>
            <Link
              href="/auth/signup?type=employee"
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                userType === 'employee'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employee
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

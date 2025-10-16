import { Suspense } from "react"
import Link from "next/link"
import { SignInForm } from "@/components/forms/signin-form"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Enhanced Background with Light Gradients */}

      {/* Base Gradient - Soft Blue to Purple */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30" />

      {/* Multiple Gradient Layers for Depth */}
      <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-blue-100/20 to-indigo-100/30" />
      <div className="fixed inset-0 bg-gradient-to-bl from-purple-100/20 via-transparent to-blue-100/20" />

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-transparent rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-300/40 via-purple-300/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-purple-300/20 via-blue-300/20 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Subtle Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)] opacity-20" />

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

      {/* Main Content - Perfectly Centered */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-10">

          {/* Logo - Clean & Simple */}
          <Link href="/" className="group relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-500/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          </Link>

          {/* Heading - Perfect Typography */}
          <div className="text-center space-y-3 px-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-base text-slate-600 font-medium">
              Sign in to access your {userType === 'company' ? 'team dashboard' : 'portfolio'}
            </p>
          </div>

          {/* Form - Floating, No Box */}
          <div className="w-full px-4">
            <Suspense fallback={
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            }>
              <SignInForm userType={userType} />
            </Suspense>
          </div>

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

          {/* Sign Up Link - Clean */}
          <div className="text-center px-4">
            <p className="text-sm text-slate-600 mb-3">
              New to WorkLedger?
            </p>
            <Link
              href={`/auth/signup?type=${userType}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Create an account
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>

          {/* User Type Toggle - Minimal Pills */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100">
            <Link
              href="/auth/signin?type=company"
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                userType === 'company'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company
            </Link>
            <Link
              href="/auth/signin?type=employee"
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

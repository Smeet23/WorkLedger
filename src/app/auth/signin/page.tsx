import { Suspense } from "react"
import Link from "next/link"
import { SignInForm } from "@/components/forms/signin-form"
import { Building2, ArrowLeft, Sparkles, Shield, Zap, TrendingUp, Award, Users } from "lucide-react"
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
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-50 via-transparent to-transparent opacity-40" />

      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="absolute top-8 left-8">
          <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back</span>
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-[440px] space-y-10 animate-slide-up">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 group-hover:scale-105 transition-transform">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                WorkLedger
              </span>
            </Link>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
                  {userType === 'company' ? 'Company Login' : 'Employee Login'}
                </span>
              </div>
              <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
                Welcome back
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Sign in to continue to your dashboard
              </p>
            </div>
          </div>

          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          }>
            <SignInForm userType={userType} />
          </Suspense>

          <div className="space-y-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500 font-medium">
                  New to WorkLedger?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={`/auth/signup?type=${userType}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                Create an account
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Link
                href="/auth/signin?type=company"
                className={`flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'company'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Company
              </Link>
              <Link
                href="/auth/signin?type=employee"
                className={`flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'employee'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Employee
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-blue-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-950 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-center p-16">
          <div className="max-w-lg space-y-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="h-1 w-1 bg-emerald-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm font-semibold text-white">10,000+ teams trust WorkLedger</span>
              </div>

              <div className="space-y-6">
                <h2 className="text-5xl font-bold leading-[1.08] text-white">
                  {userType === 'company'
                    ? 'Automated skill tracking for modern teams'
                    : 'Your verified professional achievements'}
                </h2>

                <p className="text-xl text-slate-300 leading-relaxed">
                  {userType === 'company'
                    ? 'Real-time analytics, verified certificates, and comprehensive team insights in one powerful platform.'
                    : 'Access your certificates, track your growth, and showcase your verified portfolio.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {userType === 'company' ? (
                <>
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Real-time Analytics</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Live skill matrices, growth trends, and team insights with beautiful dashboards.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Shield className="h-7 w-7 text-cyan-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Enterprise Security</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Bank-level encryption, SOC 2 compliance, and cryptographic verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Zap className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Automated Workflows</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Connect GitHub, GitLab, and Jira. Skills tracked automatically from real work.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Award className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Verified Certificates</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Company-verified credentials that employers can instantly authenticate.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="h-7 w-7 text-cyan-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Career Timeline</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Visualize your professional growth with a comprehensive timeline.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5 p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold text-lg text-white">Portable Portfolio</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Share your verified achievements with a professional portfolio.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

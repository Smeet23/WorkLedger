"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Users,
  Building2,
  Github,
  BarChart3,
  Lock,
  Sparkles,
  ChevronRight,
  Star,
  Trophy,
  Rocket,
  Eye,
  ClipboardCheck,
  DollarSign
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                WorkLedger
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                How it works?
              </Link>
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Reviews
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-sm">
                <Link href="/auth/signin?type=company">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full shadow-md hover:shadow-lg transition-all">
                <Link href="/auth/signup?type=company">
                  Try for Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - lighten and align with dashboard */}
      <section className="relative overflow-hidden gradient-bg-subtle pt-16 pb-20">
        {/* Product Hunt Badge */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-50 border border-orange-200">
              <Trophy className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">#1 Product for Team Development</span>
            </div>
          </div>
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Your team's growth,
              <br />
              <span className="text-gradient">in your hands.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Track your team's work activity, monitor performance, and gain insights into employee productivity and skills.
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/auth/signup?type=company">
                  Try for Free
                </Link>
              </Button>
            </div>

            {/* Phone Mockup - Placeholder */}
            <div className="pt-12 pb-8">
              <div className="relative mx-auto max-w-4xl">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-3xl blur-3xl opacity-50"></div>

                {/* Phone mockup containers */}
                <div className="relative flex items-center justify-center gap-6">
                  {/* Left Phone */}
                  <div className="hidden md:block relative w-64 h-[520px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-[-6deg] hover:rotate-[-3deg] transition-transform">
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] overflow-hidden">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-700">Dashboard</div>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-blue-100" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-24 bg-white rounded-2xl shadow-sm p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Code className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Skills Tracked</div>
                                <div className="text-2xl font-bold text-gray-900">47</div>
                              </div>
                            </div>
                          </div>
                          <div className="h-20 bg-white rounded-2xl shadow-sm" />
                          <div className="h-20 bg-white rounded-2xl shadow-sm" />
                        </div>
                      </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full"></div>
                  </div>

                  {/* Center/Main Phone */}
                  <div className="relative w-72 md:w-80 h-[580px] md:h-[640px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl z-10">
                    <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-[2.5rem] overflow-hidden">
                      <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Hi, Sarah!</div>
                            <div className="text-xl font-bold text-gray-900">Your Progress</div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            S
                          </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
                          <div className="text-sm opacity-90 mb-2">Total Value Earned</div>
                          <div className="text-4xl font-bold mb-4">€2,450</div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span>12 Certificates</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              <span>Expert Level</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Cards */}
                        <div className="space-y-3">
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                  <Github className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">GitHub Synced</div>
                                  <div className="text-xs text-gray-500">234 commits this month</div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">Skill Growth</div>
                                  <div className="text-xs text-gray-500">+15% this week</div>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-green-50 rounded-full">
                                <span className="text-xs font-semibold text-green-600">+15%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-full"></div>
                  </div>

                  {/* Right Phone */}
                  <div className="hidden md:block relative w-64 h-[520px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-[6deg] hover:rotate-[3deg] transition-transform">
                    <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2.5rem] overflow-hidden">
                      <div className="p-6 space-y-4">
                        <div className="text-sm font-semibold text-gray-700 mb-4">Certificates</div>
                        <div className="space-y-3">
                          <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Award className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-gray-900">React Expert</div>
                                <div className="text-xs text-gray-500">Issued Jan 2025</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Award className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-gray-900">TypeScript Pro</div>
                                <div className="text-xs text-gray-500">Issued Dec 2024</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center mb-8">
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-6">TRUSTED BY OVER</div>
            <div className="text-5xl font-bold text-gray-900 mb-12">+5,000 Teams</div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                  K
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Kristina</div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Loving this app, thanks! What sealed the deal for a 5 star was adding the fast, easy skill tracking. The best bit is after connecting GitHub, everything loads instantly - no faffing about with manual input.
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Alberto Lenzi</div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                WorkLedger showed me exactly what skills my team has and how they're growing! People don't know that tracking development this way is so educational. Seeing the verified certificates was eye-opening.
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Penny Parker</div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Basically free professional development tracking. I can finally monetize my learning and get something tangible back for my growth. The certificates are actually valuable!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Illustrated */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* First Value Prop */}
          <div className="max-w-5xl mx-auto mb-32">
            <div className="text-center mb-12">
              {/* Cute illustration placeholder - Using shapes */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-pink-300 rounded-3xl transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                        <DollarSign className="w-12 h-12 text-pink-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Your team's skills are worth tracking.
              </h2>
              <p className="text-xl text-gray-600 mb-2">
                Your employees' growth is valuable.
              </p>
              <p className="text-xl text-gray-600">
                It's happening every day and you have no record of it. €0.
              </p>
            </div>
          </div>

          {/* Second Value Prop */}
          <div className="max-w-5xl mx-auto mb-24">
            <div className="text-center mb-12">
              {/* Cute illustration placeholder */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full animate-pulse" style={{ animationDuration: '2s' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Trophy className="w-14 h-14 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Get your team the recognition they deserve.
              </h2>
              <p className="text-xl text-gray-600 mb-2">
                Generate verified certificates weekly.
              </p>
              <p className="text-xl text-gray-600">
                Give professional value back to your employees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect your team's data, start tracking growth.
            </p>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The more you track, the more insights you gain.
            </p>
          </div>

          {/* Decorative mockup - Earnings card */}
          <div className="flex justify-center mb-20">
            <div className="relative">
              {/* Floating dots background */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-12 gap-4">
                  {[...Array(60)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full"></div>
                  ))}
                </div>
              </div>

              {/* Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md">
                <div className="text-sm text-gray-500 mb-2">Total impact earned by your team</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                  €12,450
                </div>
                <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                  <div className="w-full px-6">
                    {/* Simple wavy chart illustration */}
                    <svg className="w-full h-20" viewBox="0 0 300 80" fill="none">
                      <path
                        d="M0 40 Q 50 20, 100 40 T 200 40 T 300 20"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1: Connect */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <Eye className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect your team's GitHub, GitLab, and other tools. The more you connect, the more complete the picture.
                </p>
              </div>

              {/* Step 2: Learn */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <ClipboardCheck className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Learn</h3>
                <p className="text-gray-600 leading-relaxed">
                  Discover and track your team's skill development patterns. Gain insights into growth trajectories and training needs.
                </p>
              </div>

              {/* Step 3: Certify */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Certify</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate verified certificates for your team members. Give them portable credentials that boost morale and retention.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Link href="/auth/signup?type=company">
                Try for Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security/Trust Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your team's information
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              is always safe
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Privacy First */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">Privacy-first</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                We don't reveal your team's personal data to any third parties. Ever.
              </p>
            </div>

            {/* Data Encryption */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">Encrypted storage</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Your data is stored with enterprise-grade encryption and multi-layered security.
              </p>
            </div>

            {/* Secure Pipelines */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">Secure pipelines</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Your data is always secured through end-to-end encryption in transit and at rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
              Frequently asked
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
              questions
            </h2>

            {/* Cute illustration */}
            <div className="flex justify-center mb-12">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-300 rounded-3xl transform -rotate-6 animate-pulse flex items-center justify-center" style={{ animationDuration: '3s' }}>
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">❓</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "What data does WorkLedger track?",
                "How does skill detection work?",
                "How can I verify certificates?",
                "Can employees export their certificates?",
                "How do I integrate with GitHub?",
                "Is WorkLedger suitable for remote teams?"
              ].map((question) => (
                <div key={question} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - light panel matching dashboard cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-card text-card-foreground shadow-md p-10 text-center card-hover">
            <div className="space-y-4">
              <h2 className="text-xl text-muted-foreground font-medium">Get started</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-foreground">Your team's growth, in your hands.</h3>
              <div className="pt-2">
                <Button asChild size="lg" className="h-12 px-8 text-base">
                  <Link href="/auth/signup?type=company">Try for Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  WorkLedger
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Your team's growth, verified and tracked.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How it works?</Link></li>
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">About us</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">GitHub Integration</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Certificate Generation</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Team Analytics</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQs</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Terms of Privacy</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact us</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-sm text-gray-500">
            © 2025 WorkLedger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function Code({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

"use client"

import Link from "next/link"
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
  ChevronRight
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                WorkLedger
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin?type=company">Sign In</Link>
              </Button>
              <Button asChild className="shadow-sm">
                <Link href="/auth/signup?type=company">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-slide-down">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Enterprise Skill Certification Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Transform Employee Growth
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Into Verified Achievements
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "100ms" }}>
              Automatically track skill development, generate cryptographically verified certificates,
              and empower your team with portable career credentials.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Button asChild size="lg" className="text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                <Link href="/auth/signup?type=company">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
                <Link href="/auth/signin?type=company">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>SOC 2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <span>Instant deployment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to track
              <br />
              <span className="text-gradient">team excellence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern teams who value growth, transparency, and verified achievements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature Cards */}
            {[
              {
                icon: Github,
                title: "Automated Skill Tracking",
                description: "Connect GitHub, GitLab, and more. We automatically detect skills from real work.",
                color: "bg-gray-900"
              },
              {
                icon: Award,
                title: "Verified Certificates",
                description: "Generate cryptographically signed certificates that are tamper-proof and verifiable.",
                color: "bg-primary"
              },
              {
                icon: BarChart3,
                title: "Team Analytics",
                description: "Comprehensive skill matrix, performance insights, and training ROI metrics.",
                color: "bg-purple-600"
              },
              {
                icon: Lock,
                title: "Privacy Controls",
                description: "Granular control over what data gets shared. Your team's privacy is paramount.",
                color: "bg-green-600"
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Built for teams of all sizes. Invite unlimited members, organize by departments.",
                color: "bg-orange-600"
              },
              {
                icon: TrendingUp,
                title: "Career Growth",
                description: "Track progression over time. Show employees their journey and future potential.",
                color: "bg-blue-600"
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-8 bg-white border border-border rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Companies & Employees Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* For Companies */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white p-10 rounded-2xl border border-border shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">For Companies</h3>
                    <p className="text-sm text-muted-foreground">Scale your team's growth</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Track employee skill development, automate performance insights,
                  and issue verified certificates that boost team morale and retention.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Automated skill tracking from GitHub & GitLab",
                    "Real-time team skill matrix & analytics",
                    "Privacy-first data controls",
                    "Cryptographically verified certificates",
                    "ROI tracking for L&D programs"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full h-12 text-base shadow-md hover:shadow-lg interactive">
                  <Link href="/auth/signup?type=company">
                    Get Started for Companies
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* For Employees */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-success to-success/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white p-10 rounded-2xl border border-border shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <Award className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">For Employees</h3>
                    <p className="text-sm text-muted-foreground">Own your career story</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Receive verified certificates showcasing your professional growth
                  and achievements. Build a portfolio that speaks for itself.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Company-verified skill certificates",
                    "Professional growth timeline",
                    "Portable career credentials",
                    "Privacy-protected sharing",
                    "Public portfolio builder"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" className="w-full h-12 text-base border-2 hover:bg-success/5 interactive">
                  <Link href="/auth/signup?type=employee">
                    Join Your Team
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your team?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join leading companies using WorkLedger to track growth and verify achievements.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-base px-8 h-12 shadow-xl hover:shadow-2xl">
                <Link href="/auth/signup?type=company">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 border-2 border-primary-foreground/20 text-primary-foreground hover:bg-white/10">
                <Link href="/auth/signin?type=company">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">WorkLedger</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 WorkLedger. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">WorkLedger</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works?</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#testimonials" className="hover:text-foreground transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin?type=company">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup?type=company">Try for Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}


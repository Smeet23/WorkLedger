"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  userRole: "company_admin" | "employee"
  user?: {
    firstName: string
    lastName: string
    email?: string
  }
  showBreadcrumbs?: boolean
  className?: string
}

export function AppShell({
  children,
  userRole,
  user,
  showBreadcrumbs = true,
  className
}: AppShellProps) {
  // Persist sidebar collapse state in localStorage
  // Start with false for SSR/client hydration match, then sync from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  
  // Load from localStorage after mount (client-side only)
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved === "true") {
      setSidebarCollapsed(true)
    }
  }, [])
  
  // Update localStorage when sidebar state changes
  React.useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])
  
  const pathname = usePathname()

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <Header user={user} showBreadcrumbs={showBreadcrumbs} userRole={userRole} />

        <main className={cn("flex-1", className)}>
          {/* Global back link for nested dashboard/employee/company pages (aligned with content) */}
          {((pathname?.startsWith("/dashboard") && pathname !== "/dashboard") ||
            (pathname?.startsWith("/employee") && pathname !== "/employee") ||
            (pathname?.startsWith("/company") && pathname !== "/company")) && (
            <div className="container mx-auto px-6 pt-4">
              <Link
                href={pathname.startsWith("/employee") ? "/employee" : 
                      pathname.startsWith("/company") ? "/dashboard" : "/dashboard"}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to {pathname.startsWith("/employee") ? "Overview" : "Dashboard"}
              </Link>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

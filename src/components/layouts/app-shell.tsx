"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"

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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

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
          {children}
        </main>
      </div>
    </div>
  )
}

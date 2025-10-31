"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Search,
  ChevronRight,
  LogOut,
  User,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email?: string
  }
  showBreadcrumbs?: boolean
  userRole?: "company_admin" | "employee"
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  // Special case: /company/settings should show "Dashboard > Settings"
  if (pathname === "/company/settings") {
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
    })
    breadcrumbs.push({
      label: "Settings",
      href: "/company/settings",
    })
    return breadcrumbs
  }

  // Special case: /employee/profile/edit should show "Employee Portal > Profile Settings"
  if (pathname === "/employee/profile/edit") {
    breadcrumbs.push({
      label: "Employee Portal",
      href: "/employee",
    })
    breadcrumbs.push({
      label: "Profile Settings",
      href: "/employee/profile/edit",
    })
    return breadcrumbs
  }

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Format the segment for display
    let label = segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    // Special cases
    if (segment === "dashboard") label = "Dashboard"
    if (segment === "employee") label = "Employee Portal"
    if (segment === "company") label = "Company"
    if (segment === "employees") label = "Team Members"
    if (segment === "certificates") label = "Certificates"
    if (segment === "repositories") label = "Repositories"
    if (segment === "integrations") label = "Integrations"
    if (segment === "github") label = "GitHub"
    if (segment === "gitlab") label = "GitLab"

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  })

  return breadcrumbs
}

export function Header({ user, showBreadcrumbs = true, userRole = "employee" }: HeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = showBreadcrumbs ? generateBreadcrumbs(pathname) : []

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "U"

  // Determine settings and profile URLs based on role
  const settingsUrl = userRole === "company_admin" ? "/company/settings" : "/employee/profile/edit"
  // Profile should open the user's public profile for all roles
  const profileUrl = "/employee/public-profile"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground flex-1">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Spacer if no breadcrumbs */}
        {(!showBreadcrumbs || breadcrumbs.length === 0) && <div className="flex-1" />}

        {/* Search */}
        <Button variant="outline" size="sm" className="relative h-9 w-64 justify-start text-sm text-muted-foreground">
          <Search className="mr-2 h-4 w-4" />
          <span className="inline-flex">Search...</span>
          <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </p>
                {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userRole !== "company_admin" && (
              <DropdownMenuItem asChild>
                <Link href={profileUrl} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={settingsUrl} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/signout" className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

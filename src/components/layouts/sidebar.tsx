"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart3,
  Settings,
  GitBranch,
  FileText,
  Zap,
  UserCircle,
  Trophy,
  Code,
  TrendingUp,
  ChevronLeft,
  type LucideIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  variant?: "default" | "ghost"
}

interface SidebarProps {
  userRole: "company_admin" | "employee"
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const companyNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Team Members",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Skills Matrix",
    href: "/dashboard/skills-matrix",
    icon: Trophy,
  },
  {
    title: "Command Center",
    href: "/dashboard/manager",
    icon: Zap,
  },
  {
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: GitBranch,
  },
  {
    title: "Settings",
    href: "/company/settings",
    icon: Settings,
  },
]

const employeeNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Certificates",
    href: "/employee/certificates",
    icon: Award,
  },
  {
    title: "Repositories",
    href: "/employee/repositories",
    icon: GitBranch,
  },
  {
    title: "Skills",
    href: "/employee/skills",
    icon: Code,
  },
  {
    title: "Public Profile",
    href: "/employee/public-profile",
    icon: UserCircle,
  },
  {
    title: "Profile Settings",
    href: "/employee/profile/edit",
    icon: Settings,
  },
]

export function Sidebar({ userRole, collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const navItems = userRole === "company_admin" ? companyNavItems : employeeNavItems

  return (
    <div
      className={cn(
        "sticky top-0 h-screen shrink-0 flex flex-col border-r bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        {!collapsed && (
          <Link href={userRole === "company_admin" ? "/dashboard" : "/employee"} className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">WL</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">WorkLedger</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">WL</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-700" : "text-gray-400")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md group-hover:block">
                    {item.title}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Collapse button */}
      {onCollapse && (
        <div className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className="w-full justify-start"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      )}

      {/* Role Badge */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {userRole === "company_admin" ? "C" : "E"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {userRole === "company_admin" ? "Company Admin" : "Employee"}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
  Building2,
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
    title: "Overview",
    href: "/employee",
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
        "relative flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href={userRole === "company_admin" ? "/dashboard" : "/employee"} className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gradient">WorkLedger</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
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
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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

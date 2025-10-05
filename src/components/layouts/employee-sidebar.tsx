"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Award,
  GitBranch,
  Code,
  User,
  Settings,
} from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Certificates",
    href: "/employee/certificates",
    icon: Award,
  },
  {
    name: "Repositories",
    href: "/employee/repositories",
    icon: GitBranch,
  },
  {
    name: "Skills",
    href: "/employee/skills",
    icon: Code,
  },
  {
    name: "Public Profile",
    href: "/employee/public-profile",
    icon: User,
  },
  {
    name: "Profile Settings",
    href: "/employee/profile/edit",
    icon: Settings,
  },
]

export function EmployeeSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col fixed left-0 top-0 border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/employee/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">WL</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">WorkLedger</span>
        </Link>
      </div>

      {/* Breadcrumb */}
      <div className="border-b px-6 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Employee Portal</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

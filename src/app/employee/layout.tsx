import { requireAuth, getUserWithCompany } from "@/lib/session"
import { EmployeeSidebar } from "@/components/layouts/employee-sidebar"
import { Header } from "@/components/layouts/header"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <EmployeeSidebar />

      {/* Main content area with header */}
      <div className="pl-64">
        {/* Header */}
        <Header
          user={{
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
          }}
          userRole={session.user.role}
          showBreadcrumbs={false}
        />

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  )
}

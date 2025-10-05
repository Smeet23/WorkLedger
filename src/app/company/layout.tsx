import { requireCompanyAdmin } from "@/lib/session"
import { AppShell } from "@/components/layouts/app-shell"

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireCompanyAdmin()

  return (
    <AppShell
      userRole="company_admin"
      user={{
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
      }}
      className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20"
    >
      {children}
    </AppShell>
  )
}

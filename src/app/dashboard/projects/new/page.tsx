import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { CreateProjectForm } from "@/components/forms/create-project-form"

export default async function NewProjectPage() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
            <Link href="/dashboard/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              New Project
            </span>
          </div>
          <h1 className="text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight">Create a Project</h1>
          <p className="mt-2 text-lg text-slate-600 leading-relaxed max-w-2xl">
            Define your project, select the required tech stack, and we'll recommend the best team members based on their skills.
          </p>
        </div>

        {/* Feature Highlight */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50 mt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Smart Team Recommendations</h3>
            <p className="text-sm text-slate-600">
              After creating your project, you'll see AI-powered team recommendations based on the tech stack you select.
            </p>
          </div>
        </div>
      </div>

      {/* Project Form */}
      <CreateProjectForm />
    </div>
  )
}

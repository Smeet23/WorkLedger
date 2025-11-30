import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FolderKanban, Code2, Users, Calendar, Clock, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns'
import { ProjectTeamManager } from "@/components/projects/project-team-manager"

interface PageProps {
  params: Promise<{ id: string }>
}

function getStatusColor(status: string) {
  switch (status) {
    case "PLANNING": return "bg-purple-100 text-purple-800 border-purple-200"
    case "ACTIVE": return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "ON_HOLD": return "bg-amber-100 text-amber-800 border-amber-200"
    case "COMPLETED": return "bg-blue-100 text-blue-800 border-blue-200"
    case "CANCELLED": return "bg-red-100 text-red-800 border-red-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case "HIGH": return "bg-red-100 text-red-700 border-red-200"
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200"
    case "LOW": return "bg-green-100 text-green-700 border-green-200"
    default: return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo

  const project = await db.project.findFirst({
    where: { id, companyId: company.id },
    include: {
      techStack: {
        include: { skill: true },
        orderBy: { priority: 'asc' }
      },
      members: {
        where: { isActive: true },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
              title: true,
              department: true,
              skillRecords: {
                include: { skill: true }
              }
            }
          }
        },
        orderBy: [{ isLead: 'desc' }, { assignedAt: 'asc' }]
      },
      _count: {
        select: {
          members: { where: { isActive: true } },
          techStack: true
        }
      }
    }
  })

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
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

        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                Project Details
              </span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
                {project.name}
              </h1>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              {project.priority && (
                <Badge variant="outline" className={getPriorityColor(project.priority)}>
                  {project.priority} Priority
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="mt-2 text-lg text-slate-600 leading-relaxed max-w-3xl">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" className="border-slate-200 hover:border-indigo-200 hover:bg-indigo-50">
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          </div>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
                  <Code2 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Tech Stack</p>
                  <p className="text-3xl font-bold text-slate-900">{project._count.techStack}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Team Members</p>
                  <p className="text-3xl font-bold text-purple-600">{project._count.members}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {project.startDate && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-200/50">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Start Date</p>
                    <p className="text-lg font-bold text-slate-900">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {project.deadline && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Deadline</p>
                    <p className="text-lg font-bold text-amber-600">{format(new Date(project.deadline), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tech Stack Section */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-200/50">
                <Code2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Tech Stack</CardTitle>
                <CardDescription className="text-slate-600">
                  Technologies required for this project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {project.techStack.map((ts, index) => (
                <div
                  key={ts.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200/50"
                >
                  <span className="text-xs text-indigo-400 font-bold">#{index + 1}</span>
                  <span className="font-medium text-slate-800">{ts.skill.name}</span>
                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                    {ts.skill.category}
                  </Badge>
                  {ts.isRequired && (
                    <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management - Current Team + Recommendations */}
      <ProjectTeamManager projectId={project.id} initialMembers={project.members} />
    </div>
  )
}

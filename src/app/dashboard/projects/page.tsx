import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Plus, Users, Code2, Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { PaginationWrapper } from "@/components/ui/pagination-wrapper"
import { format } from 'date-fns'

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>
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

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const statusFilter = params.status

  const where: any = { companyId: company.id }
  if (statusFilter) {
    where.status = statusFilter
  }

  // Fetch counts
  const [totalProjects, planningCount, activeCount, completedCount, onHoldCount] = await Promise.all([
    db.project.count({ where: { companyId: company.id } }),
    db.project.count({ where: { companyId: company.id, status: 'PLANNING' } }),
    db.project.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
    db.project.count({ where: { companyId: company.id, status: 'COMPLETED' } }),
    db.project.count({ where: { companyId: company.id, status: 'ON_HOLD' } }),
  ])

  // Fetch projects
  const projects = await db.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      techStack: {
        include: { skill: true },
        orderBy: { priority: 'asc' },
        take: 5
      },
      members: {
        where: { isActive: true },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        },
        take: 5
      },
      _count: {
        select: {
          members: { where: { isActive: true } },
          techStack: true
        }
      }
    }
  })

  const totalPages = Math.ceil(
    (statusFilter ? await db.project.count({ where }) : totalProjects) / ITEMS_PER_PAGE
  )

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                Project Management
              </span>
            </div>
            <h1 className="text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight">Projects</h1>
            <p className="mt-2 text-lg text-slate-600 leading-relaxed">
              Create projects, select tech stack, and build the perfect team
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all border-0">
            <Link href="/dashboard/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
                  <FolderKanban className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Total Projects</p>
                  <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/50">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Active</p>
                  <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
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
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Planning</p>
                  <p className="text-3xl font-bold text-purple-600">{planningCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Completed</p>
                  <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <Button
            variant={!statusFilter ? "outline" : "ghost"}
            size="sm"
            asChild
            className={!statusFilter ? "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
          >
            <Link href="/dashboard/projects">
              All ({totalProjects})
            </Link>
          </Button>
          <Button
            variant={statusFilter === 'ACTIVE' ? "outline" : "ghost"}
            size="sm"
            asChild
            className={statusFilter === 'ACTIVE' ? "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
          >
            <Link href="/dashboard/projects?status=ACTIVE">
              Active ({activeCount})
            </Link>
          </Button>
          <Button
            variant={statusFilter === 'PLANNING' ? "outline" : "ghost"}
            size="sm"
            asChild
            className={statusFilter === 'PLANNING' ? "bg-white border-purple-200 text-purple-700 hover:bg-purple-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
          >
            <Link href="/dashboard/projects?status=PLANNING">
              Planning ({planningCount})
            </Link>
          </Button>
          <Button
            variant={statusFilter === 'ON_HOLD' ? "outline" : "ghost"}
            size="sm"
            asChild
            className={statusFilter === 'ON_HOLD' ? "bg-white border-amber-200 text-amber-700 hover:bg-amber-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
          >
            <Link href="/dashboard/projects?status=ON_HOLD">
              On Hold ({onHoldCount})
            </Link>
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">All Projects</CardTitle>
                <CardDescription className="text-slate-600">
                  Manage your projects and team assignments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/50 mb-4">
                  <FolderKanban className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
                <p className="mt-2 text-slate-600 max-w-sm mx-auto">
                  Get started by creating your first project and building your dream team.
                </p>
                <Button asChild className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Link href="/dashboard/projects/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="group/project relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover/project:opacity-100 transition-opacity duration-300" />
                    <div className="relative border border-slate-200/60 rounded-xl p-5 bg-white/80 backdrop-blur-sm hover:bg-white transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                            {project.priority && (
                              <Badge variant="outline" className={getPriorityColor(project.priority)}>
                                {project.priority}
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
                          )}

                          {/* Timeline */}
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                            {project.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Started {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                            {project.deadline && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-4 h-4" />
                                <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>

                          {/* Tech Stack */}
                          {project.techStack.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Code2 className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 uppercase">Tech Stack</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {project.techStack.map((ts) => (
                                  <Badge key={ts.id} variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50">
                                    {ts.skill.name}
                                  </Badge>
                                ))}
                                {project._count.techStack > 5 && (
                                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                                    +{project._count.techStack - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Team Members */}
                          {project.members.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 uppercase">Team ({project._count.members})</span>
                              </div>
                              <div className="flex -space-x-2">
                                {project.members.slice(0, 5).map((member) => (
                                  <div
                                    key={member.id}
                                    className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white flex items-center justify-center"
                                    title={`${member.employee.firstName} ${member.employee.lastName}`}
                                  >
                                    <span className="text-xs font-medium text-indigo-600">
                                      {member.employee.firstName.charAt(0)}{member.employee.lastName.charAt(0)}
                                    </span>
                                  </div>
                                ))}
                                {project._count.members > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                    <span className="text-xs font-medium text-slate-600">
                                      +{project._count.members - 5}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-3 ml-4">
                          <div className="flex items-center gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-indigo-600">{project._count.techStack}</p>
                              <p className="text-xs text-slate-500 font-medium">Skills</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-600">{project._count.members}</p>
                              <p className="text-xs text-slate-500 font-medium">Members</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild className="border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                            <Link href={`/dashboard/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="px-6 pb-6">
              <PaginationWrapper
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProjects}
                itemsPerPage={ITEMS_PER_PAGE}
                pageParamName="page"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

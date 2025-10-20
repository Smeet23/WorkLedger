'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Clock } from "lucide-react"
import Link from "next/link"
import { CopyInvitationLink } from "@/components/ui/copy-invitation-link"
import { ClientPagination } from "@/components/ui/client-pagination"

const ITEMS_PER_PAGE = 10

interface Invitation {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  title: string | null
  token: string
  expiresAt: Date
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  title: string | null
  department: string | null
  isActive: boolean
  skillRecords: Array<{
    id: string
    skill: {
      id: string
      name: string
    }
  }>
  certificates: Array<{
    id: string
  }>
}

interface EmployeeListClientProps {
  invitations: Invitation[]
  employees: Employee[]
}

function getRoleColor(role: string) {
  switch (role) {
    case "DEVELOPER": return "bg-blue-100 text-blue-800"
    case "DESIGNER": return "bg-purple-100 text-purple-800"
    case "MANAGER": return "bg-green-100 text-green-800"
    case "SALES": return "bg-orange-100 text-orange-800"
    case "MARKETING": return "bg-pink-100 text-pink-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function EmployeeListClient({ invitations, employees }: EmployeeListClientProps) {
  const [invitationPage, setInvitationPage] = useState(1)
  const [employeePage, setEmployeePage] = useState(1)

  // Pagination calculations
  const totalInvitationPages = Math.ceil(invitations.length / ITEMS_PER_PAGE)
  const paginatedInvitations = invitations.slice(
    (invitationPage - 1) * ITEMS_PER_PAGE,
    invitationPage * ITEMS_PER_PAGE
  )

  const totalEmployeePages = Math.ceil(employees.length / ITEMS_PER_PAGE)
  const paginatedEmployees = employees.slice(
    (employeePage - 1) * ITEMS_PER_PAGE,
    employeePage * ITEMS_PER_PAGE
  )

  return (
    <>
      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="group relative mb-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
          <Card className="relative border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Pending Invitations ({invitations.length})
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Employees who have not accepted their invitation yet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedInvitations.map((invitation) => (
                  <div key={invitation.id} className="group/item relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-xl blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                    <div className="relative border border-amber-200/60 rounded-xl p-4 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center border border-amber-200/50">
                            <Mail className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {invitation.firstName} {invitation.lastName}
                            </h4>
                            <p className="text-sm text-slate-600">{invitation.email}</p>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                {invitation.role}
                              </Badge>
                              {invitation.title && (
                                <span className="text-xs text-slate-500">• {invitation.title}</span>
                              )}
                              <span className="text-xs text-slate-500">
                                • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CopyInvitationLink token={invitation.token} />
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            {totalInvitationPages > 1 && (
              <div className="px-6 pb-6">
                <ClientPagination
                  currentPage={invitationPage}
                  totalPages={totalInvitationPages}
                  totalItems={invitations.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setInvitationPage}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Employee List */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Team Members</CardTitle>
                <CardDescription className="text-slate-600">
                  Manage your team members and track their professional development
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200/50 mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No employees yet</h3>
                <p className="mt-2 text-slate-600 max-w-sm mx-auto">
                  Get started by inviting your first team member.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="grid gap-4">
                  {paginatedEmployees.map((employee) => (
                    <div key={employee.id} className="group/emp relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover/emp:opacity-100 transition-opacity duration-300" />
                      <div className="relative border border-slate-200/60 rounded-xl p-5 bg-white/80 backdrop-blur-sm hover:bg-white transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center border border-blue-200/50 group-hover/emp:scale-110 transition-transform duration-300">
                              <span className="text-blue-600 font-bold text-lg">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className="text-sm text-slate-600">{employee.email}</p>
                              <div className="flex items-center space-x-2 mt-1.5">
                                <Badge className={getRoleColor(employee.role)}>
                                  {employee.role}
                                </Badge>
                                {employee.title && (
                                  <span className="text-sm text-slate-600">• {employee.title}</span>
                                )}
                                {employee.department && (
                                  <span className="text-sm text-slate-600">• {employee.department}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{employee.skillRecords.length}</p>
                              <p className="text-xs text-slate-500 font-medium">Skills</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-emerald-600">{employee.certificates.length}</p>
                              <p className="text-xs text-slate-500 font-medium">Certificates</p>
                            </div>
                            <div className="text-center">
                              <Badge variant={employee.isActive ? "default" : "secondary"} className={employee.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                                {employee.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                              <Link href={`/dashboard/employees/${employee.id}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {employee.skillRecords.length > 0 && (
                          <div className="mt-5 pt-5 border-t border-slate-200/60">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Recent Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {employee.skillRecords.slice(0, 5).map((record) => (
                                <Badge key={record.id} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50/50">
                                  {record.skill.name}
                                </Badge>
                              ))}
                              {employee.skillRecords.length > 5 && (
                                <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                                  +{employee.skillRecords.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          {totalEmployeePages > 1 && (
            <div className="px-6 pb-6">
              <ClientPagination
                currentPage={employeePage}
                totalPages={totalEmployeePages}
                totalItems={employees.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setEmployeePage}
              />
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

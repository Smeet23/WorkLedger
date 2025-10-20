'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GitCommit, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import { ClientPagination } from "@/components/ui/client-pagination"
import { formatDistance } from 'date-fns'

const ITEMS_PER_PAGE = 10

interface EmployeeMetric {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  title: string | null
  department: string | null
  isActive: boolean
  githubConnection: {
    isActive: boolean
  } | null
  _count: {
    employeeRepositories: number
    certificates: number
    skillRecords: number
  }
  score: number
  lastActive?: Date
}

interface TeamTableClientProps {
  employeeMetrics: EmployeeMetric[]
  totalEmployees: number
}

export function TeamTableClient({ employeeMetrics, totalEmployees }: TeamTableClientProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(totalEmployees / ITEMS_PER_PAGE)
  const paginatedEmployees = employeeMetrics.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base">Team Member Status</CardTitle>
        <CardDescription>Individual performance and activity tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Employee</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Last Activity</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Repositories</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Skills</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Score</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        emp.githubConnection?.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {emp.githubConnection?.isActive ? (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-gray-600">
                      {emp.lastActive
                        ? formatDistance(new Date(emp.lastActive), new Date(), { addSuffix: true })
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <GitCommit className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-sm">{emp._count.employeeRepositories}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-sm">{emp._count.skillRecords}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{emp.score}</span>
                      {emp.score > 100 && <TrendingUp className="w-3 h-3 ml-1 text-green-500" />}
                    </div>
                  </td>
                  <td className="py-3">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <div className="px-6 pb-6">
          <ClientPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalEmployees}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </Card>
  )
}

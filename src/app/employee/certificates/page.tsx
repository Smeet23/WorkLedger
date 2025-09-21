import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { db } from "@/lib/db"
import { Trophy, Download, Calendar, ArrowLeft, Eye, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function CertificatesPage() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">No Employee Record Found</CardTitle>
            <CardDescription>
              Please contact your administrator to set up your employee profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch all certificates for the employee
  const certificates = await db.certificate.findMany({
    where: { employeeId: userInfo.employee.id },
    orderBy: { issueDate: 'desc' },
    include: {
      certificateFile: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/employee/certificates/generate">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
              </Link>
              <Link href="/employee">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Certificates Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Generate your first professional certificate to showcase your skills
                  </p>
                  <Link href="/employee/certificates/generate">
                    <Button>
                      <Trophy className="w-4 h-4 mr-2" />
                      Generate Your First Certificate
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate) => {
                const skillsData = certificate.skillsData as any
                const achievements = certificate.achievements as any
                const metrics = certificate.metrics as any

                return (
                  <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {certificate.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {format(new Date(certificate.periodStart), 'MMM yyyy')} -
                            {format(new Date(certificate.periodEnd), 'MMM yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant={certificate.status === 'ISSUED' ? 'default' : 'secondary'}>
                          {certificate.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-lg font-bold text-blue-600">
                              {skillsData?.count || skillsData?.skills?.length || 0}
                            </div>
                            <div className="text-xs text-gray-500">Skills</div>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-lg font-bold text-green-600">
                              {achievements?.repositories || 0}
                            </div>
                            <div className="text-xs text-gray-500">Projects</div>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-lg font-bold text-purple-600">
                              {metrics?.periodDays || 90}
                            </div>
                            <div className="text-xs text-gray-500">Days</div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            ID: {certificate.verificationId.slice(0, 8)}...
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <a
                            href={`/api/certificates/${certificate.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </a>
                          <a
                            href={`/api/certificates/${certificate.id}/pdf`}
                            download={`certificate-${certificate.verificationId}.pdf`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
import { requireAuth, getUserWithCompany } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { db } from "@/lib/db"
import { Trophy, Download, Calendar, Eye, Plus, Award, Star, Sparkles, ArrowRight, Target } from 'lucide-react'
import { format } from 'date-fns'

export default async function CertificatesPage() {
  const session = await requireAuth()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md rounded-3xl shadow-xl border-2">
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                My Certificates
              </h1>
              <p className="text-sm text-gray-600">
                {certificates.length} {certificates.length === 1 ? 'achievement' : 'achievements'} earned
              </p>
            </div>
            <Link href="/employee/certificates/generate">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Generate New
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {certificates.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Award className="w-8 h-8 text-gray-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No Certificates Yet
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Generate your first professional certificate to showcase your skills and achievements.
                </p>

                <Link href="/employee/certificates/generate">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Your First Certificate
                    <ArrowRight className="w-4 h-4 ml-2" />
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
                <Card
                  key={certificate.id}
                  className="border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-gray-700" />
                      </div>
                      <Badge
                        className={
                          certificate.status === 'ISSUED'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }
                      >
                        {certificate.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {certificate.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {format(new Date(certificate.periodStart), 'MMM yyyy')} - {format(new Date(certificate.periodEnd), 'MMM yyyy')}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-xl font-semibold text-gray-900 mb-1">
                            {skillsData?.count || skillsData?.skills?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600">Skills</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-xl font-semibold text-gray-900 mb-1">
                            {achievements?.repositories || 0}
                          </div>
                          <div className="text-xs text-gray-600">Projects</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-xl font-semibold text-gray-900 mb-1">
                            {metrics?.periodDays || 90}
                          </div>
                          <div className="text-xs text-gray-600">Days</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Issued: {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-50 rounded-lg p-3">
                          <Target className="w-4 h-4 text-gray-400" />
                          ID: {certificate.verificationId.slice(0, 12)}...
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
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
                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
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

        {/* Achievement Stats */}
        {certificates.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-5 h-5 text-gray-700" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">{certificates.length}</div>
                <div className="text-sm text-gray-600">Total Certificates</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-5 h-5 text-gray-700" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {certificates.filter(c => c.status === 'ISSUED').length}
                </div>
                <div className="text-sm text-gray-600">Issued Certificates</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-gray-700" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {certificates.length > 0 ? format(new Date(certificates[0].issueDate), 'MMM yyyy') : '-'}
                </div>
                <div className="text-sm text-gray-600">Latest Achievement</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

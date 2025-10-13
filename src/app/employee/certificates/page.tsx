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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-3xl p-8 md:p-12 mb-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    My Certificates
                  </h1>
                  <p className="text-white/90">
                    {certificates.length} {certificates.length === 1 ? 'achievement' : 'achievements'} earned
                  </p>
                </div>
              </div>
              <Link href="/employee/certificates/generate">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 shadow-xl rounded-full h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Generate New
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        {certificates.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                {/* Cute illustration */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-3xl transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                          <Trophy className="w-14 h-14 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Certificates Yet
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Generate your first professional certificate to showcase your skills and achievements.
                  Your verified credentials are waiting!
                </p>

                <Link href="/employee/certificates/generate">
                  <Button size="lg" className="rounded-full h-12 px-8 shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Your First Certificate
                    <ArrowRight className="w-5 h-5 ml-2" />
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
                  className="group border-2 border-transparent hover:border-yellow-300 transition-all duration-300 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl"
                >
                  <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>

                  <CardHeader className="bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Award className="w-6 h-6 text-white" />
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
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {skillsData?.count || skillsData?.skills?.length || 0}
                          </div>
                          <div className="text-xs font-medium text-blue-700">Skills</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {achievements?.repositories || 0}
                          </div>
                          <div className="text-xs font-medium text-green-700">Projects</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {metrics?.periodDays || 90}
                          </div>
                          <div className="text-xs font-medium text-purple-700">Days</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>Issued: {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-50 rounded-xl p-3">
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
                          <Button variant="outline" className="w-full rounded-full border-2 hover:bg-blue-50" size="sm">
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
                            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{certificates.length}</div>
                <div className="text-sm font-medium text-gray-600">Total Certificates</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {certificates.filter(c => c.status === 'ISSUED').length}
                </div>
                <div className="text-sm font-medium text-gray-600">Issued Certificates</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-white rounded-3xl p-6 text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {certificates.length > 0 ? format(new Date(certificates[0].issueDate), 'MMM yyyy') : '-'}
                </div>
                <div className="text-sm font-medium text-gray-600">Latest Achievement</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  Award,
  FileText,
  Download,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    verificationId: string
  }
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const { verificationId } = params

  // Fetch certificate with related data
  const certificate = await db.certificate.findUnique({
    where: { verificationId },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          title: true
        }
      },
      company: {
        select: {
          name: true,
          domain: true,
          logoUrl: true
        }
      }
    }
  })

  if (!certificate) {
    return notFound()
  }

  const isValid = certificate.status === 'ISSUED'
  const isExpired = certificate.expiryDate ? new Date(certificate.expiryDate) < new Date() : false
  const skillsData = certificate.skillsData as any
  const achievements = certificate.achievements as any

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Verification Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            {isValid && !isExpired ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate Verification
          </h1>
          <p className="text-lg text-gray-600">
            {isValid && !isExpired
              ? '✓ This certificate is valid and authentic'
              : isExpired
              ? '✗ This certificate has expired'
              : '✗ This certificate is not valid'}
          </p>
        </div>

        {/* Certificate Details Card */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Professional Skills Certificate</CardTitle>
                <CardDescription className="text-blue-100">
                  Issued by {certificate.company.name}
                </CardDescription>
              </div>
              <Shield className="w-10 h-10 text-white/80" />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Employee Information */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Certificate Holder</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {certificate.employee.firstName} {certificate.employee.lastName}
                    </p>
                    {certificate.employee.title && (
                      <p className="text-sm text-gray-600">{certificate.employee.title}</p>
                    )}
                    <p className="text-sm text-gray-500">{certificate.employee.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Certificate Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Issued:</span>
                    <span className="ml-2 font-medium">
                      {new Date(certificate.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Period:</span>
                    <span className="ml-2 font-medium">
                      {new Date(certificate.periodStart).toLocaleDateString()} -
                      {new Date(certificate.periodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  {certificate.expiryDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Expires:</span>
                      <span className="ml-2 font-medium">
                        {new Date(certificate.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Issuing Organization</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium">{certificate.company.name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Domain:</span>
                    <span className="ml-2">{certificate.company.domain}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Summary */}
            {skillsData && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Certified Skills</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{skillsData.count || 0}</p>
                      <p className="text-xs text-gray-600">Total Skills</p>
                    </div>
                    {achievements && (
                      <>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {achievements.repositories || 0}
                          </p>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {achievements.languages?.length || 0}
                          </p>
                          <p className="text-xs text-gray-600">Languages</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {skillsData.categories?.length || 0}
                          </p>
                          <p className="text-xs text-gray-600">Categories</p>
                        </div>
                      </>
                    )}
                  </div>

                  {achievements?.languages && achievements.languages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-100">
                      <p className="text-xs text-gray-600 mb-2">Primary Languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {achievements.languages.map((lang: string) => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Details */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Verification Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
                <div className="grid gap-2">
                  <div>
                    <span className="text-gray-600">Certificate ID:</span>
                    <span className="ml-2 text-gray-900 select-all">{certificate.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Verification ID:</span>
                    <span className="ml-2 text-gray-900 select-all">{certificate.verificationId}</span>
                  </div>
                  {certificate.hashValue && (
                    <div>
                      <span className="text-gray-600">Hash:</span>
                      <span className="ml-2 text-gray-900 select-all break-all">
                        {certificate.hashValue.substring(0, 32)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={isValid && !isExpired ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {isValid && !isExpired
                    ? 'Valid Certificate'
                    : isExpired
                    ? 'Expired Certificate'
                    : 'Invalid Certificate'}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {certificate.status}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Link href={`/api/certificates/${certificate.id}/download`}>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            This certificate was issued through WorkLedger's secure platform.
          </p>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Learn more about WorkLedger →
          </Link>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, FileText, Download, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function GenerateCertificate() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(3)
  const [generatedCertificate, setGeneratedCertificate] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          periodMonths: selectedPeriod,
          title: `Professional Skills Certificate - ${new Date().getFullYear()}`,
          description: `Skills and achievements certificate for the last ${selectedPeriod} months`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate')
      }

      setGeneratedCertificate(data.certificate)
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate certificate')
    } finally {
      setIsGenerating(false)
    }
  }

  if (generatedCertificate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">Certificate Generated!</h1>
              </div>
              <Link href="/employee">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">
                Certificate Successfully Generated!
              </CardTitle>
              <CardDescription className="text-center">
                Your professional skills certificate has been created and is ready for download
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Certificate ID</p>
                      <p className="font-mono text-sm">{generatedCertificate.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verification ID</p>
                      <p className="font-mono text-sm">{generatedCertificate.verificationId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="text-sm">
                        {new Date(generatedCertificate.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant="default">{generatedCertificate.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`/api/certificates/${generatedCertificate.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      View Certificate
                    </Button>
                  </a>
                  <Link href="/employee/certificates" className="flex-1">
                    <Button variant="outline" className="w-full">
                      View All Certificates
                    </Button>
                  </Link>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Share your verification ID to allow others to verify your certificate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Generate Certificate</h1>
            </div>
            <Link href="/employee">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <CardTitle>Generate Professional Certificate</CardTitle>
                <CardDescription>
                  Create a verified certificate showcasing your skills and achievements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label>Certificate Period</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Select the time period for your certificate
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 6, 12].map((months) => (
                    <button
                      key={months}
                      onClick={() => setSelectedPeriod(months)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedPeriod === months
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                      <p className="font-medium">{months} Months</p>
                      <p className="text-xs text-gray-500">
                        Last {months} months of activity
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What's Included:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    All skills detected from your GitHub activity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Programming languages and frameworks used
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Contribution metrics and achievements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Digital signature and QR verification code
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium">Certificate Format</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Your certificate will be generated as a professional PDF document with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Company branding and official seal</li>
                  <li>• Cryptographic signature for authenticity</li>
                  <li>• QR code for instant verification</li>
                  <li>• Detailed skill breakdown and proficiency levels</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Generate Certificate for Last {selectedPeriod} Months
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By generating a certificate, you confirm that all information is accurate
                and approved by your organization's privacy settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
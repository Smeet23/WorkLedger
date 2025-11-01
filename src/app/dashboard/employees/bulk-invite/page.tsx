"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, AlertCircle, Github, FileText, ArrowLeft, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ParsedEmployee {
  email: string
  firstName: string
  lastName: string
  role: string
  title?: string
  department?: string
}

export default function BulkInvitePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [employees, setEmployees] = useState<ParsedEmployee[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setError("")
      setFile(uploadedFile)

      // Parse CSV
      const text = await uploadedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        setError("CSV file must contain headers and at least one employee")
        return
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredHeaders = ['email', 'firstname', 'lastname', 'role']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`)
        return
      }

      // Parse employee data
      const parsed: ParsedEmployee[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length < 4) continue

        const employee: ParsedEmployee = {
          email: values[headers.indexOf('email')],
          firstName: values[headers.indexOf('firstname')],
          lastName: values[headers.indexOf('lastname')],
          role: values[headers.indexOf('role')].toUpperCase(),
          title: headers.includes('title') ? values[headers.indexOf('title')] : undefined,
          department: headers.includes('department') ? values[headers.indexOf('department')] : undefined,
        }

        if (employee.email && employee.firstName && employee.lastName) {
          parsed.push(employee)
        }
      }

      setEmployees(parsed)
    } catch (err) {
      setError("Failed to parse CSV file. Please check the format.")
      console.error(err)
    }
  }

  const handleSendInvitations = async () => {
    try {
      setIsProcessing(true)
      setError("")

      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees,
          companyId: 'current', // Will be resolved by backend from session
          companyDomain: 'company.com'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `email,firstName,lastName,role,title,department
john@company.com,John,Doe,DEVELOPER,Senior Developer,Engineering
jane@company.com,Jane,Smith,DESIGNER,UI Designer,Design
bob@company.com,Bob,Wilson,SALES,Sales Manager,Sales`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee-template.csv'
    a.click()
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Invite Employees</h1>
          <p className="text-sm text-gray-600">Upload a CSV file to invite multiple employees at once</p>
        </div>
      </div>

      {/* Template Download */}
      <Alert className="mb-6">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Need a template? Download the CSV template to get started.</span>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      {!result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Required columns: email, firstName, lastName, role<br/>
              Optional columns: title, department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                const file = e.dataTransfer.files[0]
                if (file && file.type === 'text/csv') {
                  handleFileUpload(file)
                }
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.csv'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {file ? file.name : 'Drop your CSV file here'}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {employees.length > 0 && !result && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({employees.length} employees)</CardTitle>
                <CardDescription>
                  Review the employees before sending invitations
                </CardDescription>
              </div>
              <Button onClick={handleSendInvitations} disabled={isProcessing}>
                {isProcessing ? 'Sending...' : 'Send Invitations'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.slice(0, 10).map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{emp.role}</Badge>
                    {emp.title && (
                      <span className="text-xs text-gray-500">{emp.title}</span>
                    )}
                  </div>
                </div>
              ))}
              {employees.length > 10 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  ... and {employees.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Invitations Sent Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {result.invitationsCount}
                  </div>
                  <div className="text-sm text-green-600">Invitations Sent</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {result.githubStats?.withGitHub || 0}
                  </div>
                  <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
                    <Github className="w-3 h-3" />
                    With GitHub
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">
                    {result.githubStats?.withoutGitHub || 0}
                  </div>
                  <div className="text-sm text-amber-600">Without GitHub</div>
                </div>
              </div>

              {/* GitHub Match Rate */}
              {result.githubStats && (
                <Alert>
                  <Github className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{result.githubStats.matchRate}% GitHub match rate</strong>
                    <br />
                    {result.githubStats.withGitHub} employees will have their commits tracked automatically.
                    {result.githubStats.withoutGitHub > 0 && (
                      <> {result.githubStats.withoutGitHub} employees can still use WorkLedger without GitHub features.</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard/employees')} className="flex-1">
                  View Employees
                </Button>
                <Button variant="outline" onClick={() => {
                  setFile(null)
                  setEmployees([])
                  setResult(null)
                }} className="flex-1">
                  Invite More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

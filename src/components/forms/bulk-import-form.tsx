"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Mail, Users } from "lucide-react"

interface BulkImportFormProps {
  companyId: string
  companyDomain: string
}

interface ParsedEmployee {
  email: string
  firstName: string
  lastName: string
  role: string
  title?: string
  department?: string
  startDate?: string
  errors: string[]
}

export function BulkImportForm({ companyId, companyDomain }: BulkImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedEmployee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [sendEmails, setSendEmails] = useState(true)
  const [importResult, setImportResult] = useState<any>(null)
  const router = useRouter()

  const validRoles = ['DEVELOPER', 'DESIGNER', 'MANAGER', 'SALES', 'MARKETING', 'OTHER']

  const downloadTemplate = () => {
    const csvContent = `email,firstName,lastName,role,title,department,startDate
john.doe@example.com,John,Doe,DEVELOPER,Senior Software Engineer,Engineering,2024-01-15
jane.smith@example.com,Jane,Smith,DESIGNER,UX Designer,Design,2024-02-01
mike.johnson@example.com,Mike,Johnson,MANAGER,Engineering Manager,Engineering,2023-06-01`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const parseCSV = (csvText: string): ParsedEmployee[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const requiredHeaders = ['email', 'firstname', 'lastname', 'role']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    const employees: ParsedEmployee[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const employee: ParsedEmployee = {
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        errors: []
      }

      headers.forEach((header, index) => {
        const value = values[index] || ''

        switch (header) {
          case 'email':
            employee.email = value
            if (!value) employee.errors.push('Email is required')
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              employee.errors.push('Invalid email format')
            }
            break
          case 'firstname':
            employee.firstName = value
            if (!value) employee.errors.push('First name is required')
            break
          case 'lastname':
            employee.lastName = value
            if (!value) employee.errors.push('Last name is required')
            break
          case 'role':
            employee.role = value.toUpperCase()
            if (!value) employee.errors.push('Role is required')
            else if (!validRoles.includes(employee.role)) {
              employee.errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
            }
            break
          case 'title':
            employee.title = value || undefined
            break
          case 'department':
            employee.department = value || undefined
            break
          case 'startdate':
            if (value) {
              const date = new Date(value)
              if (isNaN(date.getTime())) {
                employee.errors.push('Invalid start date format (use YYYY-MM-DD)')
              } else {
                employee.startDate = value
              }
            }
            break
        }
      })

      employees.push(employee)
    }

    return employees
  }

  const handlePreview = async () => {
    if (!file) return

    setIsLoading(true)
    setError('')

    try {
      const csvText = await file.text()
      const parsed = parseCSV(csvText)
      setParsedData(parsed)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    const validEmployees = parsedData.filter(emp => emp.errors.length === 0)

    if (validEmployees.length === 0) {
      setError('No valid employees to import')
      return
    }

    setStep('importing')
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employees: validEmployees,
          companyId,
          companyDomain,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import employees')
      }

      setImportResult(result)
      setSuccess(`Successfully created ${result.invitationsCount || result.importedCount || 0} invitations`)

      // Send emails if requested and invitations were created
      if (sendEmails && result.details?.invitations?.length > 0) {
        for (const invitation of result.details.invitations) {
          try {
            await fetch('/api/company/invitations/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: invitation.email,
                firstName: invitation.firstName,
                lastName: invitation.lastName,
                role: invitation.role,
                title: invitation.title,
                department: invitation.department,
                sendEmail: true,
              }),
            })
          } catch (emailError) {
            console.error(`Failed to send email to ${invitation.email}:`, emailError)
          }
        }
      }

      setStep('complete')

      // Redirect after a longer delay to show results
      setTimeout(() => {
        router.push('/dashboard/employees')
      }, 5000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during import')
      setStep('preview')
    } finally {
      setIsLoading(false)
    }
  }

  const validCount = parsedData.filter(emp => emp.errors.length === 0).length
  const errorCount = parsedData.filter(emp => emp.errors.length > 0).length

  if (step === 'complete') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
          <p className="text-sm text-gray-600 mb-6">{success}</p>
        </div>

        {importResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {importResult.details?.invitations?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Invitations Created:
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {importResult.details.invitations.slice(0, 5).map((inv: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                          <span>
                            {inv.firstName} {inv.lastName} ({inv.email})
                          </span>
                          {sendEmails ? (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              Email sent
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      ))}
                      {importResult.details.invitations.length > 5 && (
                        <p className="text-sm text-gray-500 italic">
                          ...and {importResult.details.invitations.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {importResult.details?.skipped?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skipped (Already Exist):</h4>
                    <p className="text-sm text-gray-600">
                      {importResult.details.skipped.length} employees were already in the system
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-gray-500 text-center">Redirecting to employee list...</p>
      </div>
    )
  }

  if (step === 'importing') {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Employees...</h3>
        <p className="text-sm text-gray-600">Please wait while we process your data.</p>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-blue-600">{parsedData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Valid</p>
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {parsedData.map((employee, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${employee.errors.length > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{employee.role}</Badge>
                          {employee.title && <span className="text-sm text-gray-500">• {employee.title}</span>}
                          {employee.department && <span className="text-sm text-gray-500">• {employee.department}</span>}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {employee.errors.length === 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    {employee.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                          <span className="text-sm font-medium text-red-800">Errors:</span>
                        </div>
                        <ul className="text-sm text-red-700 list-disc list-inside">
                          {employee.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Option */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send-emails"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="send-emails" className="text-sm text-gray-700">
                Send invitation emails automatically
              </label>
              <Mail className="w-4 h-4 text-gray-400 ml-2" />
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-6">
              {sendEmails
                ? "Each employee will receive an email with their unique invitation link"
                : "Invitation links will be created but emails won't be sent automatically"}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Upload Different File
          </Button>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/employees')}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || isLoading}
            >
              <Users className="w-4 h-4 mr-2" />
              Import {validCount} Employees
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Upload step
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {file && (
          <p className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/employees')}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePreview}
          disabled={!file || isLoading}
        >
          {isLoading ? "Processing..." : "Preview Data"}
          <Upload className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
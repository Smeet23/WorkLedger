import { requireCompanyAdmin, getUserWithCompany } from "@/lib/session"
import { redirect } from "next/navigation"
import { BulkImportForm } from "@/components/forms/bulk-import-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Upload, Users } from "lucide-react"
import Link from "next/link"

export default async function BulkImportPage() {
  const session = await requireCompanyAdmin()
  const userInfo = await getUserWithCompany(session.user.id)

  if (!userInfo?.company) {
    redirect("/auth/error?error=NoCompany")
  }

  const { company } = userInfo

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Employee Import</h1>
            <p className="mt-2 text-gray-600">
              Import multiple employees at once using a CSV file
            </p>
          </div>

          {/* Instructions Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                How to Import Employees
              </CardTitle>
              <CardDescription>
                Follow these steps to successfully import your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Download the CSV template</p>
                    <p className="text-sm text-gray-600">
                      Use our template to ensure your data is in the correct format
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Fill in employee details</p>
                    <p className="text-sm text-gray-600">
                      Add employee information including email, name, role, title, and department
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload your completed file</p>
                    <p className="text-sm text-gray-600">
                      Select your CSV file and review the data before importing
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  You can download the template directly from the form below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Import Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Employee Data</CardTitle>
              <CardDescription>
                Select your CSV file to import employee data into {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkImportForm companyId={company.id} companyDomain={company.domain} />
            </CardContent>
          </Card>

          {/* CSV Format Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>CSV Format Requirements</CardTitle>
              <CardDescription>
                Your CSV file should include the following columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Column</th>
                      <th className="text-left py-2 font-medium">Required</th>
                      <th className="text-left py-2 font-medium">Format</th>
                      <th className="text-left py-2 font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2">email</td>
                      <td className="py-2">✅ Yes</td>
                      <td className="py-2">Valid email address</td>
                      <td className="py-2">john.doe@company.com</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">firstName</td>
                      <td className="py-2">✅ Yes</td>
                      <td className="py-2">Text</td>
                      <td className="py-2">John</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">lastName</td>
                      <td className="py-2">✅ Yes</td>
                      <td className="py-2">Text</td>
                      <td className="py-2">Doe</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">role</td>
                      <td className="py-2">✅ Yes</td>
                      <td className="py-2">DEVELOPER, DESIGNER, MANAGER, SALES, MARKETING, OTHER</td>
                      <td className="py-2">DEVELOPER</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">title</td>
                      <td className="py-2">❌ No</td>
                      <td className="py-2">Text</td>
                      <td className="py-2">Senior Software Engineer</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">department</td>
                      <td className="py-2">❌ No</td>
                      <td className="py-2">Text</td>
                      <td className="py-2">Engineering</td>
                    </tr>
                    <tr>
                      <td className="py-2">startDate</td>
                      <td className="py-2">❌ No</td>
                      <td className="py-2">YYYY-MM-DD</td>
                      <td className="py-2">2024-01-15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
  )
}
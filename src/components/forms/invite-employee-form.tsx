"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, User, Briefcase, Building, Github } from "lucide-react"

interface InviteEmployeeFormProps {
  companyId: string
  companyDomain: string
}

const employeeRoles = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'DESIGNER', label: 'Designer' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SALES', label: 'Sales' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
]

export function InviteEmployeeForm({ companyDomain }: Omit<InviteEmployeeFormProps, 'companyId'>) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'DEVELOPER',
    title: '',
    department: '',
    githubUsername: 'none', // NEW: Phase 2 - use 'none' instead of empty string
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [githubMembers, setGithubMembers] = useState<any[]>([]) // NEW: Phase 2
  const [loadingMembers, setLoadingMembers] = useState(true) // NEW: Phase 2
  const router = useRouter()

  // NEW: Phase 2 - Fetch GitHub org members
  useEffect(() => {
    async function fetchGithubMembers() {
      try {
        const response = await fetch('/api/github/org-members')
        const data = await response.json()
        if (data.success) {
          setGithubMembers(data.data.unlinked || [])
        }
      } catch (error) {
        console.error('Failed to fetch GitHub members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchGithubMembers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Prepare data - convert 'none' to undefined for optional fields
      const submitData = {
        ...formData,
        githubUsername: formData.githubUsername === 'none' ? undefined : formData.githubUsername,
        sendEmail: true,
      }

      const response = await fetch('/api/company/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite employee')
      }

      setSuccess("Invitation sent successfully! The employee will receive an email with instructions.")

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'DEVELOPER',
        title: '',
        department: '',
        githubUsername: 'none', // NEW: Phase 2
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/employees')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="john.doe@company.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-sm text-gray-500">
          The invitation will be sent to this email address
        </p>
      </div>

      {/* Role and Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select onValueChange={(value) => handleInputChange('role', value)} value={formData.role} required>
            <SelectTrigger>
              <SelectValue placeholder="Select employee role" />
            </SelectTrigger>
            <SelectContent>
              {employeeRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Job Title</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="title"
              type="text"
              placeholder="Senior Software Engineer"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="department"
            type="text"
            placeholder="Engineering"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* GitHub Username - NEW: Phase 2 */}
      <div className="space-y-2">
        <Label htmlFor="githubUsername">GitHub Username (Optional)</Label>
        <Select onValueChange={(value) => handleInputChange('githubUsername', value)} value={formData.githubUsername}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-gray-400" />
              <SelectValue placeholder={loadingMembers ? "Loading GitHub members..." : "Select GitHub username"} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Skip GitHub linking)</SelectItem>
            {githubMembers.map((member) => (
              <SelectItem key={member.id} value={member.githubUsername}>
                <div className="flex items-center gap-2">
                  <Github className="h-3 w-3" />
                  <span className="font-mono text-sm">{member.githubUsername}</span>
                  {member.githubName && (
                    <span className="text-xs text-gray-500">({member.githubName})</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Link this employee to a GitHub organization member. Skills will be auto-detected from their commits.
        </p>
        {githubMembers.length === 0 && !loadingMembers && (
          <p className="text-sm text-amber-600">
            No unlinked GitHub members found. Run Auto-Discovery first from the Integrations page.
          </p>
        )}
      </div>

      {/* Preview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">Invitation Preview</h3>
          <p className="text-sm text-blue-800">
            {formData.firstName || '[First Name]'} {formData.lastName || '[Last Name]'} will be invited to join{' '}
            <span className="font-medium">{companyDomain}</span> as a{' '}
            <span className="font-medium">
              {formData.role ? employeeRoles.find(r => r.value === formData.role)?.label : '[Role]'}
            </span>
            {formData.title && (
              <> with the title <span className="font-medium">{formData.title}</span></>
            )}
            {formData.department && (
              <> in the <span className="font-medium">{formData.department}</span> department</>
            )}.
          </p>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/employees')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending Invitation..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  )
}
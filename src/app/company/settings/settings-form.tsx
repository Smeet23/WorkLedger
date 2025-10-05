"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2, Building2, Globe, Briefcase } from "lucide-react"

interface SettingsFormProps {
  settings: {
    id: string
    shareSkills: boolean
    shareAchievements: boolean
    shareProjectTypes: boolean
    shareTraining: boolean
    shareTenure: boolean
    companyBranding: boolean
    autoIssueEnabled: boolean
    minTrackingDays: number
  }
  company: {
    id: string
    name: string
    domain: string
    website: string | null
    industry: string | null
    size: string | null
  }
}

export function SettingsForm({ settings, company }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    shareSkills: settings.shareSkills,
    shareAchievements: settings.shareAchievements,
    shareProjectTypes: settings.shareProjectTypes,
    shareTraining: settings.shareTraining,
    shareTenure: settings.shareTenure,
    companyBranding: settings.companyBranding,
    autoIssueEnabled: settings.autoIssueEnabled,
    minTrackingDays: settings.minTrackingDays
  })

  const [companyData, setCompanyData] = useState({
    name: company.name,
    website: company.website || '',
    industry: company.industry || '',
    size: company.size || ''
  })

  const handleSwitchChange = (field: keyof typeof formData) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          ...formData,
          ...companyData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Profile */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Company Profile</CardTitle>
          <CardDescription className="text-slate-600">
            Update your company information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="domain" className="text-sm font-medium text-slate-700">
                Domain
              </Label>
              <Input
                id="domain"
                value={company.domain}
                disabled
                className="mt-2 bg-slate-50 text-slate-500"
                placeholder="company.com"
              />
              <p className="text-xs text-slate-500 mt-1">Domain cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                Website
              </Label>
              <div className="relative mt-2">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                  className="pl-10"
                  placeholder="https://company.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="industry" className="text-sm font-medium text-slate-700">
                Industry
              </Label>
              <div className="relative mt-2">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="industry"
                  value={companyData.industry}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, industry: e.target.value }))}
                  className="pl-10"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="size" className="text-sm font-medium text-slate-700">
                Company Size
              </Label>
              <div className="relative mt-2">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="size"
                  value={companyData.size}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, size: e.target.value }))}
                  className="pl-10"
                  placeholder="e.g., 1-10, 11-50, 51-200"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data Sharing */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Privacy & Data Sharing</CardTitle>
          <CardDescription className="text-slate-600">
            Control what employee information is visible in public profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="shareSkills" className="text-sm font-medium text-slate-900">
                  Share Skills
                </Label>
                <p className="text-sm text-slate-600">
                  Allow employee skills to be visible in public profiles
                </p>
              </div>
              <Switch
                id="shareSkills"
                checked={formData.shareSkills}
                onCheckedChange={handleSwitchChange('shareSkills')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="shareAchievements" className="text-sm font-medium text-slate-900">
                  Share Achievements
                </Label>
                <p className="text-sm text-slate-600">
                  Display employee achievements and certificates publicly
                </p>
              </div>
              <Switch
                id="shareAchievements"
                checked={formData.shareAchievements}
                onCheckedChange={handleSwitchChange('shareAchievements')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="shareProjectTypes" className="text-sm font-medium text-slate-900">
                  Share Project Types
                </Label>
                <p className="text-sm text-slate-600">
                  Show types of projects employees have worked on
                </p>
              </div>
              <Switch
                id="shareProjectTypes"
                checked={formData.shareProjectTypes}
                onCheckedChange={handleSwitchChange('shareProjectTypes')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="shareTraining" className="text-sm font-medium text-slate-900">
                  Share Training
                </Label>
                <p className="text-sm text-slate-600">
                  Display training and professional development activities
                </p>
              </div>
              <Switch
                id="shareTraining"
                checked={formData.shareTraining}
                onCheckedChange={handleSwitchChange('shareTraining')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="shareTenure" className="text-sm font-medium text-slate-900">
                  Share Tenure
                </Label>
                <p className="text-sm text-slate-600">
                  Show employment duration and start dates
                </p>
              </div>
              <Switch
                id="shareTenure"
                checked={formData.shareTenure}
                onCheckedChange={handleSwitchChange('shareTenure')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Settings */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Certificate Settings</CardTitle>
          <CardDescription className="text-slate-600">
            Configure certificate issuance and branding options
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="companyBranding" className="text-sm font-medium text-slate-900">
                  Company Branding
                </Label>
                <p className="text-sm text-slate-600">
                  Include company logo and colors on certificates
                </p>
              </div>
              <Switch
                id="companyBranding"
                checked={formData.companyBranding}
                onCheckedChange={handleSwitchChange('companyBranding')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="autoIssueEnabled" className="text-sm font-medium text-slate-900">
                  Auto-Issue Certificates
                </Label>
                <p className="text-sm text-slate-600">
                  Automatically generate certificates when tracking criteria is met
                </p>
              </div>
              <Switch
                id="autoIssueEnabled"
                checked={formData.autoIssueEnabled}
                onCheckedChange={handleSwitchChange('autoIssueEnabled')}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="py-3">
              <Label htmlFor="minTrackingDays" className="text-sm font-medium text-slate-900">
                Minimum Tracking Days
              </Label>
              <p className="text-sm text-slate-600 mt-1 mb-3">
                Number of days to track before issuing certificates
              </p>
              <Input
                id="minTrackingDays"
                type="number"
                min="1"
                max="365"
                value={formData.minTrackingDays}
                onChange={(e) => setFormData(prev => ({ ...prev, minTrackingDays: parseInt(e.target.value) || 30 }))}
                className="max-w-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="border-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

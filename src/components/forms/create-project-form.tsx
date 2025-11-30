'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X, Search, Code2, FolderKanban, Calendar, AlertCircle, Check } from 'lucide-react'

interface Skill {
  id: string
  name: string
  category: string
  description: string | null
  employeeCount: number
}

interface SkillsByCategory {
  category: string
  skills: Skill[]
}

export function CreateProjectForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Skills data
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Fetch skills on mount
  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch('/api/company/skills')
        if (response.ok) {
          const data = await response.json()
          setSkills(data.data.skills)
          setSkillsByCategory(data.data.skillsByCategory)
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      } finally {
        setIsLoadingSkills(false)
      }
    }
    fetchSkills()
  }, [])

  // Filter skills based on search and category
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    return matchesSearch && matchesCategory && !selectedSkills.includes(skill.id)
  })

  // Get selected skill objects
  const selectedSkillObjects = skills.filter(s => selectedSkills.includes(s.id))

  const handleAddSkill = (skillId: string) => {
    setSelectedSkills(prev => [...prev, skillId])
  }

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(prev => prev.filter(id => id !== skillId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (selectedSkills.length === 0) {
      setError('Please select at least one technology for the tech stack')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/company/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          priority: priority || undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          deadline: deadline ? new Date(deadline) : undefined,
          techStackIds: selectedSkills
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create project')
      }

      setSuccess(true)
      // Redirect to the project detail page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/projects/${data.data.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ['all', ...skillsByCategory.map(sc => sc.category)]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">Project Created Successfully!</h3>
            <p className="text-sm text-emerald-600">Redirecting to project details...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Project Details */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Project Details</CardTitle>
                <CardDescription className="text-slate-600">
                  Basic information about your project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., E-commerce Platform"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project goals, scope, and key features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-slate-700">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-semibold text-slate-700">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack Selection */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-200/50">
                <Code2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Tech Stack</CardTitle>
                <CardDescription className="text-slate-600">
                  Select the technologies required for this project. We'll recommend the best team members.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Skills */}
            {selectedSkillObjects.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Selected Technologies ({selectedSkillObjects.length})
                </Label>
                <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50">
                  {selectedSkillObjects.map((skill, index) => (
                    <Badge
                      key={skill.id}
                      className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer group/badge"
                      onClick={() => handleRemoveSkill(skill.id)}
                    >
                      <span className="text-xs text-indigo-400 mr-1">#{index + 1}</span>
                      {skill.name}
                      <X className="w-3 h-3 ml-1.5 opacity-50 group-hover/badge:opacity-100" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search technologies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-cyan-300 focus:ring-cyan-200"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-slate-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Available Skills */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Available Technologies
              </Label>
              {isLoadingSkills ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {skills.length === 0 ? 'No skills found in the system' : 'No matching technologies found'}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2">
                  {filteredSkills.map(skill => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleAddSkill(skill.id)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-left group"
                    >
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 text-sm truncate">{skill.name}</p>
                        <p className="text-xs text-slate-500">{skill.category}</p>
                      </div>
                      {skill.employeeCount > 0 && (
                        <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                          {skill.employeeCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !name || selectedSkills.length === 0}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

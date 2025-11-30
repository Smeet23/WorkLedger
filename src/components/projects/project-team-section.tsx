'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Crown, Trash2, Loader2, RefreshCw } from 'lucide-react'

// Server-side format (from initial props)
interface TeamMemberServer {
  id: string
  role: string | null
  isLead: boolean
  matchScore: number | null
  wasRecommended: boolean
  assignedAt: Date
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
    role: string
    title: string | null
    department: string | null
    skillRecords: Array<{
      skill: {
        id: string
        name: string
        category: string
      }
      level: string
      confidence: number | null
    }>
  }
}

// API response format (flat structure)
interface TeamMemberAPI {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  employeeRole: string
  title: string | null
  department: string | null
  projectRole: string | null
  isLead: boolean
  matchScore: number | null
  wasRecommended: boolean
  isActive: boolean
  assignedAt: string
  skills: Array<{
    id: string
    name: string
    category: string
    level: string
    confidence: number | null
  }>
}

// Normalized format for display
interface DisplayMember {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  employeeRole: string
  title: string | null
  department: string | null
  projectRole: string | null
  isLead: boolean
  matchScore: number | null
  wasRecommended: boolean
  skills: Array<{
    id: string
    name: string
    category: string
    level: string
    confidence: number | null
  }>
}

interface Props {
  projectId: string
  initialMembers: TeamMemberServer[]
  onMemberRemoved?: () => void
}

// Convert server format to display format
function normalizeServerMember(m: TeamMemberServer): DisplayMember {
  return {
    id: m.id,
    employeeId: m.employee.id,
    firstName: m.employee.firstName,
    lastName: m.employee.lastName,
    email: m.employee.email,
    avatarUrl: m.employee.avatarUrl,
    employeeRole: m.employee.role,
    title: m.employee.title,
    department: m.employee.department,
    projectRole: m.role,
    isLead: m.isLead,
    matchScore: m.matchScore,
    wasRecommended: m.wasRecommended,
    skills: m.employee.skillRecords.map(sr => ({
      id: sr.skill.id,
      name: sr.skill.name,
      category: sr.skill.category,
      level: sr.level,
      confidence: sr.confidence
    }))
  }
}

// Convert API format to display format
function normalizeAPIMember(m: TeamMemberAPI): DisplayMember {
  return {
    id: m.id,
    employeeId: m.employeeId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    avatarUrl: m.avatarUrl,
    employeeRole: m.employeeRole,
    title: m.title,
    department: m.department,
    projectRole: m.projectRole,
    isLead: m.isLead,
    matchScore: m.matchScore,
    wasRecommended: m.wasRecommended,
    skills: m.skills || []
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case 'EXPERT': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'ADVANCED': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'INTERMEDIATE': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'BEGINNER': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function ProjectTeamSection({ projectId, initialMembers, onMemberRemoved }: Props) {
  // Normalize initial members from server format
  const [members, setMembers] = useState<DisplayMember[]>(() =>
    initialMembers.map(normalizeServerMember)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  // Fetch fresh data when component mounts or key changes
  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/company/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        // Normalize API response format
        setMembers(data.data.members.map(normalizeAPIMember))
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    setRemovingMember(employeeId)
    try {
      const response = await fetch(`/api/company/projects/${projectId}/members?employeeId=${employeeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to remove member')
      }

      setMembers(prev => prev.filter(m => m.employeeId !== employeeId))
      onMemberRemoved?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
      <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Current Team ({members.length})</CardTitle>
                <CardDescription className="text-slate-600">
                  Team members assigned to this project
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchMembers} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && members.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200/50 mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No team members yet</h3>
              <p className="mt-2 text-slate-600 max-w-sm mx-auto">
                Add team members from the recommendations below based on their skills.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="group/member relative border border-slate-200/60 rounded-xl p-5 bg-white/80 hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center border border-purple-200/50">
                          <span className="text-purple-600 font-bold text-lg">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </span>
                        </div>
                        {member.isLead && (
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200">
                            <Crown className="w-3 h-3 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-lg">
                            {member.firstName} {member.lastName}
                          </h4>
                          {member.isLead && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              Team Lead
                            </Badge>
                          )}
                          {member.wasRecommended && (
                            <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                              AI Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-slate-200">
                            {member.employeeRole}
                          </Badge>
                          {member.title && (
                            <span className="text-xs text-slate-500">• {member.title}</span>
                          )}
                          {member.department && (
                            <span className="text-xs text-slate-500">• {member.department}</span>
                          )}
                        </div>
                        {member.matchScore && (
                          <p className="text-xs text-indigo-600 mt-1">
                            {Math.round(member.matchScore * 100)}% match score
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.employeeId)}
                      disabled={removingMember === member.employeeId}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      {removingMember === member.employeeId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Member Skills */}
                  {member.skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.slice(0, 8).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={getLevelColor(skill.level)}
                          >
                            {skill.name}
                            <span className="ml-1 text-xs opacity-75">{skill.level}</span>
                          </Badge>
                        ))}
                        {member.skills.length > 8 && (
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                            +{member.skills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Users, Plus, CheckCircle2, AlertCircle, Sparkles, UserPlus, X, RefreshCw } from 'lucide-react'

interface TeamMember {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  role: string
  title: string | null
  department: string | null
  matchScore: number
  matchPercentage: number
  matchedSkills: Array<{
    skillId: string
    skillName: string
    level: string
    confidence: number | null
    isRequired: boolean
    priority: number
  }>
  totalSkills: number
  currentProjectCount: number
}

interface SkillCoverage {
  skillId: string
  skillName: string
  isRequired: boolean
  coveredBy: Array<{
    employeeId: string
    name: string
    level: string
  }>
}

interface RecommendationData {
  projectId: string
  projectName: string
  techStack: Array<{
    id: string
    name: string
    category: string
    isRequired: boolean
    priority: number
  }>
  recommendations: TeamMember[]
  alreadyAssigned: Array<{
    employeeId: string
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
    matchScore: number
    matchPercentage: number
    matchedSkills: Array<{
      skillId: string
      skillName: string
      level: string
      confidence: number | null
      isRequired: boolean
    }>
  }>
  coverage: {
    totalSkills: number
    coveredSkills: number
    uncoveredSkills: number
    coveragePercentage: number
    skillBreakdown: SkillCoverage[]
    gaps: Array<{
      skillId: string
      skillName: string
      isRequired: boolean
    }>
  }
  totalCandidates: number
}

interface Props {
  projectId: string
  onMemberAdded?: () => void
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

export function TeamRecommendations({ projectId, onMemberAdded }: Props) {
  const [data, setData] = useState<RecommendationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingMember, setAddingMember] = useState<string | null>(null)
  const [addedMembers, setAddedMembers] = useState<Set<string>>(new Set())
  const [teamSize, setTeamSize] = useState(5)

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/company/projects/${projectId}/recommend-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSize })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch recommendations')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [projectId, teamSize])

  const handleAddMember = async (member: TeamMember) => {
    setAddingMember(member.employeeId)
    try {
      const response = await fetch(`/api/company/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: member.employeeId,
          matchScore: member.matchScore,
          wasRecommended: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to add member')
      }

      setAddedMembers(prev => new Set(Array.from(prev).concat(member.employeeId)))
      onMemberAdded?.()

      // Refresh recommendations
      fetchRecommendations()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAddingMember(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-slate-600">Analyzing team skills and generating recommendations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200/60 bg-red-50/50">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchRecommendations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Coverage Summary */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-200/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Skill Coverage</CardTitle>
                  <CardDescription className="text-slate-600">
                    How well the recommended team covers the tech stack
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">{data.coverage.coveragePercentage}%</p>
                <p className="text-sm text-slate-500">{data.coverage.coveredSkills}/{data.coverage.totalSkills} skills</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={data.coverage.coveragePercentage} className="h-2 mb-4" />

            {/* Skill Gaps */}
            {data.coverage.gaps.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-800">Skill Gaps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.coverage.gaps.map(gap => (
                    <Badge
                      key={gap.skillId}
                      variant="outline"
                      className={gap.isRequired ? 'border-red-200 text-red-700 bg-red-50' : 'border-amber-200 text-amber-700 bg-amber-50'}
                    >
                      {gap.skillName}
                      {gap.isRequired && <span className="ml-1 text-xs">(Required)</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Size Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700">Show top</span>
          <select
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-300 focus:ring-indigo-200"
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
          <span className="text-sm font-semibold text-slate-700">recommendations</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRecommendations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Recommendations */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Recommended Team</CardTitle>
                <CardDescription className="text-slate-600">
                  Best candidates based on skills, experience, and availability ({data.totalCandidates} total candidates)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.recommendations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No available candidates found with matching skills
              </div>
            ) : (
              <div className="space-y-4">
                {data.recommendations.map((member, index) => (
                  <div
                    key={member.employeeId}
                    className={`group/member relative border rounded-xl p-5 transition-all ${
                      addedMembers.has(member.employeeId)
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200/60 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="h-14 w-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border border-indigo-200/50">
                            <span className="text-indigo-600 font-bold text-lg">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-indigo-600">#{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">
                            {member.firstName} {member.lastName}
                          </h4>
                          <p className="text-sm text-slate-600">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-slate-200">
                              {member.role}
                            </Badge>
                            {member.title && (
                              <span className="text-xs text-slate-500">• {member.title}</span>
                            )}
                            {member.department && (
                              <span className="text-xs text-slate-500">• {member.department}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">{member.matchPercentage}%</p>
                          <p className="text-xs text-slate-500">Match Score</p>
                        </div>

                        {addedMembers.has(member.employeeId) ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Added
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(member)}
                            disabled={addingMember === member.employeeId}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          >
                            {addingMember === member.employeeId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Matching Skills ({member.matchedSkills.length}/{data.techStack.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {member.matchedSkills.map(skill => (
                          <Badge
                            key={skill.skillId}
                            variant="outline"
                            className={getLevelColor(skill.level)}
                          >
                            {skill.skillName}
                            <span className="ml-1 text-xs opacity-75">{skill.level}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>{member.totalSkills} total skills</span>
                      <span>•</span>
                      <span>{member.currentProjectCount} current projects</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TeamRecommendations } from './team-recommendations'
import { ProjectTeamSection } from './project-team-section'
import { Target } from 'lucide-react'

interface TeamMember {
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

interface Props {
  projectId: string
  initialMembers: TeamMember[]
}

export function ProjectTeamManager({ projectId, initialMembers }: Props) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleMemberAdded = useCallback(() => {
    // Increment the key to force re-render of ProjectTeamSection
    setRefreshKey(prev => prev + 1)
    // Also refresh the server data
    router.refresh()
  }, [router])

  const handleMemberRemoved = useCallback(() => {
    // Refresh recommendations when a member is removed
    setRefreshKey(prev => prev + 1)
    router.refresh()
  }, [router])

  return (
    <div className="space-y-8">
      {/* Current Team Section */}
      <ProjectTeamSection
        key={`team-${refreshKey}`}
        projectId={projectId}
        initialMembers={initialMembers}
        onMemberRemoved={handleMemberRemoved}
      />

      {/* Team Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Team Recommendations</h2>
            <p className="text-slate-600">AI-powered suggestions based on the tech stack</p>
          </div>
        </div>

        <TeamRecommendations
          key={`recs-${refreshKey}`}
          projectId={projectId}
          onMemberAdded={handleMemberAdded}
        />
      </div>
    </div>
  )
}

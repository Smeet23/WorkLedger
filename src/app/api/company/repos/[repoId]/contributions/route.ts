import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createApiResponse } from '@/lib/api-response'

const apiResponse = createApiResponse()

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return apiResponse.unauthorized('Authentication required')
    }

    // Check if user is a company admin or manager
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return apiResponse.notFound('User not found')
    }

    // Get employee record with company info
    const userEmployee = await db.employee.findFirst({
      where: { email: user.email },
      include: { company: true }
    })

    // Get the repository with all commits and company info
    const repository = await db.repository.findUnique({
      where: { id: params.repoId },
      include: {
        company: true,
        commits: {
          orderBy: { authorDate: 'desc' }
        },
        employeeRepositories: {
          include: {
            employee: true
          }
        }
      }
    })

    if (!repository) {
      return apiResponse.notFound('Repository not found')
    }

    // Check access permissions
    const isCompanyAdmin = user.role === 'company_admin' && userEmployee?.company?.id === repository.companyId
    const isManager = userEmployee?.role === 'MANAGER' && userEmployee?.companyId === repository.companyId
    const isContributor = repository.employeeRepositories.some(er => er.employeeId === userEmployee?.id)

    if (!isCompanyAdmin && !isManager && !isContributor) {
      return apiResponse.forbidden('Access denied')
    }

    // Group commits by author
    const contributorMap = new Map<string, {
      name: string
      email: string
      commits: number
      additions: number
      deletions: number
      filesChanged: number
      firstCommit: Date
      lastCommit: Date
    }>()

    repository.commits.forEach(commit => {
      const key = commit.authorEmail
      const existing = contributorMap.get(key)
      
      if (existing) {
        existing.commits++
        existing.additions += commit.additions
        existing.deletions += commit.deletions
        existing.filesChanged += commit.filesChanged
        if (commit.authorDate < existing.firstCommit) {
          existing.firstCommit = commit.authorDate
        }
        if (commit.authorDate > existing.lastCommit) {
          existing.lastCommit = commit.authorDate
        }
      } else {
        contributorMap.set(key, {
          name: commit.authorName,
          email: commit.authorEmail,
          commits: 1,
          additions: commit.additions,
          deletions: commit.deletions,
          filesChanged: commit.filesChanged,
          firstCommit: commit.authorDate,
          lastCommit: commit.authorDate
        })
      }
    })

    // Convert to array and sort by commits
    const contributors = Array.from(contributorMap.values())
      .sort((a, b) => b.commits - a.commits)

    // Calculate repository statistics
    const stats = {
      totalCommits: repository.commits.length,
      totalContributors: contributors.length,
      totalAdditions: repository.commits.reduce((sum, c) => sum + c.additions, 0),
      totalDeletions: repository.commits.reduce((sum, c) => sum + c.deletions, 0),
      totalFilesChanged: repository.commits.reduce((sum, c) => sum + c.filesChanged, 0),
      primaryLanguage: repository.primaryLanguage,
      languages: repository.languages,
      frameworks: repository.frameworks
    }

    // Get commit activity over time (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const monthlyActivity = new Map<string, number>()
    repository.commits
      .filter(c => c.authorDate >= twelveMonthsAgo)
      .forEach(commit => {
        const monthKey = `${commit.authorDate.getFullYear()}-${String(commit.authorDate.getMonth() + 1).padStart(2, '0')}`
        monthlyActivity.set(monthKey, (monthlyActivity.get(monthKey) || 0) + 1)
      })

    // Convert to sorted array
    const activityData = Array.from(monthlyActivity.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))

    // Get recent commits
    const recentCommits = repository.commits
      .slice(0, 10)
      .map(commit => ({
        sha: commit.sha,
        message: commit.message,
        authorName: commit.authorName,
        authorEmail: commit.authorEmail,
        authorDate: commit.authorDate,
        additions: commit.additions,
        deletions: commit.deletions,
        filesChanged: commit.filesChanged
      }))

    // Get the main contributors (top contributor as "owner")
    const topContributors = repository.employeeRepositories
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 3)
      .map(er => ({
        id: er.employee.id,
        name: `${er.employee.firstName} ${er.employee.lastName}`,
        email: er.employee.email,
        title: er.employee.title,
        department: er.employee.department,
        commitCount: er.commitCount
      }))

    return apiResponse.success({
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        isPrivate: repository.isPrivate,
        htmlUrl: `https://github.com/${repository.fullName}`,
        createdAt: repository.githubCreatedAt,
        updatedAt: repository.updatedAt,
        stars: repository.stars,
        forks: repository.forks,
        openIssues: repository.openIssues,
        topContributors
      },
      stats,
      contributors,
      activityData,
      recentCommits,
      accessLevel: isCompanyAdmin ? 'admin' : (isManager ? 'manager' : 'contributor')
    })
  } catch (error) {
    console.error('Failed to fetch repository contributions:', error)
    return apiResponse.internalError('Failed to fetch repository contributions')
  }
}
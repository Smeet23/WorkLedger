import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a company admin or manager
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get employee record with company info
    const userEmployee = await db.employee.findFirst({
      where: { email: user.email },
      include: { company: true }
    })

    // Get the repository with all commits and employee info
    const repository = await db.repository.findUnique({
      where: { id: params.repoId },
      include: {
        employee: {
          include: {
            company: true
          }
        },
        commits: {
          orderBy: { authorDate: 'desc' }
        }
      }
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Check access permissions
    const isCompanyAdmin = user.role === 'company_admin' && userEmployee?.company?.id === repository.employee.companyId
    const isManager = userEmployee?.role === 'MANAGER' && userEmployee?.companyId === repository.employee.companyId
    const isOwner = userEmployee?.id === repository.employeeId

    if (!isCompanyAdmin && !isManager && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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

    return NextResponse.json({
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        isPrivate: repository.isPrivate,
        htmlUrl: `https://github.com/${repository.fullName}`,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt,
        stars: repository.stars,
        forks: repository.forks,
        openIssues: repository.openIssues,
        owner: {
          id: repository.employee.id,
          name: `${repository.employee.firstName} ${repository.employee.lastName}`,
          email: repository.employee.email,
          title: repository.employee.title,
          department: repository.employee.department
        }
      },
      stats,
      contributors,
      activityData,
      recentCommits,
      accessLevel: isCompanyAdmin ? 'admin' : (isManager ? 'manager' : 'owner')
    })
  } catch (error) {
    console.error('Failed to fetch repository contributions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository contributions' },
      { status: 500 }
    )
  }
}
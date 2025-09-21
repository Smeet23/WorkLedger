import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitHubService } from '@/services/github/client'
import { SkillDetector } from '@/services/skills/detector'
import { db } from '@/lib/db'
import { subMonths } from 'date-fns'

export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employee record
    const employee = await db.employee.findFirst({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get GitHub connection
    const connection = await GitHubService.getConnection(employee.id)

    if (!connection?.isActive) {
      return NextResponse.json({ error: 'No active GitHub connection' }, { status: 404 })
    }

    // Create GitHub client
    const github = new GitHubService(connection.accessToken)

    console.log('Starting GitHub sync for:', connection.githubUsername)

    const allRepos = []
    const repoIds = new Set<number>() // Track unique repos by ID

    // 1. Fetch ALL accessible repositories (owned, member, collaborator, private)
    console.log('Fetching all accessible repositories...')
    let page = 1
    let hasMore = true

    while (hasMore) {
      const repos = await github.getAllAccessibleRepos(page, 100)

      // Add only unique repos
      for (const repo of repos) {
        if (!repoIds.has(repo.id)) {
          repoIds.add(repo.id)
          allRepos.push(repo)
        }
      }

      if (repos.length < 100) {
        hasMore = false
      } else {
        page++
      }

      console.log(`Fetched page ${page - 1}: ${repos.length} repos (total: ${allRepos.length})`)
    }

    // 2. Also fetch contributed repositories (where user has merged PRs)
    console.log('Fetching contributed repositories...')
    const contributedRepos = await github.searchContributedRepos(connection.githubUsername, 1)

    for (const repo of contributedRepos) {
      if (!repoIds.has(repo.id)) {
        repoIds.add(repo.id)
        allRepos.push(repo)
      }
    }

    console.log(`Found ${allRepos.length} total repositories`)

    // Process each repository
    const processedRepos = []
    const allLanguages = new Set<string>()
    const allFrameworks = new Set<string>()
    let syncedCommits = 0
    let syncedPRs = 0

    for (let index = 0; index < Math.min(allRepos.length, 30); index++) { // Process up to 30 repos in quick sync
      const repo = allRepos[index]
      try {
        console.log(`Processing repository ${index + 1}/${Math.min(allRepos.length, 30)}: ${repo.name}`)

        // Get languages for each repo
        const languages = await github.getRepoLanguages(repo.owner.login, repo.name)

        // Detect frameworks
        const frameworks = await github.detectFrameworks(repo.owner.login, repo.name)

        // Fetch recent commits (last 6 months for quick sync)
        const since = subMonths(new Date(), 6)
        let commitPage = 1
        let hasMoreCommits = true
        const commits = []

        while (hasMoreCommits && commits.length < 100) { // Limit to 100 commits per repo in quick sync
          const pageCommits = await github.getRepoCommits(
            repo.owner.login,
            repo.name,
            since,
            undefined,
            commitPage
          )

          if (pageCommits.length === 0) {
            hasMoreCommits = false
          } else {
            commits.push(...pageCommits)
            if (pageCommits.length < 100) {
              hasMoreCommits = false
            } else {
              commitPage++
            }
          }
        }

        // Filter commits by the user
        const userCommits = commits.filter(commit =>
          commit.author?.login === connection.githubUsername ||
          commit.commit.author?.email === employee.email
        )

        // Get pull requests
        const pullRequests = await github.getRepoPullRequests(repo.owner.login, repo.name)
        const userPRs = pullRequests.filter(pr => pr.user?.login === connection.githubUsername)

        // Save or update repository in database FIRST
        const savedRepo = await db.repository.upsert({
          where: { githubRepoId: String(repo.id) },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            homepage: repo.homepage,
            defaultBranch: repo.default_branch,
            isPrivate: repo.private,
            isFork: repo.fork,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            size: repo.size,
            openIssues: repo.open_issues_count,
            primaryLanguage: repo.language,
            languages,
            frameworks,
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
            updatedAt: new Date()
          },
          create: {
            employeeId: employee.id,
            githubRepoId: String(repo.id),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            homepage: repo.homepage,
            defaultBranch: repo.default_branch,
            isPrivate: repo.private,
            isFork: repo.fork,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            size: repo.size,
            openIssues: repo.open_issues_count,
            primaryLanguage: repo.language,
            languages,
            frameworks,
            createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date()
          }
        })

        // Save commits to database (now that we have the repository ID)
        console.log(`Saving ${commits.length} commits for ${repo.name}`)
        for (const commit of commits) { // Save all fetched commits
          try {
            await db.commit.upsert({
              where: { sha: commit.sha },
              update: {
                message: commit.commit.message,
                authorName: commit.commit.author?.name || 'Unknown',
                authorEmail: commit.commit.author?.email || 'unknown@email.com',
                authorDate: new Date(commit.commit.author?.date || Date.now()),
                htmlUrl: commit.html_url
              },
              create: {
                repositoryId: savedRepo.id, // Now we have the correct repository ID
                sha: commit.sha,
                message: commit.commit.message,
                authorName: commit.commit.author?.name || 'Unknown',
                authorEmail: commit.commit.author?.email || 'unknown@email.com',
                authorDate: new Date(commit.commit.author?.date || Date.now()),
                committerName: commit.commit.committer?.name,
                committerEmail: commit.commit.committer?.email,
                commitDate: new Date(commit.commit.committer?.date || Date.now()),
                additions: 0,
                deletions: 0,
                filesChanged: 0,
                files: [],
                htmlUrl: commit.html_url,
                apiUrl: commit.url,
                parentShas: commit.parents?.map(p => p.sha) || []
              }
            })
          } catch (error) {
            console.error(`Error saving commit ${commit.sha}:`, error)
          }
        }

        // Create repository activity record
        const periodStart = since
        const periodEnd = new Date()

        await db.repositoryActivity.upsert({
          where: {
            repositoryId_periodStart_periodEnd: {
              repositoryId: savedRepo.id,
              periodStart,
              periodEnd
            }
          },
          update: {
            commits: userCommits.length,
            pullRequests: userPRs.length,
            issues: 0,
            reviews: 0,
            linesAdded: userCommits.reduce((sum, c) => sum + (c.stats?.additions || 0), 0),
            linesDeleted: userCommits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0),
            filesChanged: userCommits.reduce((sum, c) => sum + (c.files?.length || 0), 0),
            detectedSkills: {
              languages: Object.keys(languages),
              frameworks
            }
          },
          create: {
            repositoryId: savedRepo.id,
            periodStart,
            periodEnd,
            commits: userCommits.length,
            pullRequests: userPRs.length,
            issues: 0,
            reviews: 0,
            linesAdded: userCommits.reduce((sum, c) => sum + (c.stats?.additions || 0), 0),
            linesDeleted: userCommits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0),
            filesChanged: userCommits.reduce((sum, c) => sum + (c.files?.length || 0), 0),
            detectedSkills: {
              languages: Object.keys(languages),
              frameworks
            }
          }
        })

        processedRepos.push(savedRepo)
        syncedCommits += userCommits.length
        syncedPRs += userPRs.length

        // Collect all languages and frameworks
        Object.keys(languages).forEach(lang => allLanguages.add(lang))
        frameworks.forEach(fw => allFrameworks.add(fw))

      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error)
        // Continue with next repo
      }
    }

    // Create skills if they don't exist
    console.log('Creating skills in database...')

    for (const language of Array.from(allLanguages)) {
      await db.skill.upsert({
        where: { name: language.toLowerCase() },
        update: {},
        create: {
          name: language.toLowerCase(),
          category: 'Programming Language',
          description: `${language} programming language`
        }
      })
    }

    for (const framework of Array.from(allFrameworks)) {
      await db.skill.upsert({
        where: { name: framework.toLowerCase() },
        update: {},
        create: {
          name: framework.toLowerCase(),
          category: 'Framework',
          description: `${framework} framework/library`
        }
      })
    }

    // Use skill detector to detect and save skills
    console.log('Detecting skills from repositories...')
    const detector = new SkillDetector()
    const detectedSkills = await detector.detectFromRepositories(employee.id)

    // Save detected skills
    await detector.saveDetectedSkills(employee.id, detectedSkills)

    // Also detect practices
    const practices = await detector.detectPractices(employee.id)

    // Save practice skills
    for (const practice of practices) {
      const skill = await db.skill.upsert({
        where: { name: practice.name },
        update: {},
        create: {
          name: practice.name,
          category: practice.category,
          description: `${practice.name} best practice`
        }
      })

      await db.skillRecord.upsert({
        where: {
          employeeId_skillId: {
            employeeId: employee.id,
            skillId: skill.id
          }
        },
        update: {
          level: practice.level,
          confidence: practice.confidence,
          isAutoDetected: true,
          source: 'github',
          updatedAt: new Date()
        },
        create: {
          employeeId: employee.id,
          skillId: skill.id,
          level: practice.level,
          confidence: practice.confidence,
          isAutoDetected: true,
          source: 'github'
        }
      })
    }

    // Update last sync time
    await db.gitHubConnection.update({
      where: { id: connection.id },
      data: { lastSync: new Date() }
    })

    // Get updated counts
    const [totalRepos, totalCommits, skillCount] = await Promise.all([
      db.repository.count({ where: { employeeId: employee.id } }),
      db.commit.count({
        where: {
          repository: { employeeId: employee.id }
        }
      }),
      db.skillRecord.count({ where: { employeeId: employee.id } })
    ])

    console.log(`Sync complete! Total repos: ${totalRepos}, Total commits: ${totalCommits}, Skills: ${skillCount}`)

    return NextResponse.json({
      success: true,
      message: 'GitHub sync completed successfully',
      data: {
        repositories: processedRepos.length,
        totalRepos,
        totalCommits,
        languages: Array.from(allLanguages),
        frameworks: Array.from(allFrameworks),
        skills: detectedSkills.map(s => ({
          name: s.name,
          level: s.level,
          confidence: s.confidence
        })),
        totalPRs: syncedPRs,
        skillCount
      }
    })
  } catch (error) {
    console.error('GitHub sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync GitHub repositories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
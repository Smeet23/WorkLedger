import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { GitHubService } from '@/services/github/client'
import { SkillDetector } from '@/services/skills/detector'
import { db } from '@/lib/db'
import { subYears } from 'date-fns'

export async function POST(request: NextRequest) {
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

    console.log('Starting COMPLETE GitHub sync for:', connection.githubUsername)

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

    // Process statistics
    const syncStats = {
      totalRepos: allRepos.length,
      totalCommits: 0,
      totalPRs: 0,
      languages: new Set<string>(),
      frameworks: new Set<string>(),
      processedRepos: [] as Array<{ name: string; commits: number; languages: string[] }>
    }

    // Process each repository
    for (let index = 0; index < allRepos.length; index++) {
      const repo = allRepos[index]
      try {
        console.log(`Processing repository ${index + 1}/${allRepos.length}: ${repo.name}`)

        // Get languages for each repo
        const languages = await github.getRepoLanguages(repo.owner.login, repo.name)

        // Detect frameworks
        const frameworks = await github.detectFrameworks(repo.owner.login, repo.name)

        // Save or update repository in database
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
            companyId: employee.companyId,
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
            githubCreatedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastActivityAt: repo.updated_at ? new Date(repo.updated_at) : new Date()
          }
        })

        // Create or update employee-repository relationship
        await db.employeeRepository.upsert({
          where: {
            employeeId_repositoryId: {
              employeeId: employee.id,
              repositoryId: savedRepo.id
            }
          },
          update: {
            lastActivityAt: new Date()
          },
          create: {
            employeeId: employee.id,
            repositoryId: savedRepo.id
          }
        })

        // Fetch ALL commits for this repository (no date or page limits!)
        let commitPage = 1
        let hasMoreCommits = true
        let repoCommitCount = 0

        console.log(`Fetching all commits for ${repo.name}...`)

        while (hasMoreCommits) {
          try {
            // Fetch commits without date restrictions to get ALL commits
            const commits = await github.getRepoCommits(
              repo.owner.login,
              repo.name,
              undefined, // No since date - get all commits
              undefined, // No until date
              commitPage
            )

            if (commits.length === 0) {
              hasMoreCommits = false
              break
            }

            console.log(`  Page ${commitPage}: ${commits.length} commits`)

            // Save ALL commits to database
            for (const commit of commits) {
              try {
                // For first page of commits, try to get detailed info
                let additions = 0
                let deletions = 0
                let filesChanged = 0
                let files: string[] = []

                // Only fetch details for first 10 commits to avoid rate limiting
                if (commitPage === 1 && repoCommitCount < 10) {
                  const details = await github.getCommitDetails(repo.owner.login, repo.name, commit.sha)
                  if (details) {
                    additions = details.stats?.additions || 0
                    deletions = details.stats?.deletions || 0
                    filesChanged = details.files?.length || 0
                    files = details.files?.map(f => f.filename) || []
                  }
                }

                await db.commit.upsert({
                  where: { sha: commit.sha },
                  update: {
                    message: commit.commit.message,
                    authorName: commit.commit.author?.name || 'Unknown',
                    authorEmail: commit.commit.author?.email || 'unknown@email.com',
                    authorDate: new Date(commit.commit.author?.date || Date.now()),
                    committerName: commit.commit.committer?.name,
                    committerEmail: commit.commit.committer?.email,
                    commitDate: new Date(commit.commit.committer?.date || Date.now()),
                    additions,
                    deletions,
                    filesChanged,
                    files,
                    htmlUrl: commit.html_url,
                    apiUrl: commit.url,
                    parentShas: commit.parents?.map(p => p.sha) || []
                  },
                  create: {
                    repositoryId: savedRepo.id,
                    sha: commit.sha,
                    message: commit.commit.message,
                    authorName: commit.commit.author?.name || 'Unknown',
                    authorEmail: commit.commit.author?.email || 'unknown@email.com',
                    authorDate: new Date(commit.commit.author?.date || Date.now()),
                    committerName: commit.commit.committer?.name,
                    committerEmail: commit.commit.committer?.email,
                    commitDate: new Date(commit.commit.committer?.date || Date.now()),
                    additions,
                    deletions,
                    filesChanged,
                    files,
                    htmlUrl: commit.html_url,
                    apiUrl: commit.url,
                    parentShas: commit.parents?.map(p => p.sha) || []
                  }
                })
                repoCommitCount++
              } catch (error) {
                console.error(`Error saving commit ${commit.sha}:`, error)
              }
            }

            // Check if there are more commits
            if (commits.length < 100) {
              hasMoreCommits = false
            } else {
              commitPage++
            }

            // Add a small delay every 10 pages to avoid rate limiting
            if (commitPage % 10 === 0) {
              console.log(`  Pausing to avoid rate limits...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch (error) {
            console.error(`Error fetching commits for ${repo.name} page ${commitPage}:`, error)
            hasMoreCommits = false
          }
        }

        // Update repository with total commits
        await db.repository.update({
          where: { id: savedRepo.id },
          data: { totalCommits: repoCommitCount }
        })

        // Get pull requests
        try {
          const pullRequests = await github.getRepoPullRequests(repo.owner.login, repo.name)
          const userPRs = pullRequests.filter(pr => pr.user?.login === connection.githubUsername)
          syncStats.totalPRs += userPRs.length
        } catch (error) {
          console.error(`Error fetching PRs for ${repo.name}:`, error)
        }

        // Update stats
        syncStats.totalCommits += repoCommitCount
        Object.keys(languages).forEach(lang => syncStats.languages.add(lang))
        frameworks.forEach(fw => syncStats.frameworks.add(fw))
        syncStats.processedRepos.push({
          name: repo.name,
          commits: repoCommitCount,
          languages: Object.keys(languages)
        })

      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error)
        // Continue with next repo
      }
    }

    // Create skills if they don't exist
    console.log('Creating skills in database...')

    for (const language of Array.from(syncStats.languages)) {
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

    for (const framework of Array.from(syncStats.frameworks)) {
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

    // Update last sync time
    await db.gitHubConnection.update({
      where: { id: connection.id },
      data: { lastSync: new Date() }
    })

    // Get updated counts
    const [totalRepos, totalCommits, totalSkills] = await Promise.all([
      db.employeeRepository.count({ where: { employeeId: employee.id } }),
      db.commit.count({
        where: {
          repository: { companyId: employee.companyId }
        }
      }),
      db.skillRecord.count({ where: { employeeId: employee.id } })
    ])

    console.log(`Complete sync finished! Repos: ${totalRepos}, Commits: ${totalCommits}, Skills: ${totalSkills}`)

    return NextResponse.json({
      success: true,
      message: 'Complete GitHub sync successful',
      data: {
        totalRepos,
        totalCommits,
        totalSkills,
        totalPRs: syncStats.totalPRs,
        languages: Array.from(syncStats.languages),
        frameworks: Array.from(syncStats.frameworks),
        processedRepos: syncStats.processedRepos
      }
    })
  } catch (error) {
    console.error('GitHub complete sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync GitHub repositories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
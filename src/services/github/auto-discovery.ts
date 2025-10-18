import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { githubTokenManager, GitHubTokenType } from '@/lib/github-token-manager'
import { NotFoundError, ExternalServiceError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { Octokit } from '@octokit/rest'
import { SkillLevel } from '@prisma/client'

export class GitHubAutoDiscoveryService {
  private readonly logger = loggers.external('github_auto_discovery')

  /**
   * Get GitHub client for company using app installation
   */
  private async getCompanyClient(companyId: string): Promise<Octokit> {
    const tokenData = await githubTokenManager.getCompanyTokens(
      companyId,
      GitHubTokenType.APP_INSTALLATION
    )

    if (!tokenData) {
      throw new NotFoundError('GitHub App installation', companyId)
    }

    return new Octokit({
      auth: tokenData.accessToken,
      userAgent: `${config.app.name}/1.0.0`,
    })
  }

  /**
   * Discover all organization members automatically
   */
  async discoverOrganizationMembers(companyId: string): Promise<{
    discovered: number
    matched: number
    unmatched: number
  }> {
    const companyLogger = this.logger.withCompany(companyId)

    try {
      const octokit = await this.getCompanyClient(companyId)

      // Get organization info
      const installation = await db.gitHubInstallation.findFirst({
        where: { companyId, isActive: true }
      })

      if (!installation) {
        throw new NotFoundError('GitHub installation', companyId)
      }

      companyLogger.info('Starting organization member discovery', {
        organization: installation.accountLogin
      })

      // Fetch all organization members
      const { data: members } = await octokit.rest.orgs.listMembers({
        org: installation.accountLogin,
        per_page: 100
      })

      let discovered = 0
      let matched = 0
      let unmatched = 0

      // Process each member
      for (const member of members) {
        try {
          // Get detailed member info
          const { data: memberDetails } = await octokit.rest.users.getByUsername({
            username: member.login
          })

          // Store organization member
          await db.gitHubOrganizationMember.upsert({
            where: {
              companyId_githubUserId: {
                companyId,
                githubUserId: member.id
              }
            },
            update: {
              githubUsername: member.login,
              githubEmail: memberDetails.email,
              githubName: memberDetails.name,
              lastActivityAt: new Date(),
              isActive: true
            },
            create: {
              companyId,
              githubUserId: member.id,
              githubUsername: member.login,
              githubEmail: memberDetails.email,
              githubName: memberDetails.name,
              orgRole: 'member'
            }
          })

          discovered++

          // Attempt automatic matching
          const matchResult = await this.matchMemberToEmployee(companyId, member, memberDetails)
          if (matchResult.matched) {
            matched++
            companyLogger.info('Successfully matched GitHub member to employee', {
              githubUsername: member.login,
              employeeId: matchResult.employeeId,
              confidence: matchResult.confidence,
              method: matchResult.method
            })
          } else {
            unmatched++
            companyLogger.info('Could not match GitHub member to employee', {
              githubUsername: member.login,
              githubEmail: memberDetails.email,
              githubName: memberDetails.name
            })
          }

        } catch (memberError) {
          companyLogger.error('Failed to process organization member', memberError, {
            githubUsername: member.login
          })
          // Continue with next member
        }
      }

      companyLogger.info('Organization member discovery completed', {
        discovered,
        matched,
        unmatched,
        organization: installation.accountLogin
      })

      return { discovered, matched, unmatched }

    } catch (error) {
      companyLogger.error('Organization member discovery failed', error)
      throw new ExternalServiceError('GitHub', 'Failed to discover organization members')
    }
  }

  /**
   * Match GitHub organization member to company employee
   */
  private async matchMemberToEmployee(
    companyId: string,
    member: any,
    memberDetails: any
  ): Promise<{ matched: boolean; employeeId?: string; confidence: number; method?: string }> {

    // Strategy 1: Email matching (highest confidence)
    if (memberDetails.email) {
      const employeeByEmail = await db.employee.findFirst({
        where: {
          companyId,
          email: { equals: memberDetails.email, mode: 'insensitive' }
        }
      })

      if (employeeByEmail) {
        await this.linkEmployeeToGitHub(employeeByEmail.id, member, memberDetails, 'email', 0.95)
        return { matched: true, employeeId: employeeByEmail.id, confidence: 0.95, method: 'email' }
      }
    }

    // Strategy 2: Name matching (medium confidence)
    if (memberDetails.name) {
      const nameParts = memberDetails.name.toLowerCase().split(' ')
      if (nameParts.length >= 2) {
        const firstName = nameParts[0]
        const lastName = nameParts[nameParts.length - 1]

        const employeeByName = await db.employee.findFirst({
          where: {
            companyId,
            firstName: { equals: firstName, mode: 'insensitive' },
            lastName: { equals: lastName, mode: 'insensitive' }
          }
        })

        if (employeeByName) {
          await this.linkEmployeeToGitHub(employeeByName.id, member, memberDetails, 'name', 0.75)
          return { matched: true, employeeId: employeeByName.id, confidence: 0.75, method: 'name' }
        }
      }
    }

    // Strategy 3: Commit email analysis (lower confidence)
    const commitEmails = await this.analyzeCommitEmails(companyId, member.login)
    for (const email of commitEmails) {
      const employeeByCommitEmail = await db.employee.findFirst({
        where: {
          companyId,
          email: { equals: email, mode: 'insensitive' }
        }
      })

      if (employeeByCommitEmail) {
        await this.linkEmployeeToGitHub(employeeByCommitEmail.id, member, memberDetails, 'commit_analysis', 0.60)
        return { matched: true, employeeId: employeeByCommitEmail.id, confidence: 0.60, method: 'commit_analysis' }
      }
    }

    // No match found - store as unmatched for manual review
    await db.gitHubOrganizationMember.update({
      where: {
        companyId_githubUserId: {
          companyId,
          githubUserId: member.id
        }
      },
      data: {
        employeeId: null,
        matchConfidence: 0.0,
        matchMethod: null
      }
    })

    return { matched: false, confidence: 0.0 }
  }

  /**
   * Link employee to GitHub account
   */
  private async linkEmployeeToGitHub(
    employeeId: string,
    githubMember: any,
    memberDetails: any,
    matchMethod: string,
    confidence: number
  ): Promise<void> {
    // Update employee with GitHub info
    await db.employee.update({
      where: { id: employeeId },
      data: {
        githubUsername: githubMember.login,
        githubId: String(githubMember.id),
        autoDiscovered: true,
        discoveryConfidence: confidence
      }
    })

    // Get employee's company
    const employee = await db.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) return

    // Update organization member with employee link
    await db.gitHubOrganizationMember.update({
      where: {
        companyId_githubUserId: {
          companyId: employee.companyId,
          githubUserId: githubMember.id
        }
      },
      data: {
        employeeId,
        matchConfidence: confidence,
        matchMethod
      }
    })

    // Create or update GitHub connection record (without OAuth token)
    await db.gitHubConnection.upsert({
      where: { employeeId },
      update: {
        githubUsername: githubMember.login,
        githubUserId: githubMember.id,
        isActive: true,
        isAutoDiscovered: true,
        updatedAt: new Date()
      },
      create: {
        employeeId,
        githubUsername: githubMember.login,
        githubUserId: githubMember.id,
        isActive: true,
        isAutoDiscovered: true,
        // No access token - using organization token for data access
        encryptedAccessToken: null
      }
    })

    this.logger.info('Employee linked to GitHub account', {
      employeeId,
      githubUsername: githubMember.login,
      matchMethod,
      confidence
    })
  }

  /**
   * Analyze commit emails for a GitHub user across organization repos
   */
  private async analyzeCommitEmails(companyId: string, githubUsername: string): Promise<string[]> {
    try {
      const octokit = await this.getCompanyClient(companyId)
      const emails = new Set<string>()

      // Get organization repositories
      const repos = await db.repository.findMany({
        where: { companyId },
        take: 10 // Limit for performance
      })

      // Check commits across repositories to find email patterns
      for (const repo of repos) {
        try {
          const [owner, repoName] = repo.fullName.split('/')
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo: repoName,
            author: githubUsername,
            per_page: 20
          })

          commits.forEach(commit => {
            if (commit.commit.author?.email) {
              emails.add(commit.commit.author.email)
            }
          })
        } catch (error) {
          // Repository might be private or inaccessible
          continue
        }
      }

      return Array.from(emails)
    } catch (error) {
      this.logger.error('Failed to analyze commit emails', error, {
        companyId,
        githubUsername
      })
      return []
    }
  }

  /**
   * Generate skills automatically for all discovered employees
   */
  async generateSkillsForDiscoveredEmployees(companyId: string): Promise<void> {
    const companyLogger = this.logger.withCompany(companyId)

    try {
      const employees = await db.employee.findMany({
        where: {
          companyId,
          autoDiscovered: true,
          githubUsername: { not: null }
        }
      })

      companyLogger.info('Generating skills for discovered employees', {
        employeeCount: employees.length
      })

      for (const employee of employees) {
        if (employee.githubUsername) {
          try {
            await this.generateEmployeeSkillsFromOrgData(employee.id, employee.githubUsername)
            companyLogger.info('Skills generated for employee', {
              employeeId: employee.id,
              githubUsername: employee.githubUsername
            })
          } catch (error) {
            companyLogger.error('Failed to generate skills for employee', error, {
              employeeId: employee.id,
              githubUsername: employee.githubUsername
            })
          }
        }
      }

      companyLogger.info('Skill generation completed for all discovered employees')

    } catch (error) {
      companyLogger.error('Failed to generate skills for discovered employees', error)
      throw error
    }
  }

  /**
   * Generate skills for an employee using organization data
   */
  private async generateEmployeeSkillsFromOrgData(
    employeeId: string,
    githubUsername: string
  ): Promise<void> {
    const employee = await db.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) return

    const employeeLogger = this.logger.withEmployee(employeeId)

    try {
      const octokit = await this.getCompanyClient(employee.companyId)

      // Get all organization repositories
      const repos = await db.repository.findMany({
        where: { companyId: employee.companyId }
      })

      const skillData = new Map<string, {
        language: string
        linesOfCode: number
        commits: number
        repositories: number
        lastUsed: Date
      }>()

      // Analyze each repository for this employee's contributions
      for (const repo of repos) {
        try {
          const [owner, repoName] = repo.fullName.split('/')

          // Get commits by this employee
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo: repoName,
            author: githubUsername,
            per_page: 100
          })

          if (commits.length === 0) continue

          // Get repository languages
          const { data: languages } = await octokit.rest.repos.listLanguages({
            owner,
            repo: repoName
          })

          // Calculate employee's contribution ratio in this repo
          const { data: allCommits } = await octokit.rest.repos.listCommits({
            owner,
            repo: repoName,
            per_page: 100
          })

          const contributionRatio = commits.length / Math.max(allCommits.length, 1)

          // Attribute languages based on contribution ratio
          for (const [language, bytes] of Object.entries(languages)) {
            const attributedBytes = Math.round(bytes * contributionRatio)

            if (!skillData.has(language)) {
              skillData.set(language, {
                language,
                linesOfCode: 0,
                commits: 0,
                repositories: 0,
                lastUsed: new Date(0)
              })
            }

            const skill = skillData.get(language)!
            skill.linesOfCode += Math.round(attributedBytes / 50) // Rough lines estimation
            skill.commits += commits.length
            skill.repositories += 1

            const latestCommit = new Date(commits[0].commit.author?.date || 0)
            if (latestCommit > skill.lastUsed) {
              skill.lastUsed = latestCommit
            }
          }

        } catch (error) {
          // Skip repos with access issues
          continue
        }
      }

      // Create skill records
      for (const [languageName, data] of Array.from(skillData.entries())) {
        // Determine skill level based on metrics
        let level: SkillLevel = 'BEGINNER'
        if (data.linesOfCode > 10000 && data.repositories > 10) level = 'EXPERT'
        else if (data.linesOfCode > 5000 && data.repositories > 5) level = 'ADVANCED'
        else if (data.linesOfCode > 1000 && data.repositories > 2) level = 'INTERMEDIATE'

        // Calculate confidence based on activity
        const confidence = Math.min(
          (data.linesOfCode / 10000) * 0.4 +
          (data.repositories / 10) * 0.3 +
          (data.commits / 100) * 0.3,
          1.0
        )

        // Create or update skill
        const skill = await db.skill.upsert({
          where: { name: languageName.toLowerCase() },
          update: {},
          create: {
            name: languageName.toLowerCase(),
            category: 'Programming Language',
            description: `${languageName} programming language`
          }
        })

        // Create skill record
        await db.skillRecord.upsert({
          where: {
            employeeId_skillId: {
              employeeId,
              skillId: skill.id
            }
          },
          update: {
            level,
            confidence,
            linesOfCode: data.linesOfCode,
            projectsUsed: data.repositories,
            lastUsed: data.lastUsed,
            isAutoDetected: true,
            source: 'github_auto_discovery',
            updatedAt: new Date()
          },
          create: {
            employeeId,
            skillId: skill.id,
            level,
            confidence,
            linesOfCode: data.linesOfCode,
            projectsUsed: data.repositories,
            lastUsed: data.lastUsed,
            isAutoDetected: true,
            source: 'github_auto_discovery'
          }
        })
      }

      employeeLogger.info('Skills generated from organization data', {
        skillsGenerated: skillData.size,
        githubUsername
      })

    } catch (error) {
      employeeLogger.error('Failed to generate skills from organization data', error, {
        githubUsername
      })
      throw error
    }
  }

  /**
   * Manually link an unmatched GitHub member to an employee
   */
  async manuallyLinkMemberToEmployee(
    companyId: string,
    githubUserId: number,
    employeeId: string
  ): Promise<void> {
    try {
      // Get the GitHub member
      const githubMember = await db.gitHubOrganizationMember.findUnique({
        where: {
          companyId_githubUserId: {
            companyId,
            githubUserId
          }
        }
      })

      if (!githubMember) {
        throw new NotFoundError('GitHub organization member', githubUserId.toString())
      }

      // Get the employee
      const employee = await db.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee || employee.companyId !== companyId) {
        throw new NotFoundError('Employee', employeeId)
      }

      // Create the link
      await this.linkEmployeeToGitHub(
        employeeId,
        { login: githubMember.githubUsername, id: githubUserId },
        { name: githubMember.githubName, email: githubMember.githubEmail },
        'manual',
        1.0
      )

      // Generate skills for this employee
      if (githubMember.githubUsername) {
        await this.generateEmployeeSkillsFromOrgData(employeeId, githubMember.githubUsername)
      }

      this.logger.info('Manual employee-GitHub link created', {
        companyId,
        employeeId,
        githubUsername: githubMember.githubUsername
      })

    } catch (error) {
      this.logger.error('Failed to manually link member to employee', error, {
        companyId,
        githubUserId,
        employeeId
      })
      throw error
    }
  }
}
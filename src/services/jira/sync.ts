/**
 * Jira Sync Service
 * Handles syncing Jira data (projects, issues, users, worklogs)
 */

import { db } from '@/lib/db'
import { JiraService, type JiraIssue, type JiraProject, type JiraUser } from './client'

export class JiraSyncService {
  private jiraService: JiraService
  private companyId: string

  constructor(jiraService: JiraService, companyId: string) {
    this.jiraService = jiraService
    this.companyId = companyId
  }

  /**
   * Full sync - projects, users, issues, and worklogs
   */
  async fullSync() {
    console.log('🔄 Starting full Jira sync for company:', this.companyId)

    try {
      // Sync in order: projects → users → issues → worklogs/comments
      await this.syncProjects()
      await this.syncUsers()
      await this.syncIssues()

      // Update last sync time
      await db.jiraIntegration.updateMany({
        where: {
          companyId: this.companyId,
          isActive: true,
        },
        data: {
          lastSync: new Date(),
        },
      })

      console.log('✅ Full Jira sync completed')

      return {
        success: true,
        message: 'Jira data synced successfully',
      }
    } catch (error) {
      console.error('❌ Error during full sync:', error)
      throw error
    }
  }

  /**
   * Sync all projects
   */
  async syncProjects() {
    console.log('📁 Syncing projects...')

    try {
      const integration = await db.jiraIntegration.findFirst({
        where: {
          companyId: this.companyId,
          isActive: true,
        },
      })

      if (!integration) {
        throw new Error('No active Jira integration found')
      }

      const projects = await this.jiraService.getProjects()
      let syncedCount = 0

      for (const project of projects) {
        await db.jiraProject.upsert({
          where: {
            companyId_jiraProjectId: {
              companyId: this.companyId,
              jiraProjectId: project.id,
            },
          },
          create: {
            integrationId: integration.id,
            companyId: this.companyId,
            jiraProjectId: project.id,
            projectKey: project.key,
            name: project.name,
            description: project.description,
            avatarUrl: project.avatarUrls?.['48x48'],
            projectType: project.projectTypeKey,
            projectStyle: project.style,
            leadAccountId: project.lead?.accountId,
            leadDisplayName: project.lead?.displayName,
          },
          update: {
            name: project.name,
            description: project.description,
            avatarUrl: project.avatarUrls?.['48x48'],
            leadAccountId: project.lead?.accountId,
            leadDisplayName: project.lead?.displayName,
            updatedAt: new Date(),
          },
        })

        syncedCount++
      }

      console.log(`✅ Synced ${syncedCount} projects`)

      return { syncedCount }
    } catch (error) {
      console.error('❌ Error syncing projects:', error)
      throw error
    }
  }

  /**
   * Sync all users across all projects
   */
  async syncUsers() {
    console.log('👥 Syncing users...')

    try {
      const projects = await db.jiraProject.findMany({
        where: {
          companyId: this.companyId,
        },
      })

      const seenUsers = new Set<string>()
      let syncedCount = 0
      let matchedCount = 0

      for (const project of projects) {
        try {
          const users = await this.jiraService.getProjectUsers(project.projectKey)

          for (const jiraUser of users) {
            // Skip if we've already processed this user
            if (seenUsers.has(jiraUser.accountId)) {
              continue
            }
            seenUsers.add(jiraUser.accountId)

            // Try to match with existing employee by email
            let employeeId: string | null = null
            let matchConfidence = 0
            let matchMethod = null

            if (jiraUser.emailAddress) {
              const employee = await db.employee.findFirst({
                where: {
                  companyId: this.companyId,
                  email: jiraUser.emailAddress,
                },
              })

              if (employee) {
                employeeId = employee.id
                matchConfidence = 1.0
                matchMethod = 'email'
                matchedCount++
              }
            }

            // Upsert Jira user
            await db.jiraUser.upsert({
              where: {
                companyId_accountId: {
                  companyId: this.companyId,
                  accountId: jiraUser.accountId,
                },
              },
              create: {
                companyId: this.companyId,
                employeeId,
                accountId: jiraUser.accountId,
                displayName: jiraUser.displayName,
                email: jiraUser.emailAddress,
                avatarUrl: jiraUser.avatarUrls?.['48x48'],
                isActive: jiraUser.active ?? true,
                accountType: jiraUser.accountType,
                matchConfidence,
                matchMethod,
              },
              update: {
                displayName: jiraUser.displayName,
                email: jiraUser.emailAddress,
                avatarUrl: jiraUser.avatarUrls?.['48x48'],
                isActive: jiraUser.active ?? true,
                employeeId: employeeId || undefined,
                matchConfidence: matchConfidence || undefined,
                matchMethod: matchMethod || undefined,
                updatedAt: new Date(),
              },
            })

            syncedCount++
          }
        } catch (projectError) {
          console.warn(`⚠️  Could not sync users for project ${project.name}:`, (projectError as Error).message)
          // Continue with other projects
        }
      }

      console.log(`✅ Synced ${syncedCount} users (${matchedCount} matched to employees)`)

      return { syncedCount, matchedCount }
    } catch (error) {
      console.error('❌ Error syncing users:', error)
      throw error
    }
  }

  /**
   * Sync issues for all projects
   */
  async syncIssues(daysBack: number = 90) {
    console.log(`📝 Syncing issues from last ${daysBack} days...`)

    try {
      const projects = await db.jiraProject.findMany({
        where: {
          companyId: this.companyId,
          isArchived: false,
        },
      })

      let totalIssues = 0
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      const jqlDate = cutoffDate.toISOString().split('T')[0]

      for (const project of projects) {
        try {
          console.log(`  Syncing issues for project: ${project.name}`)

          // Build JQL query to get recent issues
          const jql = `project = ${project.projectKey} AND updated >= ${jqlDate} ORDER BY updated DESC`

          let startAt = 0
          const maxResults = 100
          let hasMore = true

          while (hasMore) {
            const response = await this.jiraService.searchIssues(jql, maxResults, startAt)

            for (const issue of response.issues) {
              await this.syncIssue(issue, project.id)
              totalIssues++
            }

            startAt += maxResults
            hasMore = response.total > startAt
          }

          // Update project stats
          const issueCount = await db.jiraIssue.count({
            where: {
              projectId: project.id,
            },
          })

          const completedIssues = await db.jiraIssue.count({
            where: {
              projectId: project.id,
              statusCategory: 'done',
            },
          })

          await db.jiraProject.update({
            where: { id: project.id },
            data: {
              issueCount,
              completedIssues,
            },
          })
        } catch (projectError) {
          console.warn(`⚠️  Could not sync issues for project ${project.name}:`, (projectError as Error).message)
          // Continue with other projects
        }
      }

      console.log(`✅ Synced ${totalIssues} issues`)

      return { totalIssues }
    } catch (error) {
      console.error('❌ Error syncing issues:', error)
      throw error
    }
  }

  /**
   * Sync a single issue with all its data
   */
  private async syncIssue(issue: JiraIssue, projectId: string) {
    try {
      // Find creator
      const creatorId = issue.fields.reporter
        ? (await db.jiraUser.findUnique({
            where: {
              companyId_accountId: {
                companyId: this.companyId,
                accountId: issue.fields.reporter.accountId,
              },
            },
            select: { id: true },
          }))?.id
        : null

      // Find assignee
      const assigneeId = issue.fields.assignee
        ? (await db.jiraUser.findUnique({
            where: {
              companyId_accountId: {
                companyId: this.companyId,
                accountId: issue.fields.assignee.accountId,
              },
            },
            select: { id: true, employeeId: true },
          }))
        : null

      // Extract story points (customfield_10016 is common, but may vary)
      const storyPoints = issue.fields.customfield_10016 || null

      // Parse description (Jira uses Atlassian Document Format)
      const description = this.parseDescription(issue.fields.description)

      // Store issue
      const storedIssue = await db.jiraIssue.upsert({
        where: {
          companyId_jiraIssueId: {
            companyId: this.companyId,
            jiraIssueId: issue.id,
          },
        },
        create: {
          companyId: this.companyId,
          projectId,
          creatorId,
          assigneeId: assigneeId?.id || null,
          employeeId: assigneeId?.employeeId || null,
          jiraIssueId: issue.id,
          issueKey: issue.key,
          summary: issue.fields.summary,
          description,
          issueType: issue.fields.issuetype.name,
          issueTypeIconUrl: issue.fields.issuetype.iconUrl,
          status: issue.fields.status.name,
          statusCategory: issue.fields.status.statusCategory.key,
          priority: issue.fields.priority?.name || null,
          priorityIconUrl: issue.fields.priority?.iconUrl || null,
          storyPoints,
          originalEstimate: issue.fields.timetracking?.originalEstimateSeconds ? Math.floor(issue.fields.timetracking.originalEstimateSeconds / 60) : null,
          timeSpent: issue.fields.timetracking?.timeSpentSeconds ? Math.floor(issue.fields.timetracking.timeSpentSeconds / 60) : null,
          remainingEstimate: issue.fields.timetracking?.remainingEstimateSeconds ? Math.floor(issue.fields.timetracking.remainingEstimateSeconds / 60) : null,
          labels: issue.fields.labels || undefined,
          components: issue.fields.components || undefined,
          createdDate: new Date(issue.fields.created),
          updatedDate: new Date(issue.fields.updated),
          resolvedDate: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
          dueDate: issue.fields.duedate ? new Date(issue.fields.duedate) : null,
          resolution: issue.fields.resolution?.name || null,
          resolutionDate: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
          parentIssueKey: issue.fields.parent?.key || null,
          webUrl: `${issue.fields.status.name}`, // This should be constructed from site URL
        },
        update: {
          summary: issue.fields.summary,
          description,
          status: issue.fields.status.name,
          statusCategory: issue.fields.status.statusCategory.key,
          priority: issue.fields.priority?.name || null,
          assigneeId: assigneeId?.id || null,
          employeeId: assigneeId?.employeeId || null,
          storyPoints,
          timeSpent: issue.fields.timetracking?.timeSpentSeconds ? Math.floor(issue.fields.timetracking.timeSpentSeconds / 60) : null,
          updatedDate: new Date(issue.fields.updated),
          resolvedDate: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
          resolution: issue.fields.resolution?.name || null,
          resolutionDate: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
          updatedAt: new Date(),
        },
      })

      // Sync comments
      await this.syncIssueComments(issue.key, storedIssue.id)

      // Sync worklogs
      await this.syncIssueWorklogs(issue.key, storedIssue.id)

      return storedIssue
    } catch (error) {
      console.error(`Error syncing issue ${issue.key}:`, error)
      throw error
    }
  }

  /**
   * Parse Jira description (Atlassian Document Format to plain text)
   */
  private parseDescription(description: any): string | null {
    if (!description) return null

    if (typeof description === 'string') {
      return description
    }

    // Atlassian Document Format (ADF) - extract text content
    if (description.type === 'doc' && description.content) {
      return this.extractTextFromADF(description.content)
    }

    return JSON.stringify(description)
  }

  /**
   * Extract text from Atlassian Document Format
   */
  private extractTextFromADF(content: any[]): string {
    let text = ''

    for (const node of content) {
      if (node.type === 'paragraph' || node.type === 'heading') {
        if (node.content) {
          for (const child of node.content) {
            if (child.type === 'text') {
              text += child.text + ' '
            }
          }
        }
        text += '\n'
      } else if (node.content) {
        text += this.extractTextFromADF(node.content)
      }
    }

    return text.trim()
  }

  /**
   * Sync comments for an issue
   */
  private async syncIssueComments(issueKey: string, issueId: string) {
    try {
      const comments = await this.jiraService.getIssueComments(issueKey)

      for (const comment of comments) {
        const authorId = comment.author
          ? (await db.jiraUser.findUnique({
              where: {
                companyId_accountId: {
                  companyId: this.companyId,
                  accountId: comment.author.accountId,
                },
              },
              select: { id: true },
            }))?.id
          : null

        const body = this.parseDescription(comment.body) || ''

        await db.jiraComment.upsert({
          where: {
            jiraCommentId: comment.id,
          },
          create: {
            companyId: this.companyId,
            issueId,
            authorId,
            jiraCommentId: comment.id,
            body,
            createdDate: new Date(comment.created),
            updatedDate: new Date(comment.updated),
          },
          update: {
            body,
            updatedDate: new Date(comment.updated),
            updatedAt: new Date(),
          },
        })

        // Update author's comment count
        if (authorId) {
          await db.jiraUser.update({
            where: { id: authorId },
            data: {
              commentsPosted: {
                increment: 1,
              },
              lastActivityAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.warn(`Could not sync comments for ${issueKey}:`, (error as Error).message)
    }
  }

  /**
   * Sync worklogs for an issue
   */
  private async syncIssueWorklogs(issueKey: string, issueId: string) {
    try {
      const worklogs = await this.jiraService.getIssueWorklogs(issueKey)

      for (const worklog of worklogs) {
        const authorData = worklog.author
          ? await db.jiraUser.findUnique({
              where: {
                companyId_accountId: {
                  companyId: this.companyId,
                  accountId: worklog.author.accountId,
                },
              },
              select: { id: true, employeeId: true },
            })
          : null

        const comment = this.parseDescription(worklog.comment)

        await db.jiraWorklog.upsert({
          where: {
            jiraWorklogId: worklog.id,
          },
          create: {
            companyId: this.companyId,
            issueId,
            authorId: authorData?.id || null,
            employeeId: authorData?.employeeId || null,
            jiraWorklogId: worklog.id,
            comment,
            timeSpentSeconds: worklog.timeSpentSeconds,
            startedDate: new Date(worklog.started),
            createdDate: new Date(worklog.created),
            updatedDate: new Date(worklog.updated),
          },
          update: {
            comment,
            timeSpentSeconds: worklog.timeSpentSeconds,
            updatedDate: new Date(worklog.updated),
            updatedAt: new Date(),
          },
        })

        // Update author's activity
        if (authorData?.id) {
          await db.jiraUser.update({
            where: { id: authorData.id },
            data: {
              lastActivityAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.warn(`Could not sync worklogs for ${issueKey}:`, (error as Error).message)
    }
  }

  /**
   * Create sync service from company ID
   */
  static async createFromCompany(companyId: string): Promise<JiraSyncService | null> {
    const jiraService = await JiraService.createFromIntegration(companyId)

    if (!jiraService) {
      return null
    }

    return new JiraSyncService(jiraService, companyId)
  }
}

export default JiraSyncService

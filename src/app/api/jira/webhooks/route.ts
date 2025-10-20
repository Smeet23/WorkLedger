/**
 * Jira Webhooks Route
 * Receives real-time events from Jira
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Received Jira webhook:', body.webhookEvent)

    // Extract event data
    const webhookEvent = body.webhookEvent
    const issue = body.issue
    const changelog = body.changelog

    // Find integration by cloud ID or issue key
    let companyId: string | null = null

    if (issue?.fields?.project?.key) {
      const project = await db.jiraProject.findFirst({
        where: {
          projectKey: issue.fields.project.key,
        },
        select: {
          companyId: true,
        },
      })
      companyId = project?.companyId || null
    }

    // Store webhook for processing
    await db.jiraWebhook.create({
      data: {
        companyId,
        eventType: body.webhookEvent,
        webhookEvent: webhookEvent,
        issueKey: issue?.key,
        payload: body,
        processed: false,
      },
    })

    // Process event based on type
    try {
      if (companyId) {
        await processJiraEvent(body, companyId)
      }
    } catch (error) {
      console.error('❌ Error processing event:', error)
      // Don't throw - we already stored it for retry
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error handling Jira webhook:', error)

    // Always return 200 to Jira to avoid retries
    return NextResponse.json({ ok: true })
  }
}

/**
 * Process different Jira event types
 */
async function processJiraEvent(event: any, companyId: string) {
  const webhookEvent = event.webhookEvent

  switch (webhookEvent) {
    case 'jira:issue_created':
      await handleIssueCreated(event, companyId)
      break

    case 'jira:issue_updated':
      await handleIssueUpdated(event, companyId)
      break

    case 'jira:issue_deleted':
      await handleIssueDeleted(event, companyId)
      break

    case 'worklog_created':
    case 'worklog_updated':
      await handleWorklogEvent(event, companyId)
      break

    case 'comment_created':
    case 'comment_updated':
      await handleCommentEvent(event, companyId)
      break

    default:
      console.log('ℹ️  Unhandled Jira event type:', webhookEvent)
  }
}

/**
 * Handle issue created event
 */
async function handleIssueCreated(event: any, companyId: string) {
  try {
    const issue = event.issue

    // Find or create project
    const project = await db.jiraProject.findFirst({
      where: {
        companyId,
        projectKey: issue.fields.project.key,
      },
    })

    if (!project) {
      console.warn('⚠️  Project not found:', issue.fields.project.key)
      return
    }

    // Find assignee
    const assigneeId = issue.fields.assignee
      ? (await db.jiraUser.findUnique({
          where: {
            companyId_accountId: {
              companyId,
              accountId: issue.fields.assignee.accountId,
            },
          },
          select: { id: true, employeeId: true },
        }))
      : null

    // Create issue
    await db.jiraIssue.create({
      data: {
        companyId,
        projectId: project.id,
        assigneeId: assigneeId?.id || null,
        employeeId: assigneeId?.employeeId || null,
        jiraIssueId: issue.id,
        issueKey: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description || null,
        issueType: issue.fields.issuetype.name,
        issueTypeIconUrl: issue.fields.issuetype.iconUrl,
        status: issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.key,
        priority: issue.fields.priority?.name || null,
        priorityIconUrl: issue.fields.priority?.iconUrl || null,
        createdDate: new Date(issue.fields.created),
        updatedDate: new Date(issue.fields.updated),
      },
    })

    console.log('✅ Issue created:', issue.key)
  } catch (error) {
    console.error('❌ Error handling issue created:', error)
    throw error
  }
}

/**
 * Handle issue updated event
 */
async function handleIssueUpdated(event: any, companyId: string) {
  try {
    const issue = event.issue
    const changelog = event.changelog

    // Find existing issue
    const existingIssue = await db.jiraIssue.findUnique({
      where: {
        companyId_jiraIssueId: {
          companyId,
          jiraIssueId: issue.id,
        },
      },
    })

    if (!existingIssue) {
      console.warn('⚠️  Issue not found:', issue.key)
      return
    }

    // Find assignee
    const assigneeId = issue.fields.assignee
      ? (await db.jiraUser.findUnique({
          where: {
            companyId_accountId: {
              companyId,
              accountId: issue.fields.assignee.accountId,
            },
          },
          select: { id: true, employeeId: true },
        }))
      : null

    // Update issue
    await db.jiraIssue.update({
      where: {
        companyId_jiraIssueId: {
          companyId,
          jiraIssueId: issue.id,
        },
      },
      data: {
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.key,
        priority: issue.fields.priority?.name || null,
        assigneeId: assigneeId?.id || null,
        employeeId: assigneeId?.employeeId || null,
        updatedDate: new Date(issue.fields.updated),
        resolvedDate: issue.fields.resolutiondate
          ? new Date(issue.fields.resolutiondate)
          : null,
        resolution: issue.fields.resolution?.name || null,
        resolutionDate: issue.fields.resolutiondate
          ? new Date(issue.fields.resolutiondate)
          : null,
      },
    })

    // Track status transitions
    if (changelog?.items) {
      for (const item of changelog.items) {
        if (item.field === 'status') {
          await db.jiraIssueTransition.create({
            data: {
              companyId,
              issueId: existingIssue.id,
              fromStatus: item.fromString,
              toStatus: item.toString,
              fromStatusCategory: 'unknown', // Would need to map
              toStatusCategory: issue.fields.status.statusCategory.key,
              authorAccountId: event.user?.accountId,
              authorDisplayName: event.user?.displayName,
              transitionDate: new Date(),
            },
          })
        }
      }
    }

    console.log('✅ Issue updated:', issue.key)
  } catch (error) {
    console.error('❌ Error handling issue updated:', error)
    throw error
  }
}

/**
 * Handle issue deleted event
 */
async function handleIssueDeleted(event: any, companyId: string) {
  try {
    const issue = event.issue

    await db.jiraIssue.delete({
      where: {
        companyId_jiraIssueId: {
          companyId,
          jiraIssueId: issue.id,
        },
      },
    })

    console.log('✅ Issue deleted:', issue.key)
  } catch (error) {
    console.error('❌ Error handling issue deleted:', error)
    // Don't throw - issue might already be deleted
  }
}

/**
 * Handle worklog events
 */
async function handleWorklogEvent(event: any, companyId: string) {
  try {
    const worklog = event.worklog
    const issue = event.issue

    // Find issue
    const existingIssue = await db.jiraIssue.findUnique({
      where: {
        companyId_jiraIssueId: {
          companyId,
          jiraIssueId: issue.id,
        },
      },
    })

    if (!existingIssue) {
      console.warn('⚠️  Issue not found for worklog:', issue.key)
      return
    }

    // Find author
    const authorData = worklog.author
      ? await db.jiraUser.findUnique({
          where: {
            companyId_accountId: {
              companyId,
              accountId: worklog.author.accountId,
            },
          },
          select: { id: true, employeeId: true },
        })
      : null

    // Upsert worklog
    await db.jiraWorklog.upsert({
      where: {
        jiraWorklogId: worklog.id,
      },
      create: {
        companyId,
        issueId: existingIssue.id,
        authorId: authorData?.id || null,
        employeeId: authorData?.employeeId || null,
        jiraWorklogId: worklog.id,
        comment: worklog.comment || null,
        timeSpentSeconds: worklog.timeSpentSeconds,
        startedDate: new Date(worklog.started),
        createdDate: new Date(worklog.created),
        updatedDate: new Date(worklog.updated),
      },
      update: {
        comment: worklog.comment || null,
        timeSpentSeconds: worklog.timeSpentSeconds,
        updatedDate: new Date(worklog.updated),
      },
    })

    console.log('✅ Worklog processed for:', issue.key)
  } catch (error) {
    console.error('❌ Error handling worklog event:', error)
  }
}

/**
 * Handle comment events
 */
async function handleCommentEvent(event: any, companyId: string) {
  try {
    const comment = event.comment
    const issue = event.issue

    // Find issue
    const existingIssue = await db.jiraIssue.findUnique({
      where: {
        companyId_jiraIssueId: {
          companyId,
          jiraIssueId: issue.id,
        },
      },
    })

    if (!existingIssue) {
      console.warn('⚠️  Issue not found for comment:', issue.key)
      return
    }

    // Find author
    const authorId = comment.author
      ? (await db.jiraUser.findUnique({
          where: {
            companyId_accountId: {
              companyId,
              accountId: comment.author.accountId,
            },
          },
          select: { id: true },
        }))?.id
      : null

    // Upsert comment
    await db.jiraComment.upsert({
      where: {
        jiraCommentId: comment.id,
      },
      create: {
        companyId,
        issueId: existingIssue.id,
        authorId,
        jiraCommentId: comment.id,
        body: comment.body || '',
        createdDate: new Date(comment.created),
        updatedDate: new Date(comment.updated),
      },
      update: {
        body: comment.body || '',
        updatedDate: new Date(comment.updated),
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

    console.log('✅ Comment processed for:', issue.key)
  } catch (error) {
    console.error('❌ Error handling comment event:', error)
  }
}

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { config } from '@/lib/config'
import { db } from '@/lib/db'
import { createApiResponse, withErrorHandling } from '@/lib/api-response'
import { AuthenticationError, ValidationError } from '@/lib/errors'
import { loggers } from '@/lib/logger'
import { enhancedGitHubService } from '@/services/github/enhanced-client'

const logger = loggers.external('github_webhooks')

// Verify GitHub webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = config.github.app.webhookSecret
  if (!webhookSecret) {
    throw new Error('GitHub webhook secret is not configured')
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')

  const expectedSignatureWithPrefix = `sha256=${expectedSignature}`

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignatureWithPrefix)
  )
}

// GitHub Webhook Handler
export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = createApiResponse()

  // Get webhook headers
  const signature = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event')
  const deliveryId = request.headers.get('x-github-delivery')

  if (!signature || !event || !deliveryId) {
    throw new ValidationError('Missing required webhook headers')
  }

  // Get raw payload
  const payload = await request.text()

  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    throw new AuthenticationError('Invalid webhook signature')
  }

  const webhookData = JSON.parse(payload)

  logger.info('Received GitHub webhook', {
    event,
    deliveryId,
    action: webhookData.action,
    installationId: webhookData.installation?.id
  })

  try {
    // Store webhook for processing
    const webhookRecord = await db.gitHubWebhook.create({
      data: {
        eventType: event,
        action: webhookData.action,
        payload: webhookData,
        githubDeliveryId: deliveryId,
        installationId: webhookData.installation?.id,
        companyId: await getCompanyIdFromInstallation(webhookData.installation?.id),
        processed: false
      }
    })

    // Process webhook based on event type
    await processWebhook(event, webhookData, webhookRecord.id)

    return apiResponse.success({ message: 'Webhook processed successfully' })

  } catch (error) {
    logger.error('Webhook processing failed', error, {
      event,
      deliveryId,
      installationId: webhookData.installation?.id
    })

    // Store failed webhook for retry
    await db.gitHubWebhook.create({
      data: {
        eventType: event,
        action: webhookData.action,
        payload: webhookData,
        githubDeliveryId: deliveryId,
        installationId: webhookData.installation?.id,
        companyId: await getCompanyIdFromInstallation(webhookData.installation?.id),
        processed: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0
      }
    })

    throw error
  }
})

async function getCompanyIdFromInstallation(installationId?: number): Promise<string | null> {
  if (!installationId) return null

  const installation = await db.gitHubInstallation.findUnique({
    where: { installationId }
  })

  return installation?.companyId || null
}

async function processWebhook(event: string, payload: any, webhookId: string): Promise<void> {
  const webhookLogger = logger.withContext({ webhookId, event })

  try {
    switch (event) {
      case 'installation':
        await handleInstallationEvent(payload)
        break

      case 'installation_repositories':
        await handleInstallationRepositoriesEvent(payload)
        break

      case 'push':
        await handlePushEvent(payload)
        break

      case 'pull_request':
        await handlePullRequestEvent(payload)
        break

      case 'member':
        await handleMemberEvent(payload)
        break

      case 'repository':
        await handleRepositoryEvent(payload)
        break

      default:
        webhookLogger.info('Unhandled webhook event', { event })
    }

    // Mark webhook as processed
    await db.gitHubWebhook.update({
      where: { id: webhookId },
      data: {
        processed: true,
        processedAt: new Date()
      }
    })

  } catch (error) {
    webhookLogger.error('Webhook event processing failed', error)

    // Update webhook with error
    await db.gitHubWebhook.update({
      where: { id: webhookId },
      data: {
        errorMessage: error instanceof Error ? error.message : 'Processing failed',
        retryCount: { increment: 1 }
      }
    })

    throw error
  }
}

async function handleInstallationEvent(payload: any): Promise<void> {
  const { action, installation } = payload

  logger.info('Processing installation event', {
    action,
    installationId: installation.id,
    account: installation.account.login
  })

  switch (action) {
    case 'created':
      // Installation will be handled by the setup callback
      break

    case 'deleted':
      await db.gitHubInstallation.update({
        where: { installationId: installation.id },
        data: {
          isActive: false,
          suspendedAt: new Date()
        }
      })

      // Deactivate related integrations
      const companyId = await getCompanyIdFromInstallation(installation.id)
      if (companyId) {
        await db.gitHubIntegration.updateMany({
          where: { companyId },
          data: { isActive: false }
        })
      }
      break

    case 'suspend':
      await db.gitHubInstallation.update({
        where: { installationId: installation.id },
        data: {
          isActive: false,
          suspendedAt: new Date()
        }
      })
      break

    case 'unsuspend':
      await db.gitHubInstallation.update({
        where: { installationId: installation.id },
        data: {
          isActive: true,
          suspendedAt: null
        }
      })
      break
  }
}

async function handleInstallationRepositoriesEvent(payload: any): Promise<void> {
  const { action, installation, repositories_added, repositories_removed } = payload

  const companyId = await getCompanyIdFromInstallation(installation.id)
  if (!companyId) return

  logger.info('Processing installation repositories event', {
    action,
    installationId: installation.id,
    added: repositories_added?.length || 0,
    removed: repositories_removed?.length || 0
  })

  if (action === 'added' && repositories_added) {
    // Sync newly added repositories
    for (const repo of repositories_added) {
      try {
        await syncRepositoryData(companyId, repo)
      } catch (error) {
        logger.error('Failed to sync added repository', error, {
          repository: repo.full_name
        })
      }
    }
  }

  if (action === 'removed' && repositories_removed) {
    // Delete removed repositories
    for (const repo of repositories_removed) {
      await db.repository.deleteMany({
        where: {
          githubRepoId: String(repo.id),
          companyId
        }
      })
    }
  }
}

async function handlePushEvent(payload: any): Promise<void> {
  const { repository, commits, pusher, ref } = payload

  const companyId = await getCompanyIdFromInstallation(payload.installation.id)
  if (!companyId) return

  logger.info('Processing push event', {
    repository: repository.full_name,
    branch: ref,
    commits: commits.length,
    pusher: pusher.name
  })

  // Find or create repository in database
  const repo = await db.repository.upsert({
    where: { githubRepoId: String(repository.id) },
    update: {
      lastActivityAt: new Date(),
      updatedAt: new Date(),
      pushedAt: new Date()
    },
    create: {
      companyId,
      githubRepoId: String(repository.id),
      name: repository.name,
      fullName: repository.full_name,
      description: repository.description,
      isPrivate: repository.private || false,
      defaultBranch: repository.default_branch || 'main',
      githubCreatedAt: repository.created_at ? new Date(repository.created_at) : new Date(),
      lastActivityAt: new Date(),
      pushedAt: new Date()
    }
  })

  logger.info('Repository updated', { repositoryId: repo.id })

  // Save each commit from the push event
  let savedCommits = 0
  for (const commit of commits) {
    try {
      await db.commit.upsert({
        where: {
          repositoryId_sha: {
            repositoryId: repo.id,
            sha: commit.id
          }
        },
        update: {
          message: commit.message,
          authorName: commit.author?.name || commit.author?.username || 'Unknown',
          authorEmail: commit.author?.email || 'unknown@example.com',
          authorDate: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          committerName: commit.committer?.name || commit.committer?.username,
          committerEmail: commit.committer?.email,
          commitDate: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          htmlUrl: commit.url,
          apiUrl: commit.url
        },
        create: {
          repositoryId: repo.id,
          sha: commit.id,
          message: commit.message,
          authorName: commit.author?.name || commit.author?.username || 'Unknown',
          authorEmail: commit.author?.email || 'unknown@example.com',
          authorDate: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          committerName: commit.committer?.name || commit.committer?.username,
          committerEmail: commit.committer?.email,
          commitDate: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          htmlUrl: commit.url,
          apiUrl: commit.url
        }
      })
      savedCommits++
    } catch (error) {
      logger.error('Failed to save commit', error, { sha: commit.id })
    }
  }

  logger.info('Commits saved', { savedCommits, totalCommits: commits.length })

  // Update repository commit count
  const totalCommits = await db.commit.count({
    where: { repositoryId: repo.id }
  })

  await db.repository.update({
    where: { id: repo.id },
    data: { totalCommits }
  })

  // Find employee by GitHub username
  const employee = await db.employee.findFirst({
    where: {
      companyId,
      githubUsername: pusher.name
    }
  })

  if (employee) {
    // Link employee to repository if not already linked
    await db.employeeRepository.upsert({
      where: {
        employeeId_repositoryId: {
          employeeId: employee.id,
          repositoryId: repo.id
        }
      },
      update: {
        lastActivityAt: new Date()
      },
      create: {
        employeeId: employee.id,
        repositoryId: repo.id,
        lastActivityAt: new Date()
      }
    })

    logger.info('Employee linked to repository', {
      employeeId: employee.id,
      githubUsername: pusher.name,
      newCommits: savedCommits
    })

    // Trigger skill re-detection for this employee
    // This could be queued as a background job in production
    logger.info('Skill update recommended for employee', {
      employeeId: employee.id,
      repository: repository.full_name
    })
  }
}

async function handlePullRequestEvent(payload: any): Promise<void> {
  const { action, pull_request, repository } = payload

  if (!['opened', 'closed', 'merged'].includes(action)) return

  const companyId = await getCompanyIdFromInstallation(payload.installation.id)
  if (!companyId) return

  logger.info('Processing pull request event', {
    action,
    repository: repository.full_name,
    prNumber: pull_request.number,
    author: pull_request.user.login
  })

  // Find employee by GitHub username
  const employee = await db.employee.findFirst({
    where: {
      companyId,
      githubUsername: pull_request.user.login
    }
  })

  if (employee && action === 'merged') {
    // Update collaboration skills
    logger.info('Updating collaboration metrics', {
      employeeId: employee.id,
      action: 'pr_merged'
    })
  }
}

async function handleMemberEvent(payload: any): Promise<void> {
  const { action, member } = payload

  const companyId = await getCompanyIdFromInstallation(payload.installation.id)
  if (!companyId) return

  logger.info('Processing member event', {
    action,
    member: member.login
  })

  if (action === 'added') {
    // Try to auto-discover new organization member
    // This could be queued as a background job
    logger.info('New organization member detected', {
      companyId,
      githubUsername: member.login
    })
  }
}

async function handleRepositoryEvent(payload: any): Promise<void> {
  const { action, repository } = payload

  const companyId = await getCompanyIdFromInstallation(payload.installation.id)
  if (!companyId) return

  logger.info('Processing repository event', {
    action,
    repository: repository.full_name
  })

  switch (action) {
    case 'created':
      await syncRepositoryData(companyId, repository)
      break

    case 'deleted':
      await db.repository.deleteMany({
        where: {
          githubRepoId: String(repository.id),
          companyId
        }
      })
      break

    case 'archived':
      // For archived repos, we can keep them but just log it
      logger.info('Repository archived', {
        repositoryId: repository.id,
        name: repository.name
      })
      break
  }
}

async function syncRepositoryData(companyId: string, repoData: any): Promise<void> {
  // TODO: Implement repository syncing logic
  // Repositories belong to employees, not companies directly
  // This needs to find or create an employee association first
  logger.info('Repository sync requested', {
    repository: repoData.full_name,
    companyId
  })
}
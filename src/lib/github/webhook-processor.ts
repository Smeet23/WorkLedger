import { db } from '@/lib/db'
import { loggers } from '@/lib/logger'
import { jobManager } from '@/lib/queue'

const logger = loggers.external('github')

export interface WebhookEvent {
  id: string
  name: string
  payload: any
  signature: string
  installation?: {
    id: number
    account: {
      login: string
      id: number
      type: string
    }
  }
}

export class WebhookProcessor {
  constructor() {
    // No initialization needed for jobManager
  }

  async processWebhook(event: WebhookEvent): Promise<void> {
    logger.info('Processing webhook event', {
      eventName: event.name,
      installationId: event.installation?.id
    })

    try {
      // Store webhook for audit
      await this.storeWebhook(event)

      // Route to appropriate handler
      switch (event.name) {
        case 'installation':
          await this.handleInstallation(event)
          break
        case 'push':
          await this.handlePush(event)
          break
        case 'pull_request':
          await this.handlePullRequest(event)
          break
        case 'repository':
          await this.handleRepository(event)
          break
        case 'organization':
        case 'member':
          await this.handleOrganizationChange(event)
          break
        default:
          logger.debug('Unhandled webhook event', { eventName: event.name })
      }
    } catch (error) {
      logger.error('Failed to process webhook', { error, eventName: event.name })
      throw error
    }
  }

  private async storeWebhook(event: WebhookEvent): Promise<void> {
    const installation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(event.installation?.id || 0) }
    })

    await db.gitHubWebhook.create({
      data: {
        installationId: event.installation ? BigInt(event.installation.id) : null,
        companyId: installation?.companyId,
        eventType: event.name,
        action: event.payload.action || null,
        payload: event.payload,
        githubDeliveryId: event.id,
        processed: false
      }
    })
  }

  private async handleInstallation(event: WebhookEvent): Promise<void> {
    const { action, installation, sender } = event.payload

    if (action === 'created' || action === 'new_permissions_accepted') {
      // Store or update installation
      const company = await this.findCompanyForInstallation(installation)

      if (company) {
        await db.gitHubInstallation.upsert({
          where: { installationId: BigInt(installation.id) },
          update: {
            permissions: installation.permissions,
            events: installation.events,
            repositorySelection: installation.repository_selection,
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            installationId: BigInt(installation.id),
            companyId: company.id,
            accountLogin: installation.account.login,
            accountId: BigInt(installation.account.id),
            accountType: installation.account.type,
            permissions: installation.permissions,
            events: installation.events,
            repositorySelection: installation.repository_selection,
            isActive: true
          }
        })

        // Queue automatic discovery
        await jobManager.queueGitHubOrganizationSync({
          companyId: company.id,
          adminId: undefined,
          fullSync: false
        })
      }
    } else if (action === 'deleted' || action === 'suspend') {
      await db.gitHubInstallation.update({
        where: { installationId: BigInt(installation.id) },
        data: {
          isActive: false,
          suspendedAt: action === 'suspend' ? new Date() : undefined
        }
      })
    }
  }

  private async handlePush(event: WebhookEvent): Promise<void> {
    const { repository, commits, pusher, installation } = event.payload

    if (!installation) return

    const githubInstallation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(installation.id) },
      include: { company: true }
    })

    if (!githubInstallation) return

    // Queue commit analysis - this would need a specific job type for commit analysis
    // For now, we'll queue a webhook processing job
    await jobManager.queueWebhookProcessing({
      webhookId: event.id,
      eventType: 'push',
      payload: event.payload
    })
  }

  private async handlePullRequest(event: WebhookEvent): Promise<void> {
    const { action, pull_request, repository, installation } = event.payload

    if (!installation || !['opened', 'closed', 'merged'].includes(action)) return

    const githubInstallation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(installation.id) }
    })

    if (!githubInstallation) return

    // Queue PR analysis for skill detection
    await jobManager.queueWebhookProcessing({
      webhookId: event.id,
      eventType: 'pull_request',
      payload: event.payload
    })
  }

  private async handleRepository(event: WebhookEvent): Promise<void> {
    const { action, repository, installation } = event.payload

    if (!installation) return

    const githubInstallation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(installation.id) }
    })

    if (!githubInstallation) return

    if (action === 'created' || action === 'unarchived') {
      // Add repository to tracking
      await jobManager.queueWebhookProcessing({
        webhookId: event.id,
        eventType: 'repository',
        payload: event.payload
      })
    }
  }

  private async handleOrganizationChange(event: WebhookEvent): Promise<void> {
    const { installation } = event.payload

    if (!installation) return

    const githubInstallation = await db.gitHubInstallation.findUnique({
      where: { installationId: BigInt(installation.id) }
    })

    if (!githubInstallation) return

    // Re-run discovery to pick up new members
    await jobManager.queueGitHubOrganizationSync({
      companyId: githubInstallation.companyId,
      adminId: undefined,
      fullSync: false
    })
  }

  private async findCompanyForInstallation(installation: any): Promise<{ id: string } | null> {
    // First, check if we have a pending installation token
    const pendingInstall = await db.integration.findFirst({
      where: {
        type: 'GITHUB',
        config: {
          path: ['pendingInstallationId'],
          equals: installation.id
        }
      }
    })

    if (pendingInstall) {
      return { id: pendingInstall.companyId }
    }

    // Otherwise, try to match by organization domain
    const domain = installation.account.login.toLowerCase()
    const company = await db.company.findFirst({
      where: {
        OR: [
          { domain: domain },
          { domain: `${domain}.com` },
          { domain: `${domain}.io` }
        ]
      }
    })

    return company
  }
}
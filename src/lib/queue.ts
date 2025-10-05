import Queue from 'bull'
import Redis from 'ioredis'
import { config } from './config'
import { logger } from './logger'

// Redis connection
const redis = new Redis(config.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
})

// Job types
export enum JobType {
  GITHUB_SYNC_ORGANIZATION = 'github:sync:organization',
  GITHUB_SYNC_EMPLOYEE = 'github:sync:employee',
  GITHUB_AUTO_DISCOVERY = 'github:auto:discovery',
  GITLAB_SYNC_EMPLOYEE = 'gitlab:sync:employee',
  GITLAB_SKILL_DETECTION = 'gitlab:skill:detection',
  SKILL_DETECTION = 'skill:detection',
  CERTIFICATE_GENERATION = 'certificate:generation',
  EMAIL_SEND = 'email:send',
  WEBHOOK_PROCESS = 'webhook:process',
  DATA_CLEANUP = 'data:cleanup',
}

// Job data interfaces
export interface GitHubSyncOrganizationJob {
  companyId: string
  adminId?: string
  fullSync?: boolean
}

export interface GitHubSyncEmployeeJob {
  employeeId: string
  repositories?: string[]
}

export interface GitHubAutoDiscoveryJob {
  companyId: string
  triggeredBy: string
}

export interface SkillDetectionJob {
  employeeId: string
  githubUsername: string
  repositories?: string[]
}

export interface GitLabSyncEmployeeJob {
  employeeId: string
  projects?: string[]
}

export interface GitLabSkillDetectionJob {
  employeeId: string
  gitlabUsername: string
  projects?: string[]
}

export interface CertificateGenerationJob {
  employeeId: string
  periodStart: Date
  periodEnd: Date
  requestedBy: string
}

export interface EmailSendJob {
  to: string | string[]
  subject: string
  html: string
  template?: string
  templateData?: Record<string, unknown>
}

export interface WebhookProcessJob {
  webhookId: string
  eventType: string
  payload: unknown
  retryCount?: number
}

export interface DataCleanupJob {
  type: 'expired_invitations' | 'old_audit_logs' | 'expired_sessions'
  beforeDate: Date
}

// Queue configurations
const queueConfig = {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
  },
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}

// Create queues
export const githubQueue = new Queue('github-operations', queueConfig)
export const gitlabQueue = new Queue('gitlab-operations', queueConfig)
export const skillQueue = new Queue('skill-operations', queueConfig)
export const emailQueue = new Queue('email-operations', queueConfig)
export const certificateQueue = new Queue('certificate-operations', queueConfig)
export const webhookQueue = new Queue('webhook-operations', queueConfig)
export const cleanupQueue = new Queue('cleanup-operations', queueConfig)

// Job processors
class JobProcessor {
  private readonly logger = logger.withContext({ service: 'job_processor' })

  async processGitHubSyncOrganization(job: Queue.Job<GitHubSyncOrganizationJob>) {
    const { companyId, adminId, fullSync = false } = job.data
    const jobLogger = this.logger.withContext({ jobId: job.id, companyId })

    try {
      jobLogger.info('Processing GitHub organization sync', { fullSync, adminId })

      const { enhancedGitHubService } = await import('@/services/github/enhanced-client')
      const { GitHubAutoDiscoveryService } = await import('@/services/github/auto-discovery')

      const discoveryService = new GitHubAutoDiscoveryService()

      // Sync organization repositories
      const repoResult = await enhancedGitHubService.syncOrganizationRepositories(companyId)

      // Auto-discover employees
      const discoveryResult = await discoveryService.discoverOrganizationMembers(companyId)

      // Generate skills for discovered employees
      await discoveryService.generateSkillsForDiscoveredEmployees(companyId)

      jobLogger.info('GitHub organization sync completed', {
        repositories: repoResult.repositories,
        discovered: discoveryResult.discovered,
        matched: discoveryResult.matched
      })

      return {
        success: true,
        repositories: repoResult,
        discovery: discoveryResult
      }

    } catch (error) {
      jobLogger.error('GitHub organization sync failed', error)
      throw error
    }
  }

  async processGitHubSyncEmployee(job: Queue.Job<GitHubSyncEmployeeJob>) {
    const { employeeId, repositories } = job.data
    const jobLogger = this.logger.withEmployee(employeeId)

    try {
      jobLogger.info('Processing GitHub employee sync', { repositoryCount: repositories?.length })

      const { enhancedGitHubService } = await import('@/services/github/enhanced-client')
      const { GitHubAutoDiscoveryService } = await import('@/services/github/auto-discovery')

      const discoveryService = new GitHubAutoDiscoveryService()

      // Match employee contributions
      const matchResult = await enhancedGitHubService.matchEmployeeContributions(employeeId)

      // Get employee data for skill generation
      const { db } = await import('@/lib/db')
      const employee = await db.employee.findUnique({
        where: { id: employeeId }
      })

      if (employee?.githubUsername) {
        await discoveryService.generateEmployeeSkillsFromOrgData(employeeId, employee.githubUsername)
      }

      jobLogger.info('GitHub employee sync completed', {
        matchedRepositories: matchResult.matchedRepositories,
        totalCommits: matchResult.totalCommits
      })

      return {
        success: true,
        contributions: matchResult
      }

    } catch (error) {
      jobLogger.error('GitHub employee sync failed', error)
      throw error
    }
  }

  async processSkillDetection(job: Queue.Job<SkillDetectionJob>) {
    const { employeeId, githubUsername, repositories } = job.data
    const jobLogger = this.logger.withEmployee(employeeId)

    try {
      jobLogger.info('Processing skill detection', { githubUsername, repositoryCount: repositories?.length })

      const { SkillDetector } = await import('@/services/skills/detector')
      const detector = new SkillDetector()

      // Detect skills from repositories
      const detectedSkills = await detector.detectFromRepositories(employeeId)

      // Save detected skills
      await detector.saveDetectedSkills(employeeId, detectedSkills)

      // Detect best practices
      const practices = await detector.detectPractices(employeeId)

      jobLogger.info('Skill detection completed', {
        skillsDetected: detectedSkills.length,
        practicesDetected: practices.length
      })

      return {
        success: true,
        skills: detectedSkills.length,
        practices: practices.length
      }

    } catch (error) {
      jobLogger.error('Skill detection failed', error)
      throw error
    }
  }

  async processGitLabSyncEmployee(job: Queue.Job<GitLabSyncEmployeeJob>) {
    const { employeeId, projects } = job.data
    const jobLogger = this.logger.withEmployee(employeeId)

    try {
      jobLogger.info('Processing GitLab employee sync', { projectCount: projects?.length })

      const { GitLabService } = await import('@/services/gitlab/client')
      const { GitLabSkillDetector } = await import('@/services/gitlab/skill-detector')

      // Get employee's GitLab connection
      const connection = await GitLabService.getConnection(employeeId)

      if (!connection || !connection.accessToken) {
        throw new Error('No GitLab connection found for employee')
      }

      // Detect skills from projects
      const detector = new GitLabSkillDetector(connection.accessToken)
      const skills = await detector.detectSkillsFromProjects(employeeId)

      // Save detected skills
      await detector.saveSkills(employeeId, skills)

      // Update last sync time
      const { db } = await import('@/lib/db')
      await db.integration.update({
        where: { id: connection.id },
        data: { lastSync: new Date() },
      })

      jobLogger.info('GitLab employee sync completed', {
        skillsDetected: skills.length,
      })

      return {
        success: true,
        skills: skills.length,
      }
    } catch (error) {
      jobLogger.error('GitLab employee sync failed', error)
      throw error
    }
  }

  async processGitLabSkillDetection(job: Queue.Job<GitLabSkillDetectionJob>) {
    const { employeeId, gitlabUsername, projects } = job.data
    const jobLogger = this.logger.withEmployee(employeeId)

    try {
      jobLogger.info('Processing GitLab skill detection', { gitlabUsername, projectCount: projects?.length })

      const { GitLabService } = await import('@/services/gitlab/client')
      const { GitLabSkillDetector } = await import('@/services/gitlab/skill-detector')

      // Get employee's GitLab connection
      const connection = await GitLabService.getConnection(employeeId)

      if (!connection || !connection.accessToken) {
        throw new Error('No GitLab connection found for employee')
      }

      // Detect skills
      const detector = new GitLabSkillDetector(connection.accessToken)
      const skills = await detector.detectSkillsFromProjects(employeeId)

      // Save skills
      await detector.saveSkills(employeeId, skills)

      jobLogger.info('GitLab skill detection completed', {
        skillsDetected: skills.length,
      })

      return {
        success: true,
        skills: skills.length,
      }
    } catch (error) {
      jobLogger.error('GitLab skill detection failed', error)
      throw error
    }
  }

  async processCertificateGeneration(job: Queue.Job<CertificateGenerationJob>) {
    const { employeeId, periodStart, periodEnd, requestedBy } = job.data
    const jobLogger = this.logger.withEmployee(employeeId)

    try {
      jobLogger.info('Processing certificate generation', {
        periodStart,
        periodEnd,
        requestedBy
      })

      const { SimpleCertificateGenerator } = await import('@/services/certificates/simple-generator')
      const generator = new SimpleCertificateGenerator()

      const certificateId = await generator.generateCertificate(
        employeeId,
        new Date(periodStart),
        new Date(periodEnd)
      )

      jobLogger.info('Certificate generation completed', { certificateId })

      return {
        success: true,
        certificateId
      }

    } catch (error) {
      jobLogger.error('Certificate generation failed', error)
      throw error
    }
  }

  async processEmailSend(job: Queue.Job<EmailSendJob>) {
    const { to, subject, html, template, templateData } = job.data
    const jobLogger = this.logger.withContext({ recipients: Array.isArray(to) ? to.length : 1 })

    try {
      jobLogger.info('Processing email send', { subject, template })

      const { sendEmail } = await import('@/lib/email')

      if (template && templateData) {
        // Use template rendering if available
        await sendEmail({
          to,
          subject,
          template,
          templateData
        })
      } else {
        // Send raw HTML
        await sendEmail({
          to,
          subject,
          html
        })
      }

      jobLogger.info('Email sent successfully')

      return { success: true }

    } catch (error) {
      jobLogger.error('Email send failed', error)
      throw error
    }
  }

  async processWebhook(job: Queue.Job<WebhookProcessJob>) {
    const { webhookId, eventType, payload, retryCount = 0 } = job.data
    const jobLogger = this.logger.withContext({ webhookId, eventType })

    try {
      jobLogger.info('Processing webhook', { eventType, retryCount })

      // Import webhook processing logic
      // This would contain the logic from our webhook handler
      // For now, just mark as processed

      const { db } = await import('@/lib/db')
      await db.gitHubWebhook.update({
        where: { id: webhookId },
        data: {
          processed: true,
          processedAt: new Date()
        }
      })

      jobLogger.info('Webhook processed successfully')

      return { success: true }

    } catch (error) {
      jobLogger.error('Webhook processing failed', error)

      // Update retry count
      const { db } = await import('@/lib/db')
      await db.gitHubWebhook.update({
        where: { id: webhookId },
        data: {
          retryCount: retryCount + 1,
          errorMessage: error instanceof Error ? error.message : 'Processing failed'
        }
      })

      throw error
    }
  }

  async processDataCleanup(job: Queue.Job<DataCleanupJob>) {
    const { type, beforeDate } = job.data
    const jobLogger = this.logger.withContext({ cleanupType: type })

    try {
      jobLogger.info('Processing data cleanup', { type, beforeDate })

      const { db } = await import('@/lib/db')
      let deletedCount = 0

      switch (type) {
        case 'expired_invitations':
          const expiredInvitations = await db.invitation.deleteMany({
            where: {
              expiresAt: { lt: beforeDate },
              status: 'pending'
            }
          })
          deletedCount = expiredInvitations.count
          break

        case 'old_audit_logs':
          const oldAuditLogs = await db.auditLog.deleteMany({
            where: {
              createdAt: { lt: beforeDate }
            }
          })
          deletedCount = oldAuditLogs.count
          break

        case 'expired_sessions':
          // This would integrate with your session storage
          jobLogger.info('Session cleanup not implemented yet')
          break
      }

      jobLogger.info('Data cleanup completed', { deletedCount })

      return { success: true, deletedCount }

    } catch (error) {
      jobLogger.error('Data cleanup failed', error)
      throw error
    }
  }
}

const processor = new JobProcessor()

// Register job processors
githubQueue.process(JobType.GITHUB_SYNC_ORGANIZATION, 2, processor.processGitHubSyncOrganization.bind(processor))
githubQueue.process(JobType.GITHUB_SYNC_EMPLOYEE, 5, processor.processGitHubSyncEmployee.bind(processor))
githubQueue.process(JobType.GITHUB_AUTO_DISCOVERY, 1, processor.processGitHubSyncOrganization.bind(processor))

gitlabQueue.process(JobType.GITLAB_SYNC_EMPLOYEE, 5, processor.processGitLabSyncEmployee.bind(processor))
gitlabQueue.process(JobType.GITLAB_SKILL_DETECTION, 3, processor.processGitLabSkillDetection.bind(processor))

skillQueue.process(JobType.SKILL_DETECTION, 3, processor.processSkillDetection.bind(processor))

certificateQueue.process(JobType.CERTIFICATE_GENERATION, 2, processor.processCertificateGeneration.bind(processor))

emailQueue.process(JobType.EMAIL_SEND, 10, processor.processEmailSend.bind(processor))

webhookQueue.process(JobType.WEBHOOK_PROCESS, 5, processor.processWebhook.bind(processor))

cleanupQueue.process(JobType.DATA_CLEANUP, 1, processor.processDataCleanup.bind(processor))

// Job queue management
export class JobManager {
  private readonly logger = logger.withContext({ service: 'job_manager' })

  // GitHub operations
  async queueGitHubOrganizationSync(data: GitHubSyncOrganizationJob, options?: Queue.JobOptions) {
    const job = await githubQueue.add(JobType.GITHUB_SYNC_ORGANIZATION, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 5
    })

    this.logger.info('Queued GitHub organization sync', {
      jobId: job.id,
      companyId: data.companyId
    })

    return job.id
  }

  async queueGitHubEmployeeSync(data: GitHubSyncEmployeeJob, options?: Queue.JobOptions) {
    const job = await githubQueue.add(JobType.GITHUB_SYNC_EMPLOYEE, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 3
    })

    this.logger.info('Queued GitHub employee sync', {
      jobId: job.id,
      employeeId: data.employeeId
    })

    return job.id
  }

  // GitLab operations
  async queueGitLabEmployeeSync(data: GitLabSyncEmployeeJob, options?: Queue.JobOptions) {
    const job = await gitlabQueue.add(JobType.GITLAB_SYNC_EMPLOYEE, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 3
    })

    this.logger.info('Queued GitLab employee sync', {
      jobId: job.id,
      employeeId: data.employeeId
    })

    return job.id
  }

  async queueGitLabSkillDetection(data: GitLabSkillDetectionJob, options?: Queue.JobOptions) {
    const job = await gitlabQueue.add(JobType.GITLAB_SKILL_DETECTION, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 2
    })

    this.logger.info('Queued GitLab skill detection', {
      jobId: job.id,
      employeeId: data.employeeId
    })

    return job.id
  }

  async queueSkillDetection(data: SkillDetectionJob, options?: Queue.JobOptions) {
    const job = await skillQueue.add(JobType.SKILL_DETECTION, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 2
    })

    this.logger.info('Queued skill detection', {
      jobId: job.id,
      employeeId: data.employeeId
    })

    return job.id
  }

  async queueCertificateGeneration(data: CertificateGenerationJob, options?: Queue.JobOptions) {
    const job = await certificateQueue.add(JobType.CERTIFICATE_GENERATION, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 4
    })

    this.logger.info('Queued certificate generation', {
      jobId: job.id,
      employeeId: data.employeeId
    })

    return job.id
  }

  async queueEmail(data: EmailSendJob, options?: Queue.JobOptions) {
    const job = await emailQueue.add(JobType.EMAIL_SEND, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 1
    })

    this.logger.info('Queued email send', {
      jobId: job.id,
      recipients: Array.isArray(data.to) ? data.to.length : 1
    })

    return job.id
  }

  // Webhook processing
  async queueWebhookProcessing(data: WebhookProcessJob, options?: Queue.JobOptions) {
    const job = await webhookQueue.add(JobType.WEBHOOK_PROCESS, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 6
    })

    return job.id
  }

  // Cleanup operations
  async queueDataCleanup(data: DataCleanupJob, options?: Queue.JobOptions) {
    const job = await cleanupQueue.add(JobType.DATA_CLEANUP, data, {
      ...options,
      delay: options?.delay || 0,
      priority: options?.priority || 0
    })

    return job.id
  }

  // Queue monitoring
  async getQueueStats() {
    const stats = {
      github: await githubQueue.getJobCounts(),
      gitlab: await gitlabQueue.getJobCounts(),
      skills: await skillQueue.getJobCounts(),
      certificates: await certificateQueue.getJobCounts(),
      email: await emailQueue.getJobCounts(),
      webhooks: await webhookQueue.getJobCounts(),
      cleanup: await cleanupQueue.getJobCounts(),
    }

    return stats
  }

  async getFailedJobs(queue: 'github' | 'gitlab' | 'skills' | 'certificates' | 'email' | 'webhooks' | 'cleanup') {
    const queueMap = {
      github: githubQueue,
      gitlab: gitlabQueue,
      skills: skillQueue,
      certificates: certificateQueue,
      email: emailQueue,
      webhooks: webhookQueue,
      cleanup: cleanupQueue,
    }

    const selectedQueue = queueMap[queue]
    return selectedQueue.getFailed()
  }

  async retryFailedJob(queue: string, jobId: string) {
    // Implementation for retrying failed jobs
    this.logger.info('Retrying failed job', { queue, jobId })
  }
}

// Singleton instance
export const jobManager = new JobManager()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down job queues...')
  await Promise.all([
    githubQueue.close(),
    gitlabQueue.close(),
    skillQueue.close(),
    certificateQueue.close(),
    emailQueue.close(),
    webhookQueue.close(),
    cleanupQueue.close(),
  ])
  process.exit(0)
})
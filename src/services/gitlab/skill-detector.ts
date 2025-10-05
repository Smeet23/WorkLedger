import { GitLabService, GitLabProject } from './client'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'
import { SkillLevel } from '@prisma/client'

export interface DetectedSkill {
  name: string
  category: string
  level: SkillLevel
  confidence: number
  linesOfCode?: number
  projectsUsed: number
  lastUsed: Date
  source: string
}

export class GitLabSkillDetector {
  private gitlabService: GitLabService
  private serviceLogger = logger.withContext({ service: 'gitlab_skill_detector' })

  constructor(accessToken: string) {
    this.gitlabService = new GitLabService(accessToken)
  }

  /**
   * Detect skills from employee's GitLab projects
   */
  async detectSkillsFromProjects(employeeId: string): Promise<DetectedSkill[]> {
    const employeeLogger = this.serviceLogger.withEmployee(employeeId)
    employeeLogger.info('Starting skill detection from GitLab projects')

    try {
      // Get all projects for the user
      const projects = await this.gitlabService.getUserProjects()
      employeeLogger.info(`Found ${projects.length} GitLab projects`)

      if (projects.length === 0) {
        return []
      }

      // Analyze each project for skills
      const skillMap = new Map<string, DetectedSkill>()

      for (const project of projects) {
        try {
          await this.analyzeProject(project, skillMap)
        } catch (error) {
          employeeLogger.warn(`Failed to analyze project: ${project.path_with_namespace}`, { error })
        }
      }

      // Calculate skill levels based on usage
      const skills = Array.from(skillMap.values())
      this.calculateSkillLevels(skills)

      employeeLogger.info(`Detected ${skills.length} unique skills`)
      return skills
    } catch (error) {
      employeeLogger.error('Skill detection failed', error)
      throw error
    }
  }

  /**
   * Analyze a single project for skills
   */
  private async analyzeProject(
    project: GitLabProject,
    skillMap: Map<string, DetectedSkill>
  ): Promise<void> {
    // Get project languages
    const languages = await this.gitlabService.getProjectLanguages(project.id.toString())

    // Process each language
    for (const [language, percentage] of Object.entries(languages)) {
      this.addOrUpdateSkill(skillMap, {
        name: language,
        category: 'Programming Language',
        level: 'BEGINNER' as SkillLevel,
        confidence: percentage / 100,
        linesOfCode: percentage,
        projectsUsed: 1,
        lastUsed: new Date(project.last_activity_at),
        source: 'gitlab',
      })
    }

    // Detect frameworks
    const frameworks = await this.gitlabService.detectFrameworks(project.id.toString())

    for (const framework of frameworks) {
      this.addOrUpdateSkill(skillMap, {
        name: framework,
        category: 'Framework',
        level: 'BEGINNER' as SkillLevel,
        confidence: 0.7,
        projectsUsed: 1,
        lastUsed: new Date(project.last_activity_at),
        source: 'gitlab',
      })
    }

    // Detect CI/CD usage
    if (project.path_with_namespace) {
      await this.detectCICDSkills(project, skillMap)
    }
  }

  /**
   * Detect CI/CD skills from project
   */
  private async detectCICDSkills(
    project: GitLabProject,
    skillMap: Map<string, DetectedSkill>
  ): Promise<void> {
    // Check for .gitlab-ci.yml
    const gitlabCI = await this.gitlabService.getFileContent(
      project.id.toString(),
      '.gitlab-ci.yml'
    )

    if (gitlabCI) {
      this.addOrUpdateSkill(skillMap, {
        name: 'GitLab CI/CD',
        category: 'DevOps',
        level: 'BEGINNER' as SkillLevel,
        confidence: 0.8,
        projectsUsed: 1,
        lastUsed: new Date(project.last_activity_at),
        source: 'gitlab',
      })

      // Analyze CI/CD content for specific tools
      try {
        const content = Buffer.from(gitlabCI.content, 'base64').toString('utf-8').toLowerCase()

        if (content.includes('docker')) {
          this.addOrUpdateSkill(skillMap, {
            name: 'Docker',
            category: 'DevOps',
            level: 'BEGINNER' as SkillLevel,
            confidence: 0.7,
            projectsUsed: 1,
            lastUsed: new Date(project.last_activity_at),
            source: 'gitlab',
          })
        }

        if (content.includes('kubernetes') || content.includes('k8s')) {
          this.addOrUpdateSkill(skillMap, {
            name: 'Kubernetes',
            category: 'DevOps',
            level: 'BEGINNER' as SkillLevel,
            confidence: 0.7,
            projectsUsed: 1,
            lastUsed: new Date(project.last_activity_at),
            source: 'gitlab',
          })
        }
      } catch (error) {
        this.serviceLogger.warn('Failed to parse .gitlab-ci.yml', { projectId: project.id })
      }
    }

    // Check for Dockerfile
    const dockerfile = await this.gitlabService.getFileContent(project.id.toString(), 'Dockerfile')
    if (dockerfile) {
      this.addOrUpdateSkill(skillMap, {
        name: 'Docker',
        category: 'DevOps',
        level: 'BEGINNER' as SkillLevel,
        confidence: 0.8,
        projectsUsed: 1,
        lastUsed: new Date(project.last_activity_at),
        source: 'gitlab',
      })
    }
  }

  /**
   * Add or update skill in the map
   */
  private addOrUpdateSkill(skillMap: Map<string, DetectedSkill>, skill: DetectedSkill): void {
    const existing = skillMap.get(skill.name)

    if (existing) {
      // Update existing skill
      existing.projectsUsed += 1
      existing.confidence = Math.max(existing.confidence, skill.confidence)
      existing.linesOfCode = (existing.linesOfCode || 0) + (skill.linesOfCode || 0)

      if (skill.lastUsed > existing.lastUsed) {
        existing.lastUsed = skill.lastUsed
      }
    } else {
      // Add new skill
      skillMap.set(skill.name, skill)
    }
  }

  /**
   * Calculate skill levels based on usage
   */
  private calculateSkillLevels(skills: DetectedSkill[]): void {
    const thresholds = config.skill.detection.levels

    for (const skill of skills) {
      // Calculate base score from projects and lines of code
      const projectScore = Math.min(skill.projectsUsed / 10, 1)
      const lineScore = Math.min((skill.linesOfCode || 0) / 10000, 1)
      const recencyScore = this.calculateRecencyScore(skill.lastUsed)

      // Combined confidence
      const combinedConfidence =
        projectScore * 0.4 +
        lineScore * 0.3 +
        recencyScore * 0.2 +
        skill.confidence * 0.1

      skill.confidence = Math.min(combinedConfidence, 1)

      // Determine level based on thresholds
      if (
        skill.confidence >= thresholds.EXPERT.confidence &&
        skill.projectsUsed >= thresholds.EXPERT.projects &&
        (skill.linesOfCode || 0) >= thresholds.EXPERT.lines
      ) {
        skill.level = 'EXPERT'
      } else if (
        skill.confidence >= thresholds.ADVANCED.confidence &&
        skill.projectsUsed >= thresholds.ADVANCED.projects &&
        (skill.linesOfCode || 0) >= thresholds.ADVANCED.lines
      ) {
        skill.level = 'ADVANCED'
      } else if (
        skill.confidence >= thresholds.INTERMEDIATE.confidence &&
        skill.projectsUsed >= thresholds.INTERMEDIATE.projects &&
        (skill.linesOfCode || 0) >= thresholds.INTERMEDIATE.lines
      ) {
        skill.level = 'INTERMEDIATE'
      } else {
        skill.level = 'BEGINNER'
      }
    }
  }

  /**
   * Calculate recency score (0-1) based on last used date
   */
  private calculateRecencyScore(lastUsed: Date): number {
    const daysSinceUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    const recencyConfig = config.skill.detection.recency

    if (daysSinceUse <= recencyConfig.veryRecent) return 1.0
    if (daysSinceUse <= recencyConfig.recent) return 0.8
    if (daysSinceUse <= recencyConfig.moderate) return 0.6
    if (daysSinceUse <= recencyConfig.old) return 0.4
    if (daysSinceUse <= recencyConfig.veryOld) return 0.2
    return 0.1
  }

  /**
   * Save detected skills to database
   */
  async saveSkills(employeeId: string, skills: DetectedSkill[]): Promise<void> {
    const employeeLogger = this.serviceLogger.withEmployee(employeeId)
    employeeLogger.info(`Saving ${skills.length} skills to database`)

    for (const detectedSkill of skills) {
      try {
        // Find or create the skill in master list
        const skill = await db.skill.upsert({
          where: { name: detectedSkill.name },
          update: {},
          create: {
            name: detectedSkill.name,
            category: detectedSkill.category,
            description: `Auto-detected from GitLab`,
          },
        })

        // Create or update skill record for employee
        await db.skillRecord.upsert({
          where: {
            employeeId_skillId: {
              employeeId,
              skillId: skill.id,
            },
          },
          update: {
            level: detectedSkill.level,
            confidence: detectedSkill.confidence,
            linesOfCode: detectedSkill.linesOfCode,
            projectsUsed: detectedSkill.projectsUsed,
            lastUsed: detectedSkill.lastUsed,
            source: detectedSkill.source,
            isAutoDetected: true,
            updatedAt: new Date(),
          },
          create: {
            employeeId,
            skillId: skill.id,
            level: detectedSkill.level,
            confidence: detectedSkill.confidence,
            linesOfCode: detectedSkill.linesOfCode,
            projectsUsed: detectedSkill.projectsUsed,
            lastUsed: detectedSkill.lastUsed,
            source: detectedSkill.source,
            isAutoDetected: true,
          },
        })
      } catch (error) {
        employeeLogger.error(`Failed to save skill: ${detectedSkill.name}`, error)
      }
    }

    employeeLogger.info('Skills saved successfully')
  }
}

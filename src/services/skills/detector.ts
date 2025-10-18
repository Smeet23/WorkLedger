import { db } from '@/lib/db'
import { SkillLevel } from '@prisma/client'

interface SkillEvidence {
  type: 'language' | 'framework' | 'tool' | 'practice'
  source: 'github' | 'manual' | 'training'
  frequency: number
  recency: Date
  complexity: number
  projectCount: number
  linesOfCode: number
}

interface DetectedSkill {
  name: string
  category: string
  level: SkillLevel
  confidence: number
  evidence: SkillEvidence[]
}

export class SkillDetector {
  // Weight factors for confidence calculation
  private readonly CONFIDENCE_WEIGHTS = {
    frequency: 0.25,
    recency: 0.20,
    complexity: 0.20,
    duration: 0.15,
    depth: 0.20
  }

  // Thresholds for skill levels
  private readonly LEVEL_THRESHOLDS = {
    EXPERT: { confidence: 0.8, projects: 10, lines: 10000 },
    ADVANCED: { confidence: 0.6, projects: 5, lines: 5000 },
    INTERMEDIATE: { confidence: 0.4, projects: 2, lines: 1000 },
    BEGINNER: { confidence: 0.0, projects: 1, lines: 100 }
  }

  /**
   * Detect skills from GitHub repositories
   */
  async detectFromRepositories(employeeId: string): Promise<DetectedSkill[]> {
    const repositories = await db.repository.findMany({
      where: {
        employeeRepositories: {
          some: { employeeId }
        }
      },
      include: { activities: true }
    })

    const skillMap = new Map<string, SkillEvidence[]>()

    // Process languages
    for (const repo of repositories) {
      const languages = repo.languages as Record<string, number>
      const frameworks = (repo.frameworks as string[]) || []

      // Process languages
      for (const [language, bytes] of Object.entries(languages)) {
        const evidence: SkillEvidence = {
          type: 'language',
          source: 'github',
          frequency: bytes,
          recency: repo.lastActivityAt || repo.updatedAt,
          complexity: this.calculateComplexity(repo),
          projectCount: 1,
          linesOfCode: Math.round(bytes / 50) // Rough estimation
        }

        if (!skillMap.has(language.toLowerCase())) {
          skillMap.set(language.toLowerCase(), [])
        }
        skillMap.get(language.toLowerCase())!.push(evidence)
      }

      // Process frameworks
      for (const framework of frameworks) {
        const evidence: SkillEvidence = {
          type: 'framework',
          source: 'github',
          frequency: 1,
          recency: repo.lastActivityAt || repo.updatedAt,
          complexity: this.calculateComplexity(repo),
          projectCount: 1,
          linesOfCode: repo.size * 10 // Rough estimation
        }

        if (!skillMap.has(framework.toLowerCase())) {
          skillMap.set(framework.toLowerCase(), [])
        }
        skillMap.get(framework.toLowerCase())!.push(evidence)
      }
    }

    // Calculate confidence and determine levels
    const detectedSkills: DetectedSkill[] = []
    for (const [skillName, evidences] of Array.from(skillMap.entries())) {
      const aggregated = this.aggregateEvidence(evidences)
      const confidence = this.calculateConfidence(aggregated)
      const level = this.determineLevel(confidence, aggregated)

      // Get or create skill in database
      const skill = await db.skill.upsert({
        where: { name: skillName },
        update: {},
        create: {
          name: skillName,
          category: evidences[0].type === 'language' ? 'Programming Language' : 'Framework',
          description: `${skillName} detected from GitHub activity`
        }
      })

      detectedSkills.push({
        name: skillName,
        category: skill.category,
        level,
        confidence,
        evidence: evidences
      })
    }

    return detectedSkills
  }

  /**
   * Save detected skills to database
   */
  async saveDetectedSkills(employeeId: string, detectedSkills: DetectedSkill[]): Promise<void> {
    for (const detectedSkill of detectedSkills) {
      // Get skill from database
      const skill = await db.skill.findUnique({
        where: { name: detectedSkill.name }
      })

      if (!skill) continue

      // Create or update skill record
      await db.skillRecord.upsert({
        where: {
          employeeId_skillId: {
            employeeId,
            skillId: skill.id
          }
        },
        update: {
          level: detectedSkill.level,
          confidence: detectedSkill.confidence,
          linesOfCode: detectedSkill.evidence.reduce((sum, e) => sum + e.linesOfCode, 0),
          projectsUsed: detectedSkill.evidence.reduce((sum, e) => sum + e.projectCount, 0),
          lastUsed: detectedSkill.evidence[0]?.recency,
          isAutoDetected: true,
          source: 'github',
          updatedAt: new Date()
        },
        create: {
          employeeId,
          skillId: skill.id,
          level: detectedSkill.level,
          confidence: detectedSkill.confidence,
          linesOfCode: detectedSkill.evidence.reduce((sum, e) => sum + e.linesOfCode, 0),
          projectsUsed: detectedSkill.evidence.reduce((sum, e) => sum + e.projectCount, 0),
          lastUsed: detectedSkill.evidence[0]?.recency,
          isAutoDetected: true,
          source: 'github'
        }
      })

      // Track skill evolution
      await db.skillEvolution.create({
        data: {
          employeeId,
          skillId: skill.id,
          date: new Date(),
          level: detectedSkill.level,
          confidence: detectedSkill.confidence,
          evidenceType: 'github',
          evidenceData: {
            projects: detectedSkill.evidence.length,
            totalLines: detectedSkill.evidence.reduce((sum, e) => sum + e.linesOfCode, 0),
            languages: detectedSkill.category === 'Programming Language' ? [detectedSkill.name] : [],
            frameworks: detectedSkill.category === 'Framework' ? [detectedSkill.name] : []
          },
          totalProjects: detectedSkill.evidence.reduce((sum, e) => sum + e.projectCount, 0),
          totalLines: detectedSkill.evidence.reduce((sum, e) => sum + e.linesOfCode, 0)
        }
      })
    }
  }

  /**
   * Calculate repository complexity score
   */
  private calculateComplexity(repo: any): number {
    let complexity = 0

    // Size factor
    if (repo.size > 10000) complexity += 0.3
    else if (repo.size > 1000) complexity += 0.2
    else if (repo.size > 100) complexity += 0.1

    // Language diversity
    const languages = Object.keys(repo.languages || {})
    if (languages.length > 5) complexity += 0.3
    else if (languages.length > 3) complexity += 0.2
    else if (languages.length > 1) complexity += 0.1

    // Activity metrics
    if (repo.stars > 100) complexity += 0.2
    else if (repo.stars > 10) complexity += 0.1

    if (repo.forks > 10) complexity += 0.1
    if (repo.watchers > 10) complexity += 0.1

    return Math.min(complexity, 1.0)
  }

  /**
   * Aggregate evidence from multiple sources
   */
  private aggregateEvidence(evidences: SkillEvidence[]): SkillEvidence {
    const totalProjects = evidences.length
    const totalLines = evidences.reduce((sum, e) => sum + e.linesOfCode, 0)
    const totalFrequency = evidences.reduce((sum, e) => sum + e.frequency, 0)
    const avgComplexity = evidences.reduce((sum, e) => sum + e.complexity, 0) / evidences.length
    const mostRecent = evidences.reduce((latest, e) =>
      e.recency > latest.recency ? e : latest
    )

    return {
      type: evidences[0].type,
      source: evidences[0].source,
      frequency: totalFrequency,
      recency: mostRecent.recency,
      complexity: avgComplexity,
      projectCount: totalProjects,
      linesOfCode: totalLines
    }
  }

  /**
   * Calculate confidence score for a skill
   */
  private calculateConfidence(evidence: SkillEvidence): number {
    const scores = {
      frequency: this.normalizeScore(evidence.frequency, 10000),
      recency: this.recencyScore(evidence.recency),
      complexity: evidence.complexity,
      duration: this.normalizeScore(evidence.projectCount, 10),
      depth: this.normalizeScore(evidence.linesOfCode, 10000)
    }

    // Calculate weighted average
    let totalWeight = 0
    let weightedSum = 0

    for (const [factor, weight] of Object.entries(this.CONFIDENCE_WEIGHTS)) {
      const score = scores[factor as keyof typeof scores]
      weightedSum += score * weight
      totalWeight += weight
    }

    return weightedSum / totalWeight
  }

  /**
   * Determine skill level based on confidence and metrics
   */
  private determineLevel(confidence: number, evidence: SkillEvidence): SkillLevel {
    const { projectCount, linesOfCode } = evidence

    if (
      confidence >= this.LEVEL_THRESHOLDS.EXPERT.confidence &&
      projectCount >= this.LEVEL_THRESHOLDS.EXPERT.projects &&
      linesOfCode >= this.LEVEL_THRESHOLDS.EXPERT.lines
    ) {
      return SkillLevel.EXPERT
    }

    if (
      confidence >= this.LEVEL_THRESHOLDS.ADVANCED.confidence &&
      projectCount >= this.LEVEL_THRESHOLDS.ADVANCED.projects &&
      linesOfCode >= this.LEVEL_THRESHOLDS.ADVANCED.lines
    ) {
      return SkillLevel.ADVANCED
    }

    if (
      confidence >= this.LEVEL_THRESHOLDS.INTERMEDIATE.confidence &&
      projectCount >= this.LEVEL_THRESHOLDS.INTERMEDIATE.projects &&
      linesOfCode >= this.LEVEL_THRESHOLDS.INTERMEDIATE.lines
    ) {
      return SkillLevel.INTERMEDIATE
    }

    return SkillLevel.BEGINNER
  }

  /**
   * Normalize a score to 0-1 range
   */
  private normalizeScore(value: number, max: number): number {
    return Math.min(value / max, 1.0)
  }

  /**
   * Calculate recency score (how recent the activity is)
   */
  private recencyScore(date: Date): number {
    const now = new Date()
    const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSince <= 30) return 1.0
    if (daysSince <= 90) return 0.8
    if (daysSince <= 180) return 0.6
    if (daysSince <= 365) return 0.4
    if (daysSince <= 730) return 0.2

    return 0.1
  }

  /**
   * Detect best practices and soft skills
   */
  async detectPractices(employeeId: string): Promise<DetectedSkill[]> {
    const repositories = await db.repository.findMany({
      where: {
        employeeRepositories: {
          some: { employeeId }
        }
      },
      include: { activities: true }
    })

    const practices: DetectedSkill[] = []

    // Check for testing practices
    const hasTests = repositories.some(repo => {
      const files = ['test', 'spec', '__tests__', 'tests']
      return files.some(f => repo.name.includes(f))
    })

    if (hasTests) {
      practices.push({
        name: 'testing',
        category: 'Practice',
        level: SkillLevel.INTERMEDIATE,
        confidence: 0.7,
        evidence: []
      })
    }

    // Check for documentation
    const hasDocumentation = repositories.some(repo => {
      return repo.size > 1000 // Larger repos likely have documentation
    })

    if (hasDocumentation) {
      practices.push({
        name: 'documentation',
        category: 'Practice',
        level: SkillLevel.INTERMEDIATE,
        confidence: 0.6,
        evidence: []
      })
    }

    // Check for CI/CD (based on common patterns)
    const hasCI = repositories.some(repo => {
      const patterns = ['.github', '.gitlab', 'jenkinsfile', '.circleci']
      return patterns.some(p => repo.name.toLowerCase().includes(p))
    })

    if (hasCI) {
      practices.push({
        name: 'ci/cd',
        category: 'Practice',
        level: SkillLevel.INTERMEDIATE,
        confidence: 0.65,
        evidence: []
      })
    }

    return practices
  }
}
import { db } from '@/lib/db'
import { loggers } from '@/lib/logger'
import { SkillLevel } from '@prisma/client'

const logger = loggers.external('github:skills')

interface CodeAnalysis {
  languages: Record<string, number> // language -> lines of code
  frameworks: string[]
  libraries: string[]
  tools: string[]
  patterns: string[]
}

interface SkillDetectionResult {
  skillName: string
  category: string
  confidence: number
  evidence: {
    linesOfCode?: number
    commits?: number
    projects?: number
    lastUsed?: Date
    source: string
  }
  level: SkillLevel
}

export class SkillDetector {
  // Language to skill mapping
  private readonly languageMap: Record<string, string> = {
    'JavaScript': 'JavaScript',
    'TypeScript': 'TypeScript',
    'Python': 'Python',
    'Java': 'Java',
    'Go': 'Go',
    'Rust': 'Rust',
    'C++': 'C++',
    'C#': 'C#',
    'Ruby': 'Ruby',
    'PHP': 'PHP',
    'Swift': 'Swift',
    'Kotlin': 'Kotlin',
    'Scala': 'Scala',
    'HTML': 'HTML',
    'CSS': 'CSS',
    'SQL': 'SQL',
    'Shell': 'Shell Scripting',
    'Dockerfile': 'Docker',
    'YAML': 'YAML Configuration'
  }

  // File patterns to detect frameworks/tools
  private readonly frameworkPatterns: Record<string, RegExp[]> = {
    'React': [/package\.json.*"react":/, /\.jsx$/, /\.tsx$/],
    'Next.js': [/next\.config\.(js|ts)/, /package\.json.*"next":/],
    'Vue.js': [/\.vue$/, /package\.json.*"vue":/],
    'Angular': [/angular\.json/, /package\.json.*"@angular\/core":/],
    'Node.js': [/package\.json/, /\.js$/],
    'Express.js': [/package\.json.*"express":/],
    'Django': [/manage\.py/, /settings\.py/, /requirements\.txt.*Django/],
    'Flask': [/requirements\.txt.*Flask/, /app\.py.*Flask/],
    'Spring Boot': [/pom\.xml.*spring-boot/, /build\.gradle.*spring-boot/],
    'Rails': [/Gemfile.*rails/, /config\/routes\.rb/],
    'Laravel': [/composer\.json.*laravel/, /artisan$/],
    'Docker': [/Dockerfile/, /docker-compose\.yml/],
    'Kubernetes': [/\.yaml$.*kind:\s*(Deployment|Service|Pod)/],
    'Terraform': [/\.tf$/, /\.tfvars$/],
    'AWS': [/\.aws\//, /aws-sdk/, /boto3/],
    'PostgreSQL': [/\.sql$/, /migrations\/.*sql/],
    'MongoDB': [/package\.json.*mongodb/, /mongoose/],
    'Redis': [/package\.json.*redis/, /redis\.conf/],
    'GraphQL': [/\.graphql$/, /schema\.gql/, /package\.json.*graphql/],
    'Prisma': [/prisma\/schema\.prisma/, /package\.json.*@prisma/],
    'Jest': [/jest\.config/, /\.test\.(js|ts)$/, /\.spec\.(js|ts)$/],
    'Cypress': [/cypress\.json/, /cypress\.config/],
    'Webpack': [/webpack\.config/, /package\.json.*webpack/],
    'Tailwind CSS': [/tailwind\.config/, /package\.json.*tailwindcss/]
  }

  async detectSkillsFromRepository(
    employeeId: string,
    repositoryData: any
  ): Promise<SkillDetectionResult[]> {
    const skills: SkillDetectionResult[] = []

    // Detect language skills
    if (repositoryData.languages) {
      for (const [language, bytes] of Object.entries(repositoryData.languages)) {
        const skillName = this.languageMap[language] || language
        const linesOfCode = Math.round((bytes as number) / 25) // Rough estimate

        skills.push({
          skillName,
          category: 'Programming Language',
          confidence: this.calculateConfidence(linesOfCode),
          evidence: {
            linesOfCode,
            lastUsed: new Date(),
            source: 'github_repository'
          },
          level: this.calculateLevel(linesOfCode)
        })
      }
    }

    // Detect framework/tool skills from file patterns
    const detectedFrameworks = await this.detectFrameworksFromFiles(repositoryData)
    for (const framework of detectedFrameworks) {
      skills.push({
        skillName: framework,
        category: 'Framework/Library',
        confidence: 0.8,
        evidence: {
          projects: 1,
          lastUsed: new Date(),
          source: 'github_repository'
        },
        level: SkillLevel.INTERMEDIATE
      })
    }

    return skills
  }

  async detectSkillsFromCommits(
    employeeId: string,
    commits: any[]
  ): Promise<SkillDetectionResult[]> {
    const skillMap = new Map<string, {
      commits: number
      files: Set<string>
      additions: number
      deletions: number
    }>()

    for (const commit of commits) {
      if (!commit.files) continue

      for (const file of commit.files) {
        const extension = this.getFileExtension(file.filename)
        const language = this.detectLanguageFromExtension(extension)

        if (language) {
          const existing = skillMap.get(language) || {
            commits: 0,
            files: new Set<string>(),
            additions: 0,
            deletions: 0
          }

          existing.commits++
          existing.files.add(file.filename)
          existing.additions += file.additions || 0
          existing.deletions += file.deletions || 0

          skillMap.set(language, existing)
        }
      }
    }

    const skills: SkillDetectionResult[] = []

    for (const [skillName, data] of Array.from(skillMap.entries())) {
      const totalLines = data.additions + data.deletions
      skills.push({
        skillName,
        category: 'Programming Language',
        confidence: this.calculateConfidence(totalLines, data.commits),
        evidence: {
          linesOfCode: totalLines,
          commits: data.commits,
          lastUsed: new Date(),
          source: 'github_commits'
        },
        level: this.calculateLevel(totalLines, data.commits)
      })
    }

    return skills
  }

  async saveSkillsForEmployee(
    employeeId: string,
    skills: SkillDetectionResult[]
  ): Promise<void> {
    for (const skill of skills) {
      // Get or create skill in master table
      const masterSkill = await db.skill.upsert({
        where: { name: skill.skillName },
        update: { category: skill.category },
        create: {
          name: skill.skillName,
          category: skill.category,
          description: `${skill.category}: ${skill.skillName}`
        }
      })

      // Update or create skill record for employee
      await db.skillRecord.upsert({
        where: {
          employeeId_skillId: {
            employeeId,
            skillId: masterSkill.id
          }
        },
        update: {
          level: skill.level,
          confidence: skill.confidence,
          linesOfCode: skill.evidence.linesOfCode,
          projectsUsed: skill.evidence.projects,
          lastUsed: skill.evidence.lastUsed,
          isAutoDetected: true,
          source: skill.evidence.source,
          updatedAt: new Date()
        },
        create: {
          employeeId,
          skillId: masterSkill.id,
          level: skill.level,
          confidence: skill.confidence,
          linesOfCode: skill.evidence.linesOfCode,
          projectsUsed: skill.evidence.projects,
          lastUsed: skill.evidence.lastUsed,
          isAutoDetected: true,
          source: skill.evidence.source
        }
      })

      // Track skill evolution
      await db.skillEvolution.create({
        data: {
          employeeId,
          skillId: masterSkill.id,
          date: new Date(),
          level: skill.level,
          confidence: skill.confidence,
          evidenceType: skill.evidence.source,
          evidenceData: skill.evidence,
          totalProjects: skill.evidence.projects || 0,
          totalLines: skill.evidence.linesOfCode || 0
        }
      })
    }

    logger.info('Skills saved for employee', {
      employeeId,
      skillCount: skills.length
    })
  }

  private async detectFrameworksFromFiles(repositoryData: any): Promise<string[]> {
    const detected = new Set<string>()

    // Check repository description and topics
    if (repositoryData.description) {
      const desc = repositoryData.description.toLowerCase()
      for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
        if (desc.includes(framework.toLowerCase())) {
          detected.add(framework)
        }
      }
    }

    // Check topics/tags
    if (repositoryData.topics) {
      for (const topic of repositoryData.topics) {
        for (const framework of Object.keys(this.frameworkPatterns)) {
          if (topic.includes(framework.toLowerCase().replace(/\s+/g, '-'))) {
            detected.add(framework)
          }
        }
      }
    }

    return Array.from(detected)
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
  }

  private detectLanguageFromExtension(extension: string): string | null {
    const extensionMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rs': 'Rust',
      'cpp': 'C++',
      'cc': 'C++',
      'c': 'C',
      'cs': 'C#',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'CSS',
      'sass': 'CSS',
      'sql': 'SQL',
      'sh': 'Shell',
      'bash': 'Shell',
      'yml': 'YAML',
      'yaml': 'YAML',
      'json': 'JSON',
      'xml': 'XML',
      'md': 'Markdown'
    }

    return extensionMap[extension.toLowerCase()] || null
  }

  private calculateConfidence(linesOfCode: number, commits: number = 1): number {
    // Confidence based on amount of code and frequency
    const sizeScore = Math.min(linesOfCode / 10000, 1) // Max at 10k lines
    const frequencyScore = Math.min(commits / 50, 1) // Max at 50 commits

    return Math.round((sizeScore * 0.6 + frequencyScore * 0.4) * 100) / 100
  }

  private calculateLevel(linesOfCode: number, commits: number = 1): SkillLevel {
    const total = linesOfCode + commits * 100

    if (total < 1000) return SkillLevel.BEGINNER
    if (total < 5000) return SkillLevel.INTERMEDIATE
    if (total < 20000) return SkillLevel.ADVANCED
    return SkillLevel.EXPERT
  }
}
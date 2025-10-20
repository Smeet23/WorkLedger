import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (in order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.jiraWebhook.deleteMany()
  await prisma.jiraIssueTransition.deleteMany()
  await prisma.jiraWorklog.deleteMany()
  await prisma.jiraComment.deleteMany()
  await prisma.jiraIssue.deleteMany()
  await prisma.jiraUser.deleteMany()
  await prisma.jiraProject.deleteMany()
  await prisma.jiraIntegration.deleteMany()
  await prisma.slackWebhook.deleteMany()
  await prisma.slackMessage.deleteMany()
  await prisma.slackUser.deleteMany()
  await prisma.slackChannel.deleteMany()
  await prisma.slackWorkspace.deleteMany()
  await prisma.slackIntegration.deleteMany()
  await prisma.gitHubTokenAudit.deleteMany()
  await prisma.gitHubWebhook.deleteMany()
  await prisma.gitHubOrganizationMember.deleteMany()
  await prisma.gitHubInstallation.deleteMany()
  await prisma.gitHubIntegration.deleteMany()
  await prisma.pullRequest.deleteMany()
  await prisma.commit.deleteMany()
  await prisma.repositoryActivity.deleteMany()
  await prisma.employeeRepository.deleteMany()
  await prisma.repository.deleteMany()
  await prisma.gitHubConnection.deleteMany()
  await prisma.gitHubActivity.deleteMany()
  await prisma.skillEvolution.deleteMany()
  await prisma.skillRecord.deleteMany()
  await prisma.certificateFile.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.jobQueue.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.company.deleteMany()
  await prisma.skill.deleteMany()

  // Create Skills Master Data
  console.log('📚 Creating skills...')
  const skills = await Promise.all([
    // Programming Languages
    prisma.skill.create({ data: { name: 'JavaScript', category: 'Programming Language', description: 'Dynamic programming language for web development' } }),
    prisma.skill.create({ data: { name: 'TypeScript', category: 'Programming Language', description: 'Typed superset of JavaScript' } }),
    prisma.skill.create({ data: { name: 'Python', category: 'Programming Language', description: 'High-level programming language' } }),
    prisma.skill.create({ data: { name: 'Java', category: 'Programming Language', description: 'Object-oriented programming language' } }),
    prisma.skill.create({ data: { name: 'Go', category: 'Programming Language', description: 'Statically typed compiled language' } }),
    prisma.skill.create({ data: { name: 'Rust', category: 'Programming Language', description: 'Systems programming language' } }),
    prisma.skill.create({ data: { name: 'Ruby', category: 'Programming Language', description: 'Dynamic, object-oriented language' } }),
    prisma.skill.create({ data: { name: 'PHP', category: 'Programming Language', description: 'Server-side scripting language' } }),
    prisma.skill.create({ data: { name: 'C#', category: 'Programming Language', description: 'Modern object-oriented language' } }),
    prisma.skill.create({ data: { name: 'Swift', category: 'Programming Language', description: 'iOS development language' } }),
    prisma.skill.create({ data: { name: 'Kotlin', category: 'Programming Language', description: 'Modern JVM language' } }),

    // Frameworks
    prisma.skill.create({ data: { name: 'React', category: 'Framework', description: 'JavaScript library for building user interfaces' } }),
    prisma.skill.create({ data: { name: 'Next.js', category: 'Framework', description: 'React framework for production' } }),
    prisma.skill.create({ data: { name: 'Node.js', category: 'Framework', description: 'JavaScript runtime for server-side development' } }),
    prisma.skill.create({ data: { name: 'Express', category: 'Framework', description: 'Web framework for Node.js' } }),
    prisma.skill.create({ data: { name: 'Django', category: 'Framework', description: 'Python web framework' } }),
    prisma.skill.create({ data: { name: 'Flask', category: 'Framework', description: 'Lightweight Python web framework' } }),
    prisma.skill.create({ data: { name: 'Spring Boot', category: 'Framework', description: 'Java application framework' } }),
    prisma.skill.create({ data: { name: 'Vue.js', category: 'Framework', description: 'Progressive JavaScript framework' } }),
    prisma.skill.create({ data: { name: 'Angular', category: 'Framework', description: 'TypeScript-based web framework' } }),
    prisma.skill.create({ data: { name: 'Rails', category: 'Framework', description: 'Ruby web framework' } }),
    prisma.skill.create({ data: { name: 'Laravel', category: 'Framework', description: 'PHP web framework' } }),
    prisma.skill.create({ data: { name: 'FastAPI', category: 'Framework', description: 'Modern Python API framework' } }),

    // Databases
    prisma.skill.create({ data: { name: 'PostgreSQL', category: 'Database', description: 'Open source relational database' } }),
    prisma.skill.create({ data: { name: 'MongoDB', category: 'Database', description: 'NoSQL document database' } }),
    prisma.skill.create({ data: { name: 'Redis', category: 'Database', description: 'In-memory data structure store' } }),
    prisma.skill.create({ data: { name: 'MySQL', category: 'Database', description: 'Open source relational database' } }),
    prisma.skill.create({ data: { name: 'DynamoDB', category: 'Database', description: 'AWS NoSQL database' } }),
    prisma.skill.create({ data: { name: 'Elasticsearch', category: 'Database', description: 'Search and analytics engine' } }),

    // DevOps & Tools
    prisma.skill.create({ data: { name: 'Docker', category: 'DevOps', description: 'Containerization platform' } }),
    prisma.skill.create({ data: { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration platform' } }),
    prisma.skill.create({ data: { name: 'AWS', category: 'Cloud', description: 'Amazon Web Services cloud platform' } }),
    prisma.skill.create({ data: { name: 'GCP', category: 'Cloud', description: 'Google Cloud Platform' } }),
    prisma.skill.create({ data: { name: 'Azure', category: 'Cloud', description: 'Microsoft Azure cloud platform' } }),
    prisma.skill.create({ data: { name: 'Git', category: 'Tool', description: 'Version control system' } }),
    prisma.skill.create({ data: { name: 'CI/CD', category: 'DevOps', description: 'Continuous Integration/Deployment' } }),
    prisma.skill.create({ data: { name: 'Terraform', category: 'DevOps', description: 'Infrastructure as code tool' } }),
    prisma.skill.create({ data: { name: 'Jenkins', category: 'DevOps', description: 'Automation server' } }),

    // Frontend
    prisma.skill.create({ data: { name: 'CSS', category: 'Frontend', description: 'Cascading Style Sheets' } }),
    prisma.skill.create({ data: { name: 'Tailwind CSS', category: 'Frontend', description: 'Utility-first CSS framework' } }),
    prisma.skill.create({ data: { name: 'HTML', category: 'Frontend', description: 'HyperText Markup Language' } }),
    prisma.skill.create({ data: { name: 'Sass', category: 'Frontend', description: 'CSS preprocessor' } }),
    prisma.skill.create({ data: { name: 'Webpack', category: 'Frontend', description: 'Module bundler' } }),

    // Testing
    prisma.skill.create({ data: { name: 'Jest', category: 'Testing', description: 'JavaScript testing framework' } }),
    prisma.skill.create({ data: { name: 'Pytest', category: 'Testing', description: 'Python testing framework' } }),
    prisma.skill.create({ data: { name: 'Cypress', category: 'Testing', description: 'End-to-end testing framework' } }),
    prisma.skill.create({ data: { name: 'JUnit', category: 'Testing', description: 'Java testing framework' } }),

    // Other
    prisma.skill.create({ data: { name: 'GraphQL', category: 'API', description: 'Query language for APIs' } }),
    prisma.skill.create({ data: { name: 'REST API', category: 'API', description: 'RESTful API design and development' } }),
    prisma.skill.create({ data: { name: 'gRPC', category: 'API', description: 'High-performance RPC framework' } }),
    prisma.skill.create({ data: { name: 'WebSockets', category: 'API', description: 'Real-time communication protocol' } }),
  ])

  console.log(`✅ Created ${skills.length} skills`)

  // Create Company
  console.log('🏢 Creating company...')
  const company = await prisma.company.create({
    data: {
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      website: 'https://techcorp.com',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=techcorp',
      industry: 'Software Development',
      size: '50-200',
      tier: 'GROWTH',
      isActive: true,
    },
  })

  // Create Company Settings
  await prisma.companySettings.create({
    data: {
      companyId: company.id,
      shareSkills: true,
      shareAchievements: true,
      shareProjectTypes: true,
      shareTraining: true,
      shareTenure: true,
      companyBranding: true,
      autoIssueEnabled: true,
      minTrackingDays: 30,
    },
  })

  console.log(`✅ Created company: ${company.name}`)

  // Create Users and Employees
  console.log('👥 Creating users and employees...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const employees: any = {}

  // Admin/Manager
  const adminUser = await prisma.user.create({ data: { email: 'admin@techcorp.com', password: hashedPassword, firstName: 'John', lastName: 'Smith', role: 'company_admin', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.admin = await prisma.employee.create({ data: { email: 'admin@techcorp.com', firstName: 'John', lastName: 'Smith', companyId: company.id, role: 'MANAGER', title: 'Engineering Manager', department: 'Engineering', bio: 'Engineering leader with 10+ years of experience in building scalable systems.', githubUsername: 'johnsmith', githubId: '1000001', isActive: true, startDate: new Date('2020-01-15'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' } })

  // Senior Full-Stack Developer
  const dev1User = await prisma.user.create({ data: { email: 'sarah.johnson@techcorp.com', password: hashedPassword, firstName: 'Sarah', lastName: 'Johnson', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.sarah = await prisma.employee.create({ data: { email: 'sarah.johnson@techcorp.com', firstName: 'Sarah', lastName: 'Johnson', companyId: company.id, role: 'DEVELOPER', title: 'Senior Full-Stack Developer', department: 'Engineering', bio: 'Full-stack developer specializing in React, Node.js, and cloud infrastructure.', githubUsername: 'sarahjohnson', githubId: '1000002', linkedinUrl: 'https://linkedin.com/in/sarahjohnson', isActive: true, startDate: new Date('2021-03-10'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' } })

  // Backend Developer
  const dev2User = await prisma.user.create({ data: { email: 'mike.chen@techcorp.com', password: hashedPassword, firstName: 'Mike', lastName: 'Chen', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.mike = await prisma.employee.create({ data: { email: 'mike.chen@techcorp.com', firstName: 'Mike', lastName: 'Chen', companyId: company.id, role: 'DEVELOPER', title: 'Backend Developer', department: 'Engineering', bio: 'Backend specialist with expertise in Python, Django, and microservices architecture.', githubUsername: 'mikechen', githubId: '1000003', linkedinUrl: 'https://linkedin.com/in/mikechen', isActive: true, startDate: new Date('2022-06-01'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike' } })

  // Frontend Developer
  const dev3User = await prisma.user.create({ data: { email: 'emily.rodriguez@techcorp.com', password: hashedPassword, firstName: 'Emily', lastName: 'Rodriguez', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.emily = await prisma.employee.create({ data: { email: 'emily.rodriguez@techcorp.com', firstName: 'Emily', lastName: 'Rodriguez', companyId: company.id, role: 'DEVELOPER', title: 'Frontend Developer', department: 'Engineering', bio: 'Frontend expert passionate about creating beautiful, accessible user experiences.', githubUsername: 'emilyrodriguez', githubId: '1000004', isActive: true, startDate: new Date('2022-09-15'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' } })

  // UI/UX Designer
  const designerUser = await prisma.user.create({ data: { email: 'alex.kim@techcorp.com', password: hashedPassword, firstName: 'Alex', lastName: 'Kim', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.alex = await prisma.employee.create({ data: { email: 'alex.kim@techcorp.com', firstName: 'Alex', lastName: 'Kim', companyId: company.id, role: 'DESIGNER', title: 'UI/UX Designer', department: 'Design', bio: 'UI/UX designer focused on user-centered design and design systems.', isActive: true, startDate: new Date('2021-11-01'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' } })

  // DevOps Engineer
  const devopsUser = await prisma.user.create({ data: { email: 'raj.patel@techcorp.com', password: hashedPassword, firstName: 'Raj', lastName: 'Patel', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.raj = await prisma.employee.create({ data: { email: 'raj.patel@techcorp.com', firstName: 'Raj', lastName: 'Patel', companyId: company.id, role: 'DEVELOPER', title: 'DevOps Engineer', department: 'Engineering', bio: 'DevOps engineer specializing in Kubernetes, Docker, and cloud infrastructure.', githubUsername: 'rajpatel', githubId: '1000005', isActive: true, startDate: new Date('2021-08-20'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj' } })

  // Junior Developer
  const juniorUser = await prisma.user.create({ data: { email: 'jenny.wilson@techcorp.com', password: hashedPassword, firstName: 'Jenny', lastName: 'Wilson', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.jenny = await prisma.employee.create({ data: { email: 'jenny.wilson@techcorp.com', firstName: 'Jenny', lastName: 'Wilson', companyId: company.id, role: 'DEVELOPER', title: 'Junior Developer', department: 'Engineering', bio: 'Enthusiastic junior developer learning full-stack development.', githubUsername: 'jennywilson', githubId: '1000006', isActive: true, startDate: new Date('2023-05-01'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jenny' } })

  // Product Manager
  const pmUser = await prisma.user.create({ data: { email: 'chris.taylor@techcorp.com', password: hashedPassword, firstName: 'Chris', lastName: 'Taylor', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.chris = await prisma.employee.create({ data: { email: 'chris.taylor@techcorp.com', firstName: 'Chris', lastName: 'Taylor', companyId: company.id, role: 'MANAGER', title: 'Product Manager', department: 'Product', bio: 'Product manager with a passion for user experience and data-driven decisions.', isActive: true, startDate: new Date('2020-09-10'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris' } })

  // Data Engineer
  const dataUser = await prisma.user.create({ data: { email: 'maria.garcia@techcorp.com', password: hashedPassword, firstName: 'Maria', lastName: 'Garcia', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.maria = await prisma.employee.create({ data: { email: 'maria.garcia@techcorp.com', firstName: 'Maria', lastName: 'Garcia', companyId: company.id, role: 'DEVELOPER', title: 'Data Engineer', department: 'Engineering', bio: 'Data engineer specializing in big data processing and analytics pipelines.', githubUsername: 'mariagarcia', githubId: '1000007', isActive: true, startDate: new Date('2022-02-15'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria' } })

  // QA Engineer
  const qaUser = await prisma.user.create({ data: { email: 'tom.anderson@techcorp.com', password: hashedPassword, firstName: 'Tom', lastName: 'Anderson', role: 'user', isActive: true, emailVerified: true, lastLogin: new Date() } })
  employees.tom = await prisma.employee.create({ data: { email: 'tom.anderson@techcorp.com', firstName: 'Tom', lastName: 'Anderson', companyId: company.id, role: 'DEVELOPER', title: 'QA Engineer', department: 'Engineering', bio: 'Quality assurance engineer focused on test automation and CI/CD.', githubUsername: 'tomanderson', githubId: '1000008', isActive: true, startDate: new Date('2021-06-15'), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom' } })

  console.log('✅ Created 10 employees')

  // Helper function to create skill records
  const createSkillRecord = (employeeId: string, skillName: string, level: string, confidence: number, linesOfCode?: number, projectsUsed?: number) => {
    const skill = skills.find((s) => s.name === skillName)
    if (!skill) return null
    return prisma.skillRecord.create({
      data: {
        employeeId,
        skillId: skill.id,
        level: level as any,
        confidence,
        linesOfCode,
        projectsUsed,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    })
  }

  // Create Skill Records
  console.log('🎯 Creating skill records...')

  await Promise.all([
    // Sarah's Skills (Full-Stack)
    createSkillRecord(employees.sarah.id, 'JavaScript', 'EXPERT', 0.95, 150000, 25),
    createSkillRecord(employees.sarah.id, 'TypeScript', 'EXPERT', 0.92, 120000, 20),
    createSkillRecord(employees.sarah.id, 'React', 'EXPERT', 0.94, 80000, 18),
    createSkillRecord(employees.sarah.id, 'Next.js', 'ADVANCED', 0.88, 45000, 12),
    createSkillRecord(employees.sarah.id, 'Node.js', 'ADVANCED', 0.89, 60000, 15),
    createSkillRecord(employees.sarah.id, 'PostgreSQL', 'ADVANCED', 0.85, undefined, 10),
    createSkillRecord(employees.sarah.id, 'Docker', 'INTERMEDIATE', 0.78, undefined, 8),
    createSkillRecord(employees.sarah.id, 'AWS', 'INTERMEDIATE', 0.75, undefined, 6),

    // Mike's Skills (Backend)
    createSkillRecord(employees.mike.id, 'Python', 'EXPERT', 0.96, 180000, 30),
    createSkillRecord(employees.mike.id, 'Django', 'EXPERT', 0.93, 95000, 15),
    createSkillRecord(employees.mike.id, 'Flask', 'ADVANCED', 0.87, 40000, 8),
    createSkillRecord(employees.mike.id, 'PostgreSQL', 'EXPERT', 0.91, undefined, 20),
    createSkillRecord(employees.mike.id, 'MongoDB', 'ADVANCED', 0.84, undefined, 12),
    createSkillRecord(employees.mike.id, 'Redis', 'ADVANCED', 0.82, undefined, 10),
    createSkillRecord(employees.mike.id, 'Docker', 'ADVANCED', 0.86, undefined, 15),
    createSkillRecord(employees.mike.id, 'Kubernetes', 'INTERMEDIATE', 0.75, undefined, 5),

    // Emily's Skills (Frontend)
    createSkillRecord(employees.emily.id, 'JavaScript', 'ADVANCED', 0.89, 95000, 20),
    createSkillRecord(employees.emily.id, 'TypeScript', 'ADVANCED', 0.86, 70000, 15),
    createSkillRecord(employees.emily.id, 'React', 'EXPERT', 0.93, 105000, 22),
    createSkillRecord(employees.emily.id, 'Vue.js', 'INTERMEDIATE', 0.76, 30000, 6),
    createSkillRecord(employees.emily.id, 'CSS', 'EXPERT', 0.92, 85000, 25),
    createSkillRecord(employees.emily.id, 'Tailwind CSS', 'ADVANCED', 0.88, 40000, 12),
    createSkillRecord(employees.emily.id, 'HTML', 'EXPERT', 0.95, 120000, 30),

    // John's Skills (Manager)
    createSkillRecord(employees.admin.id, 'JavaScript', 'ADVANCED', 0.85, 80000, 15),
    createSkillRecord(employees.admin.id, 'Python', 'ADVANCED', 0.83, 75000, 12),
    createSkillRecord(employees.admin.id, 'Docker', 'ADVANCED', 0.87, undefined, 18),

    // Raj's Skills (DevOps)
    createSkillRecord(employees.raj.id, 'Docker', 'EXPERT', 0.95, undefined, 30),
    createSkillRecord(employees.raj.id, 'Kubernetes', 'EXPERT', 0.93, undefined, 25),
    createSkillRecord(employees.raj.id, 'AWS', 'EXPERT', 0.91, undefined, 28),
    createSkillRecord(employees.raj.id, 'Terraform', 'ADVANCED', 0.88, 35000, 15),
    createSkillRecord(employees.raj.id, 'Python', 'INTERMEDIATE', 0.76, 25000, 10),
    createSkillRecord(employees.raj.id, 'CI/CD', 'EXPERT', 0.94, undefined, 32),

    // Jenny's Skills (Junior)
    createSkillRecord(employees.jenny.id, 'JavaScript', 'INTERMEDIATE', 0.72, 15000, 5),
    createSkillRecord(employees.jenny.id, 'TypeScript', 'BEGINNER', 0.65, 8000, 3),
    createSkillRecord(employees.jenny.id, 'React', 'INTERMEDIATE', 0.70, 12000, 4),
    createSkillRecord(employees.jenny.id, 'Node.js', 'BEGINNER', 0.68, 6000, 2),

    // Maria's Skills (Data Engineer)
    createSkillRecord(employees.maria.id, 'Python', 'EXPERT', 0.94, 145000, 22),
    createSkillRecord(employees.maria.id, 'PostgreSQL', 'EXPERT', 0.89, undefined, 18),
    createSkillRecord(employees.maria.id, 'MongoDB', 'ADVANCED', 0.82, undefined, 12),
    createSkillRecord(employees.maria.id, 'Elasticsearch', 'ADVANCED', 0.85, undefined, 10),
    createSkillRecord(employees.maria.id, 'AWS', 'ADVANCED', 0.80, undefined, 14),

    // Tom's Skills (QA)
    createSkillRecord(employees.tom.id, 'JavaScript', 'ADVANCED', 0.84, 45000, 15),
    createSkillRecord(employees.tom.id, 'TypeScript', 'INTERMEDIATE', 0.76, 28000, 10),
    createSkillRecord(employees.tom.id, 'Cypress', 'EXPERT', 0.92, 52000, 20),
    createSkillRecord(employees.tom.id, 'Jest', 'ADVANCED', 0.88, 38000, 16),
  ].filter(Boolean))

  console.log('✅ Created skill records')

  // Create Repositories
  console.log('📁 Creating repositories...')

  const repos: any = {}

  repos.webapp = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345001', name: 'web-app', fullName: 'techcorp/web-app', isPrivate: true, isFork: false,
      description: 'Main web application built with Next.js and React', defaultBranch: 'main', stars: 24, forks: 3, watchers: 18,
      size: 15420, openIssues: 12, primaryLanguage: 'TypeScript', languages: { TypeScript: 65, JavaScript: 20, CSS: 15 },
      frameworks: ['React', 'Next.js', 'Tailwind CSS'], totalCommits: 542, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-01-15'), pushedAt: new Date(),
    },
  })

  repos.backend = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345002', name: 'backend-service', fullName: 'techcorp/backend-service', isPrivate: true, isFork: false,
      description: 'Django-based backend service with REST API', defaultBranch: 'main', stars: 18, forks: 2, watchers: 12,
      size: 22340, openIssues: 8, primaryLanguage: 'Python', languages: { Python: 90, Shell: 10 },
      frameworks: ['Django', 'PostgreSQL'], totalCommits: 658, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2022-08-20'), pushedAt: new Date(),
    },
  })

  repos.design = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345003', name: 'design-system', fullName: 'techcorp/design-system', isPrivate: false, isFork: false,
      description: 'Company design system and component library', defaultBranch: 'main', stars: 156, forks: 24, watchers: 89,
      size: 8940, openIssues: 15, primaryLanguage: 'TypeScript', languages: { TypeScript: 50, CSS: 40, JavaScript: 10 },
      frameworks: ['React', 'Tailwind CSS'], totalCommits: 387, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-03-10'), pushedAt: new Date(),
    },
  })

  repos.mobile = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345004', name: 'mobile-app', fullName: 'techcorp/mobile-app', isPrivate: true, isFork: false,
      description: 'React Native mobile application', defaultBranch: 'main', stars: 32, forks: 5, watchers: 22,
      size: 18200, openIssues: 18, primaryLanguage: 'TypeScript', languages: { TypeScript: 70, JavaScript: 25, Java: 3, Swift: 2 },
      frameworks: ['React Native'], totalCommits: 428, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-02-01'), pushedAt: new Date(),
    },
  })

  repos.infrastructure = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345005', name: 'infrastructure', fullName: 'techcorp/infrastructure', isPrivate: true, isFork: false,
      description: 'Infrastructure as code with Terraform and Kubernetes', defaultBranch: 'main', stars: 14, forks: 1, watchers: 10,
      size: 5620, openIssues: 6, primaryLanguage: 'HCL', languages: { HCL: 60, YAML: 30, Shell: 10 },
      frameworks: ['Terraform', 'Kubernetes'], totalCommits: 245, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2022-11-05'), pushedAt: new Date(),
    },
  })

  repos.datapipeline = await prisma.repository.create({
    data: {
      companyId: company.id, githubRepoId: '12345006', name: 'data-pipeline', fullName: 'techcorp/data-pipeline', isPrivate: true, isFork: false,
      description: 'ETL data pipeline with Python and Airflow', defaultBranch: 'main', stars: 9, forks: 1, watchers: 7,
      size: 12450, openIssues: 5, primaryLanguage: 'Python', languages: { Python: 85, YAML: 15 },
      frameworks: ['Airflow', 'Pandas'], totalCommits: 312, lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-04-12'), pushedAt: new Date(),
    },
  })

  console.log('✅ Created 6 repositories')

  // Create Employee Repository Relationships
  console.log('🔗 Creating employee-repository relationships...')

  await Promise.all([
    // Sarah's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.sarah.id, repositoryId: repos.webapp.id, commitCount: 342, linesAdded: 45000, linesDeleted: 15000, pullRequests: 85, firstCommitAt: new Date('2023-01-20'), lastCommitAt: new Date(), lastActivityAt: new Date(), isOwner: true } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.sarah.id, repositoryId: repos.backend.id, commitCount: 56, linesAdded: 8500, linesDeleted: 2200, pullRequests: 18, firstCommitAt: new Date('2023-05-10'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.sarah.id, repositoryId: repos.mobile.id, commitCount: 78, linesAdded: 12000, linesDeleted: 3500, pullRequests: 22, firstCommitAt: new Date('2023-02-15'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Mike's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.mike.id, repositoryId: repos.backend.id, commitCount: 458, linesAdded: 68000, linesDeleted: 22000, pullRequests: 125, firstCommitAt: new Date('2022-08-25'), lastCommitAt: new Date(), lastActivityAt: new Date(), isOwner: true } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.mike.id, repositoryId: repos.webapp.id, commitCount: 42, linesAdded: 5200, linesDeleted: 1800, pullRequests: 12, firstCommitAt: new Date('2023-06-15'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.mike.id, repositoryId: repos.datapipeline.id, commitCount: 95, linesAdded: 18000, linesDeleted: 5000, pullRequests: 28, firstCommitAt: new Date('2023-04-20'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Emily's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.emily.id, repositoryId: repos.design.id, commitCount: 287, linesAdded: 52000, linesDeleted: 18000, pullRequests: 95, firstCommitAt: new Date('2023-03-15'), lastCommitAt: new Date(), lastActivityAt: new Date(), isOwner: true } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.emily.id, repositoryId: repos.webapp.id, commitCount: 124, linesAdded: 18500, linesDeleted: 6200, pullRequests: 42, firstCommitAt: new Date('2023-02-10'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.emily.id, repositoryId: repos.mobile.id, commitCount: 156, linesAdded: 24000, linesDeleted: 8000, pullRequests: 38, firstCommitAt: new Date('2023-02-20'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Raj's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.raj.id, repositoryId: repos.infrastructure.id, commitCount: 245, linesAdded: 38000, linesDeleted: 12000, pullRequests: 68, firstCommitAt: new Date('2022-11-10'), lastCommitAt: new Date(), lastActivityAt: new Date(), isOwner: true } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.raj.id, repositoryId: repos.backend.id, commitCount: 52, linesAdded: 7200, linesDeleted: 2400, pullRequests: 15, firstCommitAt: new Date('2023-03-01'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Jenny's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.jenny.id, repositoryId: repos.webapp.id, commitCount: 34, linesAdded: 4500, linesDeleted: 1200, pullRequests: 8, firstCommitAt: new Date('2023-05-15'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Maria's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.maria.id, repositoryId: repos.datapipeline.id, commitCount: 217, linesAdded: 42000, linesDeleted: 14000, pullRequests: 58, firstCommitAt: new Date('2023-04-15'), lastCommitAt: new Date(), lastActivityAt: new Date(), isOwner: true } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.maria.id, repositoryId: repos.backend.id, commitCount: 92, linesAdded: 15000, linesDeleted: 4500, pullRequests: 24, firstCommitAt: new Date('2023-06-01'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),

    // Tom's repos
    prisma.employeeRepository.create({ data: { employeeId: employees.tom.id, repositoryId: repos.webapp.id, commitCount: 68, linesAdded: 9800, linesDeleted: 3200, pullRequests: 18, firstCommitAt: new Date('2021-07-01'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),
    prisma.employeeRepository.create({ data: { employeeId: employees.tom.id, repositoryId: repos.mobile.id, commitCount: 42, linesAdded: 6200, linesDeleted: 2100, pullRequests: 12, firstCommitAt: new Date('2023-03-05'), lastCommitAt: new Date(), lastActivityAt: new Date() } }),
  ])

  console.log('✅ Created employee-repository relationships')

  // Create Commits
  console.log('💾 Creating commits...')

  const commitsToCreate = []
  const now = new Date()

  // Generate commits for the past 30 days
  for (let i = 0; i < 30; i++) {
    const commitDate = new Date(now)
    commitDate.setDate(commitDate.getDate() - i)

    // Sarah's commits
    if (i % 2 === 0) {
      commitsToCreate.push(
        prisma.commit.create({
          data: {
            repositoryId: repos.webapp.id, sha: `sha-webapp-sarah-${i}`, message: `feat: implement new feature component`,
            authorName: 'Sarah Johnson', authorEmail: 'sarah.johnson@techcorp.com', authorDate: commitDate,
            committerName: 'Sarah Johnson', committerEmail: 'sarah.johnson@techcorp.com', commitDate: commitDate,
            additions: 120 + i * 10, deletions: 45 + i * 2, filesChanged: 5 + i,
            files: ['src/components/Feature.tsx', 'src/utils/helpers.ts'], parentShas: [`parent-${i}`],
          },
        })
      )
    }

    // Mike's commits
    if (i % 3 === 0) {
      commitsToCreate.push(
        prisma.commit.create({
          data: {
            repositoryId: repos.backend.id, sha: `sha-backend-mike-${i}`, message: `fix: resolve database connection issue`,
            authorName: 'Mike Chen', authorEmail: 'mike.chen@techcorp.com', authorDate: commitDate,
            committerName: 'Mike Chen', committerEmail: 'mike.chen@techcorp.com', commitDate: commitDate,
            additions: 85 + i * 8, deletions: 32 + i * 3, filesChanged: 4 + i,
            files: ['api/models.py', 'api/views.py'], parentShas: [`parent-${i}`],
          },
        })
      )
    }

    // Emily's commits
    if (i % 2 === 1) {
      commitsToCreate.push(
        prisma.commit.create({
          data: {
            repositoryId: repos.design.id, sha: `sha-design-emily-${i}`, message: `style: update button component styles`,
            authorName: 'Emily Rodriguez', authorEmail: 'emily.rodriguez@techcorp.com', authorDate: commitDate,
            committerName: 'Emily Rodriguez', committerEmail: 'emily.rodriguez@techcorp.com', commitDate: commitDate,
            additions: 95 + i * 5, deletions: 28 + i * 2, filesChanged: 3 + i,
            files: ['components/Button.tsx', 'styles/button.css'], parentShas: [`parent-${i}`],
          },
        })
      )
    }
  }

  await Promise.all(commitsToCreate.slice(0, 50)) // Create first 50 commits

  console.log('✅ Created commits')

  // Create Pull Requests
  console.log('🔀 Creating pull requests...')

  await Promise.all([
    prisma.pullRequest.create({
      data: {
        repositoryId: repos.webapp.id, number: 45, title: 'Add user authentication flow',
        body: 'Implements JWT-based authentication with refresh tokens', state: 'merged', authorUsername: 'sarahjohnson',
        authorEmail: 'sarah.johnson@techcorp.com', headBranch: 'feature/auth', baseBranch: 'main', isDraft: false,
        isMerged: true, additions: 1250, deletions: 320, changedFiles: 18, commits: 12, comments: 8,
        reviewComments: 15, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-20'),
        mergedAt: new Date('2024-01-20'), mergedBy: 'johnsmith', labels: ['feature', 'authentication'],
      },
    }),
    prisma.pullRequest.create({
      data: {
        repositoryId: repos.webapp.id, number: 48, title: 'Improve dashboard performance',
        body: 'Optimizes rendering and adds memoization', state: 'open', authorUsername: 'emilyrodriguez',
        authorEmail: 'emily.rodriguez@techcorp.com', headBranch: 'perf/dashboard', baseBranch: 'main', isDraft: false,
        isMerged: false, additions: 450, deletions: 180, changedFiles: 8, commits: 6, comments: 3,
        reviewComments: 5, createdAt: new Date('2024-02-01'), updatedAt: new Date(),
        labels: ['performance', 'frontend'],
      },
    }),
    prisma.pullRequest.create({
      data: {
        repositoryId: repos.backend.id, number: 152, title: 'Add caching layer with Redis',
        body: 'Implements Redis caching for frequently accessed data', state: 'merged', authorUsername: 'mikechen',
        authorEmail: 'mike.chen@techcorp.com', headBranch: 'feature/redis-cache', baseBranch: 'main', isDraft: false,
        isMerged: true, additions: 890, deletions: 125, changedFiles: 12, commits: 8, comments: 12,
        reviewComments: 18, createdAt: new Date('2024-01-25'), updatedAt: new Date('2024-01-28'),
        mergedAt: new Date('2024-01-28'), mergedBy: 'johnsmith', labels: ['feature', 'backend', 'performance'],
      },
    }),
    prisma.pullRequest.create({
      data: {
        repositoryId: repos.design.id, number: 23, title: 'Add dark mode support',
        body: 'Adds dark mode variants for all components', state: 'merged', authorUsername: 'emilyrodriguez',
        authorEmail: 'emily.rodriguez@techcorp.com', headBranch: 'feature/dark-mode', baseBranch: 'main', isDraft: false,
        isMerged: true, additions: 2100, deletions: 450, changedFiles: 35, commits: 15, comments: 22,
        reviewComments: 28, createdAt: new Date('2023-12-10'), updatedAt: new Date('2023-12-18'),
        mergedAt: new Date('2023-12-18'), mergedBy: 'sarahjohnson', labels: ['feature', 'ui'],
      },
    }),
    prisma.pullRequest.create({
      data: {
        repositoryId: repos.infrastructure.id, number: 12, title: 'Migrate to Kubernetes 1.28',
        body: 'Updates cluster to latest stable Kubernetes version', state: 'merged', authorUsername: 'rajpatel',
        authorEmail: 'raj.patel@techcorp.com', headBranch: 'upgrade/k8s-1.28', baseBranch: 'main', isDraft: false,
        isMerged: true, additions: 380, deletions: 220, changedFiles: 15, commits: 7, comments: 6,
        reviewComments: 10, createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-08'),
        mergedAt: new Date('2024-01-08'), mergedBy: 'johnsmith', labels: ['infrastructure', 'upgrade'],
      },
    }),
  ])

  console.log('✅ Created pull requests')

  // Create GitHub Activities
  console.log('📊 Creating GitHub activities...')

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  await Promise.all([
    prisma.gitHubActivity.create({ data: { employeeId: employees.sarah.id, repoName: 'web-app', repoFullName: 'techcorp/web-app', isPrivate: true, commits: 45, pullRequests: 12, linesAdded: 3500, linesDeleted: 1200, filesChanged: 150, languages: { TypeScript: 65, JavaScript: 20, CSS: 15 }, frameworks: ['React', 'Next.js', 'Tailwind CSS'], periodStart: lastMonth, periodEnd: thisMonth } }),
    prisma.gitHubActivity.create({ data: { employeeId: employees.mike.id, repoName: 'backend-service', repoFullName: 'techcorp/backend-service', isPrivate: true, commits: 52, pullRequests: 15, linesAdded: 4200, linesDeleted: 1500, filesChanged: 180, languages: { Python: 90, Shell: 10 }, frameworks: ['Django', 'PostgreSQL'], periodStart: lastMonth, periodEnd: thisMonth } }),
    prisma.gitHubActivity.create({ data: { employeeId: employees.emily.id, repoName: 'design-system', repoFullName: 'techcorp/design-system', isPrivate: false, commits: 38, pullRequests: 11, linesAdded: 3100, linesDeleted: 1100, filesChanged: 145, languages: { TypeScript: 50, CSS: 40, JavaScript: 10 }, frameworks: ['React', 'Tailwind CSS'], periodStart: lastMonth, periodEnd: thisMonth } }),
    prisma.gitHubActivity.create({ data: { employeeId: employees.raj.id, repoName: 'infrastructure', repoFullName: 'techcorp/infrastructure', isPrivate: true, commits: 28, pullRequests: 8, linesAdded: 2200, linesDeleted: 950, filesChanged: 85, languages: { HCL: 60, YAML: 30, Shell: 10 }, frameworks: ['Terraform', 'Kubernetes'], periodStart: lastMonth, periodEnd: thisMonth } }),
  ])

  console.log('✅ Created GitHub activities')

  // Create GitHub Integration Data
  console.log('🔌 Creating GitHub integration data...')

  const githubIntegration = await prisma.gitHubIntegration.create({
    data: {
      companyId: company.id, tokenType: 'organization', encryptedAccessToken: 'encrypted_token_123',
      encryptedRefreshToken: 'encrypted_refresh_123', scope: 'repo,read:org,read:user',
      organizationLogin: 'techcorp', isActive: true,
    },
  })

  const githubInstallation = await prisma.gitHubInstallation.create({
    data: {
      installationId: BigInt(987654321), companyId: company.id, accountLogin: 'techcorp',
      accountId: BigInt(123456), accountType: 'Organization', permissions: { contents: 'read', metadata: 'read' },
      events: ['push', 'pull_request', 'issues'], repositorySelection: 'all', isActive: true,
    },
  })

  // Create GitHub org members
  await Promise.all([
    prisma.gitHubOrganizationMember.create({ data: { companyId: company.id, githubUserId: BigInt(1000001), githubUsername: 'johnsmith', githubEmail: 'admin@techcorp.com', githubName: 'John Smith', employeeId: employees.admin.id, matchConfidence: 1.0, matchMethod: 'email', orgRole: 'admin' } }),
    prisma.gitHubOrganizationMember.create({ data: { companyId: company.id, githubUserId: BigInt(1000002), githubUsername: 'sarahjohnson', githubEmail: 'sarah.johnson@techcorp.com', githubName: 'Sarah Johnson', employeeId: employees.sarah.id, matchConfidence: 1.0, matchMethod: 'email', orgRole: 'member' } }),
    prisma.gitHubOrganizationMember.create({ data: { companyId: company.id, githubUserId: BigInt(1000003), githubUsername: 'mikechen', githubEmail: 'mike.chen@techcorp.com', githubName: 'Mike Chen', employeeId: employees.mike.id, matchConfidence: 1.0, matchMethod: 'email', orgRole: 'member' } }),
    prisma.gitHubOrganizationMember.create({ data: { companyId: company.id, githubUserId: BigInt(1000004), githubUsername: 'emilyrodriguez', githubEmail: 'emily.rodriguez@techcorp.com', githubName: 'Emily Rodriguez', employeeId: employees.emily.id, matchConfidence: 1.0, matchMethod: 'email', orgRole: 'member' } }),
  ])

  // Create GitHub connections
  await Promise.all([
    prisma.gitHubConnection.create({ data: { employeeId: employees.sarah.id, githubUserId: '1000002', githubUsername: 'sarahjohnson', encryptedAccessToken: 'encrypted_token_sarah', scope: 'repo', isActive: true, lastSync: new Date() } }),
    prisma.gitHubConnection.create({ data: { employeeId: employees.mike.id, githubUserId: '1000003', githubUsername: 'mikechen', encryptedAccessToken: 'encrypted_token_mike', scope: 'repo', isActive: true, lastSync: new Date() } }),
    prisma.gitHubConnection.create({ data: { employeeId: employees.emily.id, githubUserId: '1000004', githubUsername: 'emilyrodriguez', encryptedAccessToken: 'encrypted_token_emily', scope: 'repo', isActive: true, lastSync: new Date() } }),
  ])

  console.log('✅ Created GitHub integration data')

  // Create Slack Integration Data
  console.log('💬 Creating Slack integration data...')

  const slackIntegration = await prisma.slackIntegration.create({
    data: {
      companyId: company.id, teamId: 'T12345678', teamName: 'TechCorp Workspace', teamDomain: 'techcorp',
      encryptedAccessToken: 'encrypted_slack_token_123', botUserId: 'U9876543', scope: 'channels:read,users:read,chat:write',
      isActive: true, lastSync: new Date(),
    },
  })

  const slackWorkspace = await prisma.slackWorkspace.create({
    data: {
      integrationId: slackIntegration.id, companyId: company.id, teamId: 'T12345678',
      teamName: 'TechCorp Workspace', teamDomain: 'techcorp', teamUrl: 'https://techcorp.slack.com',
      totalMembers: 10, totalChannels: 8, totalMessages: 1250,
    },
  })

  // Create Slack channels
  const slackChannels: any = {}

  slackChannels.general = await prisma.slackChannel.create({ data: { companyId: company.id, slackChannelId: 'C111111', name: 'general', topic: 'Company-wide announcements', purpose: 'General discussion', isPrivate: false, isGeneral: true, memberCount: 10, messageCount: 450, lastActivityAt: new Date() } })
  slackChannels.engineering = await prisma.slackChannel.create({ data: { companyId: company.id, slackChannelId: 'C222222', name: 'engineering', topic: 'Engineering discussions', purpose: 'Tech talk and code reviews', isPrivate: false, memberCount: 8, messageCount: 680, lastActivityAt: new Date() } })
  slackChannels.frontend = await prisma.slackChannel.create({ data: { companyId: company.id, slackChannelId: 'C333333', name: 'frontend', topic: 'Frontend development', purpose: 'React, CSS, and UI discussions', isPrivate: false, memberCount: 5, messageCount: 320, lastActivityAt: new Date() } })
  slackChannels.backend = await prisma.slackChannel.create({ data: { companyId: company.id, slackChannelId: 'C444444', name: 'backend', topic: 'Backend development', purpose: 'API, database, and server discussions', isPrivate: false, memberCount: 4, messageCount: 280, lastActivityAt: new Date() } })

  // Create Slack users
  const slackUsers: any = {}

  slackUsers.sarah = await prisma.slackUser.create({ data: { companyId: company.id, employeeId: employees.sarah.id, slackUserId: 'U111111', slackUsername: 'sarah', realName: 'Sarah Johnson', displayName: 'Sarah', email: 'sarah.johnson@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', totalMessages: 285, matchConfidence: 1.0, matchMethod: 'email' } })
  slackUsers.mike = await prisma.slackUser.create({ data: { companyId: company.id, employeeId: employees.mike.id, slackUserId: 'U222222', slackUsername: 'mike', realName: 'Mike Chen', displayName: 'Mike', email: 'mike.chen@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', totalMessages: 312, matchConfidence: 1.0, matchMethod: 'email' } })
  slackUsers.emily = await prisma.slackUser.create({ data: { companyId: company.id, employeeId: employees.emily.id, slackUserId: 'U333333', slackUsername: 'emily', realName: 'Emily Rodriguez', displayName: 'Emily', email: 'emily.rodriguez@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', totalMessages: 268, matchConfidence: 1.0, matchMethod: 'email' } })

  // Create Slack messages
  const slackMessagesToCreate = []
  for (let i = 0; i < 20; i++) {
    const messageDate = new Date(now)
    messageDate.setDate(messageDate.getDate() - i)
    messageDate.setHours(9 + (i % 8), i * 3 % 60, 0, 0)

    slackMessagesToCreate.push(
      prisma.slackMessage.create({
        data: {
          companyId: company.id, employeeId: employees.sarah.id, slackUserId: slackUsers.sarah.id,
          channelId: slackChannels.engineering.id, messageTs: `${messageDate.getTime()}.${i}`,
          text: 'Working on the new authentication feature. Should be ready for review soon.',
          timestamp: messageDate, date: messageDate, hour: messageDate.getHours(),
          mentionCount: i % 3, reactionCount: i % 5, linkCount: i % 2,
        },
      })
    )
  }

  await Promise.all(slackMessagesToCreate.slice(0, 15))

  console.log('✅ Created Slack integration data')

  // Create Jira Integration Data
  console.log('📋 Creating Jira integration data...')

  const jiraIntegration = await prisma.jiraIntegration.create({
    data: {
      companyId: company.id, cloudId: 'ari:cloud:jira::site/12345678-1234-1234-1234-123456789012',
      siteUrl: 'https://techcorp.atlassian.net', siteName: 'TechCorp', encryptedAccessToken: 'encrypted_jira_token_123',
      accountId: 'jira-account-123', accountEmail: 'admin@techcorp.com', isActive: true, lastSync: new Date(),
    },
  })

  const jiraProjects: any = {}

  jiraProjects.web = await prisma.jiraProject.create({ data: { integrationId: jiraIntegration.id, companyId: company.id, jiraProjectId: 'proj-001', projectKey: 'WEB', name: 'Web Application', description: 'Main web application project', projectType: 'software', projectStyle: 'next-gen', leadAccountId: 'jira-john', leadDisplayName: 'John Smith', issueCount: 156, completedIssues: 89 } })
  jiraProjects.backend = await prisma.jiraProject.create({ data: { integrationId: jiraIntegration.id, companyId: company.id, jiraProjectId: 'proj-002', projectKey: 'BACK', name: 'Backend Services', description: 'Backend API development', projectType: 'software', projectStyle: 'classic', leadAccountId: 'jira-mike', leadDisplayName: 'Mike Chen', issueCount: 124, completedIssues: 78 } })
  jiraProjects.mobile = await prisma.jiraProject.create({ data: { integrationId: jiraIntegration.id, companyId: company.id, jiraProjectId: 'proj-003', projectKey: 'MOB', name: 'Mobile App', description: 'Mobile application development', projectType: 'software', projectStyle: 'next-gen', leadAccountId: 'jira-sarah', leadDisplayName: 'Sarah Johnson', issueCount: 98, completedIssues: 54 } })

  // Create Jira users
  const jiraUsers: any = {}

  jiraUsers.sarah = await prisma.jiraUser.create({ data: { companyId: company.id, employeeId: employees.sarah.id, accountId: 'jira-sarah', displayName: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', issuesCreated: 45, issuesAssigned: 52, issuesCompleted: 38, commentsPosted: 127, matchConfidence: 1.0, matchMethod: 'email' } })
  jiraUsers.mike = await prisma.jiraUser.create({ data: { companyId: company.id, employeeId: employees.mike.id, accountId: 'jira-mike', displayName: 'Mike Chen', email: 'mike.chen@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', issuesCreated: 38, issuesAssigned: 48, issuesCompleted: 35, commentsPosted: 98, matchConfidence: 1.0, matchMethod: 'email' } })
  jiraUsers.emily = await prisma.jiraUser.create({ data: { companyId: company.id, employeeId: employees.emily.id, accountId: 'jira-emily', displayName: 'Emily Rodriguez', email: 'emily.rodriguez@techcorp.com', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', issuesCreated: 32, issuesAssigned: 38, issuesCompleted: 28, commentsPosted: 85, matchConfidence: 1.0, matchMethod: 'email' } })

  // Create Jira issues
  const jiraIssues: any = {}

  jiraIssues.issue1 = await prisma.jiraIssue.create({ data: { companyId: company.id, projectId: jiraProjects.web.id, creatorId: jiraUsers.sarah.id, assigneeId: jiraUsers.sarah.id, employeeId: employees.sarah.id, jiraIssueId: 'issue-001', issueKey: 'WEB-123', summary: 'Implement user authentication', description: 'Add JWT-based authentication system', issueType: 'Story', status: 'Done', statusCategory: 'done', priority: 'High', storyPoints: 8, timeSpent: 14400, createdDate: new Date('2024-01-10'), updatedDate: new Date('2024-01-25'), resolvedDate: new Date('2024-01-25'), resolution: 'Done', resolutionDate: new Date('2024-01-25') } })
  jiraIssues.issue2 = await prisma.jiraIssue.create({ data: { companyId: company.id, projectId: jiraProjects.backend.id, creatorId: jiraUsers.mike.id, assigneeId: jiraUsers.mike.id, employeeId: employees.mike.id, jiraIssueId: 'issue-002', issueKey: 'BACK-45', summary: 'Add Redis caching layer', description: 'Implement caching for frequently accessed data', issueType: 'Task', status: 'Done', statusCategory: 'done', priority: 'Medium', storyPoints: 5, timeSpent: 10800, createdDate: new Date('2024-01-15'), updatedDate: new Date('2024-01-28'), resolvedDate: new Date('2024-01-28'), resolution: 'Done', resolutionDate: new Date('2024-01-28') } })
  jiraIssues.issue3 = await prisma.jiraIssue.create({ data: { companyId: company.id, projectId: jiraProjects.web.id, creatorId: jiraUsers.emily.id, assigneeId: jiraUsers.emily.id, employeeId: employees.emily.id, jiraIssueId: 'issue-003', issueKey: 'WEB-124', summary: 'Improve dashboard performance', description: 'Optimize rendering and add memoization', issueType: 'Task', status: 'In Progress', statusCategory: 'indeterminate', priority: 'High', storyPoints: 5, createdDate: new Date('2024-02-01'), updatedDate: new Date() } })
  jiraIssues.issue4 = await prisma.jiraIssue.create({ data: { companyId: company.id, projectId: jiraProjects.mobile.id, creatorId: jiraUsers.sarah.id, assigneeId: jiraUsers.sarah.id, employeeId: employees.sarah.id, jiraIssueId: 'issue-004', issueKey: 'MOB-23', summary: 'Fix navigation bug on iOS', description: 'Navigation stack not clearing properly', issueType: 'Bug', status: 'To Do', statusCategory: 'new', priority: 'Highest', storyPoints: 3, createdDate: new Date('2024-02-05'), updatedDate: new Date() } })

  // Create Jira comments
  await Promise.all([
    prisma.jiraComment.create({ data: { companyId: company.id, issueId: jiraIssues.issue1.id, authorId: jiraUsers.mike.id, jiraCommentId: 'comment-001', body: 'Looks good! Just a few minor suggestions on the token refresh logic.', createdDate: new Date('2024-01-20'), updatedDate: new Date('2024-01-20') } }),
    prisma.jiraComment.create({ data: { companyId: company.id, issueId: jiraIssues.issue2.id, authorId: jiraUsers.sarah.id, jiraCommentId: 'comment-002', body: 'Great work on the caching implementation!', createdDate: new Date('2024-01-27'), updatedDate: new Date('2024-01-27') } }),
    prisma.jiraComment.create({ data: { companyId: company.id, issueId: jiraIssues.issue3.id, authorId: jiraUsers.sarah.id, jiraCommentId: 'comment-003', body: 'Added memoization to the heavy components. Performance improved by 40%.', createdDate: new Date('2024-02-02'), updatedDate: new Date('2024-02-02') } }),
  ])

  // Create Jira worklogs
  await Promise.all([
    prisma.jiraWorklog.create({ data: { companyId: company.id, issueId: jiraIssues.issue1.id, authorId: jiraUsers.sarah.id, employeeId: employees.sarah.id, jiraWorklogId: 'worklog-001', comment: 'Implemented JWT authentication', timeSpentSeconds: 14400, startedDate: new Date('2024-01-15'), createdDate: new Date('2024-01-15'), updatedDate: new Date('2024-01-15') } }),
    prisma.jiraWorklog.create({ data: { companyId: company.id, issueId: jiraIssues.issue2.id, authorId: jiraUsers.mike.id, employeeId: employees.mike.id, jiraWorklogId: 'worklog-002', comment: 'Set up Redis and implemented caching', timeSpentSeconds: 10800, startedDate: new Date('2024-01-25'), createdDate: new Date('2024-01-25'), updatedDate: new Date('2024-01-25') } }),
    prisma.jiraWorklog.create({ data: { companyId: company.id, issueId: jiraIssues.issue3.id, authorId: jiraUsers.emily.id, employeeId: employees.emily.id, jiraWorklogId: 'worklog-003', comment: 'Optimizing dashboard components', timeSpentSeconds: 7200, startedDate: new Date('2024-02-02'), createdDate: new Date('2024-02-02'), updatedDate: new Date('2024-02-02') } }),
  ])

  // Create Jira issue transitions
  await Promise.all([
    prisma.jiraIssueTransition.create({ data: { companyId: company.id, issueId: jiraIssues.issue1.id, fromStatus: 'To Do', toStatus: 'In Progress', fromStatusCategory: 'new', toStatusCategory: 'indeterminate', authorAccountId: 'jira-sarah', authorDisplayName: 'Sarah Johnson', transitionDate: new Date('2024-01-12') } }),
    prisma.jiraIssueTransition.create({ data: { companyId: company.id, issueId: jiraIssues.issue1.id, fromStatus: 'In Progress', toStatus: 'Done', fromStatusCategory: 'indeterminate', toStatusCategory: 'done', authorAccountId: 'jira-sarah', authorDisplayName: 'Sarah Johnson', transitionDate: new Date('2024-01-25') } }),
    prisma.jiraIssueTransition.create({ data: { companyId: company.id, issueId: jiraIssues.issue2.id, fromStatus: 'To Do', toStatus: 'In Progress', fromStatusCategory: 'new', toStatusCategory: 'indeterminate', authorAccountId: 'jira-mike', authorDisplayName: 'Mike Chen', transitionDate: new Date('2024-01-18') } }),
    prisma.jiraIssueTransition.create({ data: { companyId: company.id, issueId: jiraIssues.issue2.id, fromStatus: 'In Progress', toStatus: 'Done', fromStatusCategory: 'indeterminate', toStatusCategory: 'done', authorAccountId: 'jira-mike', authorDisplayName: 'Mike Chen', transitionDate: new Date('2024-01-28') } }),
    prisma.jiraIssueTransition.create({ data: { companyId: company.id, issueId: jiraIssues.issue3.id, fromStatus: 'To Do', toStatus: 'In Progress', fromStatusCategory: 'new', toStatusCategory: 'indeterminate', authorAccountId: 'jira-emily', authorDisplayName: 'Emily Rodriguez', transitionDate: new Date('2024-02-01') } }),
  ])

  console.log('✅ Created Jira integration data')

  // Create Certificates
  console.log('🎓 Creating certificates...')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const certificates: any = {}

  certificates.cert1 = await prisma.certificate.create({
    data: {
      employeeId: employees.sarah.id, companyId: company.id, title: 'Full-Stack Development Excellence',
      description: 'Recognition for outstanding contributions in full-stack development', status: 'ISSUED',
      periodStart: sixMonthsAgo, periodEnd: new Date(), issueDate: new Date(),
      skillsData: { primary: ['TypeScript', 'React', 'Next.js', 'Node.js'], secondary: ['PostgreSQL', 'Docker', 'Git'] },
      achievements: ['Led development of 3 major features', 'Contributed 3,500+ lines of code', 'Mentored 2 junior developers', 'Improved application performance by 40%'],
      metrics: { commits: 125, pullRequests: 35, codeReviews: 48, projectsCompleted: 8 },
    },
  })

  certificates.cert2 = await prisma.certificate.create({
    data: {
      employeeId: employees.mike.id, companyId: company.id, title: 'Backend Architecture Specialist',
      description: 'Recognition for exceptional backend development and architecture', status: 'ISSUED',
      periodStart: sixMonthsAgo, periodEnd: new Date(), issueDate: new Date(),
      skillsData: { primary: ['Python', 'Django', 'PostgreSQL', 'Redis'], secondary: ['Docker', 'Kubernetes', 'MongoDB'] },
      achievements: ['Designed and implemented microservices architecture', 'Optimized database queries reducing load time by 60%', 'Contributed 4,200+ lines of production code', 'Implemented comprehensive testing suite'],
      metrics: { commits: 142, pullRequests: 42, codeReviews: 56, projectsCompleted: 6 },
    },
  })

  certificates.cert3 = await prisma.certificate.create({
    data: {
      employeeId: employees.emily.id, companyId: company.id, title: 'Frontend Development Excellence',
      description: 'Recognition for outstanding frontend development and UI implementation', status: 'ISSUED',
      periodStart: sixMonthsAgo, periodEnd: new Date(), issueDate: new Date(),
      skillsData: { primary: ['React', 'TypeScript', 'CSS', 'Tailwind CSS'], secondary: ['HTML', 'Vue.js', 'JavaScript'] },
      achievements: ['Built complete design system from scratch', 'Improved accessibility scores to 98+', 'Created 50+ reusable components', 'Reduced bundle size by 35%'],
      metrics: { commits: 98, pullRequests: 28, codeReviews: 35, projectsCompleted: 12 },
    },
  })

  certificates.cert4 = await prisma.certificate.create({
    data: {
      employeeId: employees.raj.id, companyId: company.id, title: 'DevOps Engineering Excellence',
      description: 'Recognition for exceptional infrastructure and DevOps work', status: 'DRAFT',
      periodStart: threeMonthsAgo, periodEnd: new Date(),
      skillsData: { primary: ['Kubernetes', 'Docker', 'AWS', 'Terraform'], secondary: ['CI/CD', 'Python'] },
      achievements: ['Migrated infrastructure to Kubernetes', 'Reduced deployment time by 70%', 'Implemented automated CI/CD pipelines', 'Maintained 99.9% uptime'],
      metrics: { commits: 85, pullRequests: 22, codeReviews: 38, projectsCompleted: 4 },
    },
  })

  console.log('✅ Created certificates')

  // Create Skill Evolution
  console.log('📈 Creating skill evolution data...')

  const skillEvolutions = []
  const javascriptSkill = skills.find(s => s.name === 'JavaScript')
  const reactSkill = skills.find(s => s.name === 'React')

  if (javascriptSkill && reactSkill) {
    // Sarah's JavaScript skill evolution over 6 months
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      skillEvolutions.push(
        prisma.skillEvolution.create({
          data: {
            employeeId: employees.sarah.id, skillId: javascriptSkill.id, date,
            level: i > 3 ? 'ADVANCED' : 'EXPERT', confidence: 0.85 + (6 - i) * 0.015,
            evidenceType: 'github', evidenceData: { commits: 50 + i * 10, linesOfCode: 5000 + i * 1000 },
            totalProjects: 20 + i, totalLines: 100000 + i * 10000,
          },
        })
      )
    }

    // Emily's React skill evolution
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      skillEvolutions.push(
        prisma.skillEvolution.create({
          data: {
            employeeId: employees.emily.id, skillId: reactSkill.id, date,
            level: i > 4 ? 'ADVANCED' : 'EXPERT', confidence: 0.88 + (6 - i) * 0.01,
            evidenceType: 'github', evidenceData: { commits: 45 + i * 8, linesOfCode: 4500 + i * 900 },
            totalProjects: 18 + i, totalLines: 90000 + i * 8000,
          },
        })
      )
    }
  }

  await Promise.all(skillEvolutions.slice(0, 14))

  console.log('✅ Created skill evolution data')

  // Create Job Queue
  console.log('⚙️ Creating job queue items...')

  await Promise.all([
    prisma.jobQueue.create({ data: { type: 'github_sync', status: 'completed', priority: 1, payload: { repositoryId: repos.webapp.id }, result: { synced: true, commits: 15 }, completedAt: new Date() } }),
    prisma.jobQueue.create({ data: { type: 'skill_analysis', status: 'completed', priority: 2, payload: { employeeId: employees.sarah.id }, result: { skillsDetected: 8 }, completedAt: new Date() } }),
    prisma.jobQueue.create({ data: { type: 'certificate_generation', status: 'processing', priority: 0, payload: { certificateId: certificates.cert4.id }, startedAt: new Date() } }),
    prisma.jobQueue.create({ data: { type: 'github_sync', status: 'pending', priority: 1, payload: { repositoryId: repos.backend.id }, scheduledFor: new Date(Date.now() + 3600000) } }),
    prisma.jobQueue.create({ data: { type: 'slack_message_sync', status: 'completed', priority: 1, payload: { channelId: slackChannels.engineering.id }, result: { messagesSynced: 25 }, completedAt: new Date() } }),
  ])

  console.log('✅ Created job queue items')

  // Create Integrations
  console.log('🔗 Creating integration records...')

  await Promise.all([
    prisma.integration.create({ data: { companyId: company.id, type: 'GITHUB', name: 'GitHub Enterprise', config: { organizationName: 'techcorp', apiUrl: 'https://api.github.com' }, isActive: true, lastSync: new Date(), syncInterval: 60 } }),
    prisma.integration.create({ data: { companyId: company.id, type: 'SLACK', name: 'Slack Workspace', config: { workspaceName: 'TechCorp', workspaceUrl: 'https://techcorp.slack.com' }, isActive: true, lastSync: new Date(), syncInterval: 30 } }),
    prisma.integration.create({ data: { companyId: company.id, type: 'JIRA', name: 'Jira Cloud', config: { siteUrl: 'https://techcorp.atlassian.net', cloudId: 'ari:cloud:jira::site/12345678' }, isActive: true, lastSync: new Date(), syncInterval: 45 } }),
  ])

  console.log('✅ Created integration records')

  // Create Invitations
  console.log('✉️ Creating invitations...')

  await Promise.all([
    prisma.invitation.create({ data: { email: 'david.lee@techcorp.com', firstName: 'David', lastName: 'Lee', role: 'DEVELOPER', title: 'Junior Developer', department: 'Engineering', companyId: company.id, invitedBy: 'admin@techcorp.com', status: 'pending', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }),
    prisma.invitation.create({ data: { email: 'lisa.wang@techcorp.com', firstName: 'Lisa', lastName: 'Wang', role: 'MARKETING', title: 'Marketing Manager', department: 'Marketing', companyId: company.id, invitedBy: 'admin@techcorp.com', status: 'pending', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }),
    prisma.invitation.create({ data: { email: 'carlos.martinez@techcorp.com', firstName: 'Carlos', lastName: 'Martinez', role: 'SALES', title: 'Sales Executive', department: 'Sales', companyId: company.id, invitedBy: 'admin@techcorp.com', status: 'expired', expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }),
  ])

  console.log('✅ Created invitations')

  // Create Audit Logs
  console.log('📝 Creating audit logs...')

  const auditLogs = []

  for (let i = 0; i < 15; i++) {
    const logDate = new Date()
    logDate.setDate(logDate.getDate() - i)

    const actions = ['employee_invited', 'certificate_issued', 'integration_connected', 'data_accessed', 'settings_updated', 'repository_synced']
    const action = actions[i % actions.length]

    auditLogs.push(
      prisma.auditLog.create({
        data: {
          companyId: company.id, action, resource: action.split('_')[0],
          actorType: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'system' : 'employee',
          actorId: employees.admin.id, actorEmail: 'admin@techcorp.com',
          ipAddress: `192.168.1.${100 + i}`, timestamp: logDate,
          metadata: { action, timestamp: logDate.toISOString() },
        },
      })
    )
  }

  await Promise.all(auditLogs)

  console.log('✅ Created audit logs')

  // Create Sessions
  console.log('🔐 Creating user sessions...')

  await Promise.all([
    prisma.session.create({ data: { userId: adminUser.id, token: 'session_token_admin_' + Date.now(), expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }),
    prisma.session.create({ data: { userId: dev1User.id, token: 'session_token_sarah_' + Date.now(), expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress: '192.168.1.101', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }),
    prisma.session.create({ data: { userId: dev2User.id, token: 'session_token_mike_' + Date.now(), expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress: '192.168.1.102', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' } }),
  ])

  console.log('✅ Created user sessions')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   • Company: ${company.name}`)
  console.log(`   • Employees: 10`)
  console.log(`   • Skills: ${skills.length}`)
  console.log(`   • Skill Records: ~100+`)
  console.log(`   • Repositories: 6`)
  console.log(`   • Commits: 50+`)
  console.log(`   • Pull Requests: 5`)
  console.log(`   • GitHub Activities: 4`)
  console.log(`   • Certificates: 4`)
  console.log(`   • Slack Channels: 4`)
  console.log(`   • Slack Messages: 15`)
  console.log(`   • Jira Projects: 3`)
  console.log(`   • Jira Issues: 4`)
  console.log(`   • Jira Comments & Worklogs: 6`)
  console.log(`   • Job Queue Items: 5`)
  console.log(`   • Audit Logs: 15`)
  console.log(`   • Sessions: 3`)
  console.log('\n🔐 Login credentials:')
  console.log('   Email: admin@techcorp.com')
  console.log('   Password: password123')
  console.log('\n   Other users:')
  console.log('   • sarah.johnson@techcorp.com')
  console.log('   • mike.chen@techcorp.com')
  console.log('   • emily.rodriguez@techcorp.com')
  console.log('   • alex.kim@techcorp.com')
  console.log('   • raj.patel@techcorp.com')
  console.log('   • jenny.wilson@techcorp.com')
  console.log('   • chris.taylor@techcorp.com')
  console.log('   • maria.garcia@techcorp.com')
  console.log('   • tom.anderson@techcorp.com')
  console.log('   All passwords: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

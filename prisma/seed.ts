import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (in order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.gitHubTokenAudit.deleteMany()
  await prisma.gitHubWebhook.deleteMany()
  await prisma.gitHubOrganizationMember.deleteMany()
  await prisma.gitHubInstallation.deleteMany()
  await prisma.gitHubIntegration.deleteMany()
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
    prisma.skill.create({
      data: {
        name: 'JavaScript',
        category: 'Programming Language',
        description: 'Dynamic programming language for web development',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'TypeScript',
        category: 'Programming Language',
        description: 'Typed superset of JavaScript',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Python',
        category: 'Programming Language',
        description: 'High-level programming language',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Java',
        category: 'Programming Language',
        description: 'Object-oriented programming language',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Go',
        category: 'Programming Language',
        description: 'Statically typed compiled language',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Rust',
        category: 'Programming Language',
        description: 'Systems programming language',
      },
    }),

    // Frameworks
    prisma.skill.create({
      data: {
        name: 'React',
        category: 'Framework',
        description: 'JavaScript library for building user interfaces',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Next.js',
        category: 'Framework',
        description: 'React framework for production',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Node.js',
        category: 'Framework',
        description: 'JavaScript runtime for server-side development',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Express',
        category: 'Framework',
        description: 'Web framework for Node.js',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Django',
        category: 'Framework',
        description: 'Python web framework',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Flask',
        category: 'Framework',
        description: 'Lightweight Python web framework',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Spring Boot',
        category: 'Framework',
        description: 'Java application framework',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Vue.js',
        category: 'Framework',
        description: 'Progressive JavaScript framework',
      },
    }),

    // Databases
    prisma.skill.create({
      data: {
        name: 'PostgreSQL',
        category: 'Database',
        description: 'Open source relational database',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'MongoDB',
        category: 'Database',
        description: 'NoSQL document database',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Redis',
        category: 'Database',
        description: 'In-memory data structure store',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'MySQL',
        category: 'Database',
        description: 'Open source relational database',
      },
    }),

    // DevOps & Tools
    prisma.skill.create({
      data: {
        name: 'Docker',
        category: 'DevOps',
        description: 'Containerization platform',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Kubernetes',
        category: 'DevOps',
        description: 'Container orchestration platform',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'AWS',
        category: 'Cloud',
        description: 'Amazon Web Services cloud platform',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Git',
        category: 'Tool',
        description: 'Version control system',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'CI/CD',
        category: 'DevOps',
        description: 'Continuous Integration/Deployment',
      },
    }),

    // Frontend
    prisma.skill.create({
      data: {
        name: 'CSS',
        category: 'Frontend',
        description: 'Cascading Style Sheets',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Tailwind CSS',
        category: 'Frontend',
        description: 'Utility-first CSS framework',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'HTML',
        category: 'Frontend',
        description: 'HyperText Markup Language',
      },
    }),

    // Testing
    prisma.skill.create({
      data: {
        name: 'Jest',
        category: 'Testing',
        description: 'JavaScript testing framework',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Pytest',
        category: 'Testing',
        description: 'Python testing framework',
      },
    }),

    // Other
    prisma.skill.create({
      data: {
        name: 'GraphQL',
        category: 'API',
        description: 'Query language for APIs',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'REST API',
        category: 'API',
        description: 'RESTful API design and development',
      },
    }),
  ])

  console.log(`✅ Created ${skills.length} skills`)

  // Create Company
  console.log('🏢 Creating company...')
  const company = await prisma.company.create({
    data: {
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      website: 'https://techcorp.com',
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

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@techcorp.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'company_admin',
      isActive: true,
      emailVerified: true,
    },
  })

  const adminEmployee = await prisma.employee.create({
    data: {
      email: 'admin@techcorp.com',
      firstName: 'John',
      lastName: 'Smith',
      companyId: company.id,
      role: 'MANAGER',
      title: 'Engineering Manager',
      department: 'Engineering',
      bio: 'Engineering leader with 10+ years of experience in building scalable systems.',
      githubUsername: 'johnsmith',
      isActive: true,
      startDate: new Date('2020-01-15'),
    },
  })

  // Developer 1
  const dev1User = await prisma.user.create({
    data: {
      email: 'sarah.johnson@techcorp.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'user',
      isActive: true,
      emailVerified: true,
    },
  })

  const dev1Employee = await prisma.employee.create({
    data: {
      email: 'sarah.johnson@techcorp.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      companyId: company.id,
      role: 'DEVELOPER',
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      bio: 'Full-stack developer specializing in React, Node.js, and cloud infrastructure.',
      githubUsername: 'sarahjohnson',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      isActive: true,
      startDate: new Date('2021-03-10'),
    },
  })

  // Developer 2
  const dev2User = await prisma.user.create({
    data: {
      email: 'mike.chen@techcorp.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'user',
      isActive: true,
      emailVerified: true,
    },
  })

  const dev2Employee = await prisma.employee.create({
    data: {
      email: 'mike.chen@techcorp.com',
      firstName: 'Mike',
      lastName: 'Chen',
      companyId: company.id,
      role: 'DEVELOPER',
      title: 'Backend Developer',
      department: 'Engineering',
      bio: 'Backend specialist with expertise in Python, Django, and microservices architecture.',
      githubUsername: 'mikechen',
      linkedinUrl: 'https://linkedin.com/in/mikechen',
      isActive: true,
      startDate: new Date('2022-06-01'),
    },
  })

  // Developer 3
  const dev3User = await prisma.user.create({
    data: {
      email: 'emily.rodriguez@techcorp.com',
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      role: 'user',
      isActive: true,
      emailVerified: true,
    },
  })

  const dev3Employee = await prisma.employee.create({
    data: {
      email: 'emily.rodriguez@techcorp.com',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      companyId: company.id,
      role: 'DEVELOPER',
      title: 'Frontend Developer',
      department: 'Engineering',
      bio: 'Frontend expert passionate about creating beautiful, accessible user experiences.',
      githubUsername: 'emilyrodriguez',
      isActive: true,
      startDate: new Date('2022-09-15'),
    },
  })

  // Designer
  const designerUser = await prisma.user.create({
    data: {
      email: 'alex.kim@techcorp.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Kim',
      role: 'user',
      isActive: true,
      emailVerified: true,
    },
  })

  const designerEmployee = await prisma.employee.create({
    data: {
      email: 'alex.kim@techcorp.com',
      firstName: 'Alex',
      lastName: 'Kim',
      companyId: company.id,
      role: 'DESIGNER',
      title: 'UI/UX Designer',
      department: 'Design',
      bio: 'UI/UX designer focused on user-centered design and design systems.',
      isActive: true,
      startDate: new Date('2021-11-01'),
    },
  })

  console.log('✅ Created 5 employees')

  // Create Skill Records for Employees
  console.log('🎯 Creating skill records...')

  // Sarah's Skills (Full-Stack)
  await Promise.all([
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'JavaScript')!.id,
        level: 'EXPERT',
        confidence: 0.95,
        linesOfCode: 150000,
        projectsUsed: 25,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'TypeScript')!.id,
        level: 'EXPERT',
        confidence: 0.92,
        linesOfCode: 120000,
        projectsUsed: 20,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'React')!.id,
        level: 'EXPERT',
        confidence: 0.94,
        linesOfCode: 80000,
        projectsUsed: 18,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'Next.js')!.id,
        level: 'ADVANCED',
        confidence: 0.88,
        linesOfCode: 45000,
        projectsUsed: 12,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'Node.js')!.id,
        level: 'ADVANCED',
        confidence: 0.89,
        linesOfCode: 60000,
        projectsUsed: 15,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'PostgreSQL')!.id,
        level: 'ADVANCED',
        confidence: 0.85,
        projectsUsed: 10,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev1Employee.id,
        skillId: skills.find((s) => s.name === 'Docker')!.id,
        level: 'INTERMEDIATE',
        confidence: 0.78,
        projectsUsed: 8,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
  ])

  // Mike's Skills (Backend)
  await Promise.all([
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Python')!.id,
        level: 'EXPERT',
        confidence: 0.96,
        linesOfCode: 180000,
        projectsUsed: 30,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Django')!.id,
        level: 'EXPERT',
        confidence: 0.93,
        linesOfCode: 95000,
        projectsUsed: 15,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Flask')!.id,
        level: 'ADVANCED',
        confidence: 0.87,
        linesOfCode: 40000,
        projectsUsed: 8,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'PostgreSQL')!.id,
        level: 'EXPERT',
        confidence: 0.91,
        projectsUsed: 20,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'MongoDB')!.id,
        level: 'ADVANCED',
        confidence: 0.84,
        projectsUsed: 12,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Redis')!.id,
        level: 'ADVANCED',
        confidence: 0.82,
        projectsUsed: 10,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Docker')!.id,
        level: 'ADVANCED',
        confidence: 0.86,
        projectsUsed: 15,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev2Employee.id,
        skillId: skills.find((s) => s.name === 'Kubernetes')!.id,
        level: 'INTERMEDIATE',
        confidence: 0.75,
        projectsUsed: 5,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
  ])

  // Emily's Skills (Frontend)
  await Promise.all([
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'JavaScript')!.id,
        level: 'ADVANCED',
        confidence: 0.89,
        linesOfCode: 95000,
        projectsUsed: 20,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'TypeScript')!.id,
        level: 'ADVANCED',
        confidence: 0.86,
        linesOfCode: 70000,
        projectsUsed: 15,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'React')!.id,
        level: 'EXPERT',
        confidence: 0.93,
        linesOfCode: 105000,
        projectsUsed: 22,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'Vue.js')!.id,
        level: 'INTERMEDIATE',
        confidence: 0.76,
        linesOfCode: 30000,
        projectsUsed: 6,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'CSS')!.id,
        level: 'EXPERT',
        confidence: 0.92,
        linesOfCode: 85000,
        projectsUsed: 25,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'Tailwind CSS')!.id,
        level: 'ADVANCED',
        confidence: 0.88,
        linesOfCode: 40000,
        projectsUsed: 12,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: dev3Employee.id,
        skillId: skills.find((s) => s.name === 'HTML')!.id,
        level: 'EXPERT',
        confidence: 0.95,
        linesOfCode: 120000,
        projectsUsed: 30,
        lastUsed: new Date(),
        isAutoDetected: true,
        source: 'github',
      },
    }),
  ])

  // John's Skills (Manager with technical background)
  await Promise.all([
    prisma.skillRecord.create({
      data: {
        employeeId: adminEmployee.id,
        skillId: skills.find((s) => s.name === 'JavaScript')!.id,
        level: 'ADVANCED',
        confidence: 0.85,
        linesOfCode: 80000,
        projectsUsed: 15,
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: adminEmployee.id,
        skillId: skills.find((s) => s.name === 'Python')!.id,
        level: 'ADVANCED',
        confidence: 0.83,
        linesOfCode: 75000,
        projectsUsed: 12,
        lastUsed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        isAutoDetected: true,
        source: 'github',
      },
    }),
    prisma.skillRecord.create({
      data: {
        employeeId: adminEmployee.id,
        skillId: skills.find((s) => s.name === 'Docker')!.id,
        level: 'ADVANCED',
        confidence: 0.87,
        projectsUsed: 18,
        lastUsed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        isAutoDetected: true,
        source: 'github',
      },
    }),
  ])

  console.log('✅ Created skill records')

  // Create GitHub Activities
  console.log('📊 Creating GitHub activities...')

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  await Promise.all([
    // Sarah's activities
    prisma.gitHubActivity.create({
      data: {
        employeeId: dev1Employee.id,
        repoName: 'web-app',
        repoFullName: 'techcorp/web-app',
        isPrivate: true,
        commits: 45,
        pullRequests: 12,
        linesAdded: 3500,
        linesDeleted: 1200,
        filesChanged: 150,
        languages: { TypeScript: 65, JavaScript: 20, CSS: 15 },
        frameworks: ['React', 'Next.js', 'Tailwind CSS'],
        periodStart: lastMonth,
        periodEnd: thisMonth,
      },
    }),
    prisma.gitHubActivity.create({
      data: {
        employeeId: dev1Employee.id,
        repoName: 'api-service',
        repoFullName: 'techcorp/api-service',
        isPrivate: true,
        commits: 28,
        pullRequests: 8,
        linesAdded: 2200,
        linesDeleted: 800,
        filesChanged: 85,
        languages: { TypeScript: 80, JavaScript: 20 },
        frameworks: ['Node.js', 'Express'],
        periodStart: lastMonth,
        periodEnd: thisMonth,
      },
    }),

    // Mike's activities
    prisma.gitHubActivity.create({
      data: {
        employeeId: dev2Employee.id,
        repoName: 'backend-service',
        repoFullName: 'techcorp/backend-service',
        isPrivate: true,
        commits: 52,
        pullRequests: 15,
        linesAdded: 4200,
        linesDeleted: 1500,
        filesChanged: 180,
        languages: { Python: 90, Shell: 10 },
        frameworks: ['Django', 'PostgreSQL'],
        periodStart: lastMonth,
        periodEnd: thisMonth,
      },
    }),
    prisma.gitHubActivity.create({
      data: {
        employeeId: dev2Employee.id,
        repoName: 'data-pipeline',
        repoFullName: 'techcorp/data-pipeline',
        isPrivate: true,
        commits: 35,
        pullRequests: 10,
        linesAdded: 2800,
        linesDeleted: 950,
        filesChanged: 120,
        languages: { Python: 85, YAML: 15 },
        frameworks: ['Flask', 'Redis'],
        periodStart: lastMonth,
        periodEnd: thisMonth,
      },
    }),

    // Emily's activities
    prisma.gitHubActivity.create({
      data: {
        employeeId: dev3Employee.id,
        repoName: 'design-system',
        repoFullName: 'techcorp/design-system',
        isPrivate: false,
        commits: 38,
        pullRequests: 11,
        linesAdded: 3100,
        linesDeleted: 1100,
        filesChanged: 145,
        languages: { TypeScript: 50, CSS: 40, JavaScript: 10 },
        frameworks: ['React', 'Tailwind CSS'],
        periodStart: lastMonth,
        periodEnd: thisMonth,
      },
    }),
  ])

  console.log('✅ Created GitHub activities')

  // Create Repositories
  console.log('📁 Creating repositories...')

  const webAppRepo = await prisma.repository.create({
    data: {
      companyId: company.id,
      githubRepoId: '12345001',
      name: 'web-app',
      fullName: 'techcorp/web-app',
      isPrivate: true,
      isFork: false,
      description: 'Main web application built with Next.js',
      defaultBranch: 'main',
      stars: 24,
      forks: 3,
      watchers: 18,
      size: 15420,
      openIssues: 12,
      primaryLanguage: 'TypeScript',
      languages: { TypeScript: 65, JavaScript: 20, CSS: 15 },
      frameworks: ['React', 'Next.js', 'Tailwind CSS'],
      totalCommits: 342,
      lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-01-15'),
      pushedAt: new Date(),
    },
  })

  const backendRepo = await prisma.repository.create({
    data: {
      companyId: company.id,
      githubRepoId: '12345002',
      name: 'backend-service',
      fullName: 'techcorp/backend-service',
      isPrivate: true,
      isFork: false,
      description: 'Django-based backend service',
      defaultBranch: 'main',
      stars: 18,
      forks: 2,
      watchers: 12,
      size: 22340,
      openIssues: 8,
      primaryLanguage: 'Python',
      languages: { Python: 90, Shell: 10 },
      frameworks: ['Django', 'PostgreSQL'],
      totalCommits: 458,
      lastActivityAt: new Date(),
      githubCreatedAt: new Date('2022-08-20'),
      pushedAt: new Date(),
    },
  })

  const designRepo = await prisma.repository.create({
    data: {
      companyId: company.id,
      githubRepoId: '12345003',
      name: 'design-system',
      fullName: 'techcorp/design-system',
      isPrivate: false,
      isFork: false,
      description: 'Company design system and component library',
      defaultBranch: 'main',
      stars: 156,
      forks: 24,
      watchers: 89,
      size: 8940,
      openIssues: 15,
      primaryLanguage: 'TypeScript',
      languages: { TypeScript: 50, CSS: 40, JavaScript: 10 },
      frameworks: ['React', 'Tailwind CSS'],
      totalCommits: 287,
      lastActivityAt: new Date(),
      githubCreatedAt: new Date('2023-03-10'),
      pushedAt: new Date(),
    },
  })

  console.log('✅ Created repositories')

  // Create Employee Repository Relationships
  console.log('🔗 Creating employee-repository relationships...')

  await Promise.all([
    // Sarah's repositories
    prisma.employeeRepository.create({
      data: {
        employeeId: dev1Employee.id,
        repositoryId: webAppRepo.id,
        commitCount: 342,
        linesAdded: 45000,
        linesDeleted: 15000,
        pullRequests: 85,
        firstCommitAt: new Date('2023-01-20'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
        isOwner: true,
      },
    }),
    prisma.employeeRepository.create({
      data: {
        employeeId: dev1Employee.id,
        repositoryId: backendRepo.id,
        commitCount: 56,
        linesAdded: 8500,
        linesDeleted: 2200,
        pullRequests: 18,
        firstCommitAt: new Date('2023-05-10'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
      },
    }),
    // Mike's repositories
    prisma.employeeRepository.create({
      data: {
        employeeId: dev2Employee.id,
        repositoryId: backendRepo.id,
        commitCount: 458,
        linesAdded: 68000,
        linesDeleted: 22000,
        pullRequests: 125,
        firstCommitAt: new Date('2022-08-25'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
        isOwner: true,
      },
    }),
    prisma.employeeRepository.create({
      data: {
        employeeId: dev2Employee.id,
        repositoryId: webAppRepo.id,
        commitCount: 42,
        linesAdded: 5200,
        linesDeleted: 1800,
        pullRequests: 12,
        firstCommitAt: new Date('2023-06-15'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
      },
    }),
    // Emily's repositories
    prisma.employeeRepository.create({
      data: {
        employeeId: dev3Employee.id,
        repositoryId: designRepo.id,
        commitCount: 287,
        linesAdded: 52000,
        linesDeleted: 18000,
        pullRequests: 95,
        firstCommitAt: new Date('2023-03-15'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
        isOwner: true,
      },
    }),
    prisma.employeeRepository.create({
      data: {
        employeeId: dev3Employee.id,
        repositoryId: webAppRepo.id,
        commitCount: 124,
        linesAdded: 18500,
        linesDeleted: 6200,
        pullRequests: 42,
        firstCommitAt: new Date('2023-02-10'),
        lastCommitAt: new Date(),
        lastActivityAt: new Date(),
      },
    }),
  ])

  console.log('✅ Created employee-repository relationships')

  // Create Certificates
  console.log('🎓 Creating certificates...')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  await Promise.all([
    prisma.certificate.create({
      data: {
        employeeId: dev1Employee.id,
        companyId: company.id,
        title: 'Full-Stack Development Excellence',
        description: 'Recognition for outstanding contributions in full-stack development',
        status: 'ISSUED',
        periodStart: sixMonthsAgo,
        periodEnd: new Date(),
        issueDate: new Date(),
        skillsData: {
          primary: ['TypeScript', 'React', 'Next.js', 'Node.js'],
          secondary: ['PostgreSQL', 'Docker', 'Git'],
        },
        achievements: [
          'Led development of 3 major features',
          'Contributed 3,500+ lines of code',
          'Mentored 2 junior developers',
          'Improved application performance by 40%',
        ],
        metrics: {
          commits: 125,
          pullRequests: 35,
          codeReviews: 48,
          projectsCompleted: 8,
        },
      },
    }),
    prisma.certificate.create({
      data: {
        employeeId: dev2Employee.id,
        companyId: company.id,
        title: 'Backend Architecture Specialist',
        description: 'Recognition for exceptional backend development and architecture',
        status: 'ISSUED',
        periodStart: sixMonthsAgo,
        periodEnd: new Date(),
        issueDate: new Date(),
        skillsData: {
          primary: ['Python', 'Django', 'PostgreSQL', 'Redis'],
          secondary: ['Docker', 'Kubernetes', 'MongoDB'],
        },
        achievements: [
          'Designed and implemented microservices architecture',
          'Optimized database queries reducing load time by 60%',
          'Contributed 4,200+ lines of production code',
          'Implemented comprehensive testing suite',
        ],
        metrics: {
          commits: 142,
          pullRequests: 42,
          codeReviews: 56,
          projectsCompleted: 6,
        },
      },
    }),
    prisma.certificate.create({
      data: {
        employeeId: dev3Employee.id,
        companyId: company.id,
        title: 'Frontend Development Excellence',
        description: 'Recognition for outstanding frontend development and UI implementation',
        status: 'ISSUED',
        periodStart: sixMonthsAgo,
        periodEnd: new Date(),
        issueDate: new Date(),
        skillsData: {
          primary: ['React', 'TypeScript', 'CSS', 'Tailwind CSS'],
          secondary: ['HTML', 'Vue.js', 'JavaScript'],
        },
        achievements: [
          'Built complete design system from scratch',
          'Improved accessibility scores to 98+',
          'Created 50+ reusable components',
          'Reduced bundle size by 35%',
        ],
        metrics: {
          commits: 98,
          pullRequests: 28,
          codeReviews: 35,
          projectsCompleted: 12,
        },
      },
    }),
  ])

  console.log('✅ Created certificates')

  // Create some pending invitations
  console.log('✉️ Creating invitations...')

  await Promise.all([
    prisma.invitation.create({
      data: {
        email: 'david.lee@techcorp.com',
        firstName: 'David',
        lastName: 'Lee',
        role: 'DEVELOPER',
        title: 'Junior Developer',
        department: 'Engineering',
        companyId: company.id,
        invitedBy: 'admin@techcorp.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invitation.create({
      data: {
        email: 'lisa.wang@techcorp.com',
        firstName: 'Lisa',
        lastName: 'Wang',
        role: 'MARKETING',
        title: 'Marketing Manager',
        department: 'Marketing',
        companyId: company.id,
        invitedBy: 'admin@techcorp.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log('✅ Created invitations')

  // Create Audit Logs
  console.log('📝 Creating audit logs...')

  await Promise.all([
    prisma.auditLog.create({
      data: {
        companyId: company.id,
        action: 'employee_invited',
        resource: 'invitation',
        actorType: 'admin',
        actorId: adminEmployee.id,
        actorEmail: 'admin@techcorp.com',
        ipAddress: '192.168.1.1',
        metadata: {
          invitedEmail: 'david.lee@techcorp.com',
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        companyId: company.id,
        action: 'certificate_issued',
        resource: 'certificate',
        actorType: 'system',
        metadata: {
          employeeId: dev1Employee.id,
          certificateTitle: 'Full-Stack Development Excellence',
        },
      },
    }),
  ])

  console.log('✅ Created audit logs')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   • Company: ${company.name}`)
  console.log(`   • Employees: 5`)
  console.log(`   • Skills: ${skills.length}`)
  console.log(`   • Certificates: 3`)
  console.log(`   • Repositories: 3`)
  console.log(`   • Employee-Repository relationships: 6`)
  console.log('\n🔐 Login credentials:')
  console.log('   Email: admin@techcorp.com')
  console.log('   Password: password123')
  console.log('\n   Other users:')
  console.log('   • sarah.johnson@techcorp.com')
  console.log('   • mike.chen@techcorp.com')
  console.log('   • emily.rodriguez@techcorp.com')
  console.log('   • alex.kim@techcorp.com')
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

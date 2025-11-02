import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App Configuration
  APP_NAME: z.string().default('WorkLedger'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),

  // Encryption
  ENCRYPTION_SECRET: z.string().min(32),

  // GitHub OAuth (for individual employees) - optional for build, but required for GitHub features
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),

  // GitHub App (for organization access) - optional for build, but required for GitHub features
  GITHUB_APP_ID: z.string().optional().default(''),
  GITHUB_PRIVATE_KEY: z.string().optional().default(''),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // GitLab Integration (optional)
  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional(),
  GITLAB_REDIRECT_URI: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

  // Legacy SMTP (deprecated, kept for backwards compatibility)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // File Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
})

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment configuration')
  }
}

export const env = parseEnv()

// Application Configuration
export const appConfig = {
  name: env.APP_NAME,
  url: env.APP_URL,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const

// Skill Detection Configuration
export const skillConfig = {
  detection: {
    // Confidence algorithm weights
    weights: {
      frequency: 0.25,
      recency: 0.20,
      complexity: 0.20,
      duration: 0.15,
      depth: 0.20,
    },

    // Skill level thresholds
    levels: {
      EXPERT: { confidence: 0.8, projects: 10, lines: 10000 },
      ADVANCED: { confidence: 0.6, projects: 5, lines: 5000 },
      INTERMEDIATE: { confidence: 0.4, projects: 2, lines: 1000 },
      BEGINNER: { confidence: 0.0, projects: 1, lines: 100 },
    },

    // Repository complexity scoring
    complexity: {
      size: {
        large: 10000,
        medium: 1000,
        small: 100,
      },
      stars: {
        popular: 100,
        notable: 10,
      },
      engagement: {
        forks: 10,
        watchers: 10,
      },
    },

    // Recency scoring (days)
    recency: {
      veryRecent: 30,
      recent: 90,
      moderate: 180,
      old: 365,
      veryOld: 730,
    },

    // Normalization maximums
    normalization: {
      frequency: 10000,
      duration: 10,
      depth: 10000,
    },
  },

  // Best practices detection
  practices: {
    testing: {
      patterns: ['test', 'spec', '__tests__', 'tests'],
      confidence: 0.7,
    },
    documentation: {
      minRepoSize: 1000,
      confidence: 0.6,
    },
    cicd: {
      patterns: ['.github', '.gitlab', 'jenkinsfile', '.circleci'],
      confidence: 0.65,
    },
  },
} as const

// GitHub Integration Configuration
export const githubConfig = {
  // GitHub App configuration (for organizations)
  app: {
    id: env.GITHUB_APP_ID || '',
    // Replace literal \n with actual newlines in private key
    privateKey: (env.GITHUB_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    // Note: OAuth uses GITHUB_CLIENT_ID, App uses app-specific client ID from GitHub
    clientId: env.GITHUB_CLIENT_ID || '', // Using OAuth client for now
    clientSecret: env.GITHUB_CLIENT_SECRET || '',
    webhookSecret: env.GITHUB_WEBHOOK_SECRET,
    appName: process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'workledger-skills',
  },

  // OAuth configuration (for individual employees - optional feature)
  oauth: {
    clientId: env.GITHUB_CLIENT_ID || '',
    clientSecret: env.GITHUB_CLIENT_SECRET || '',
    scope: 'repo user:email read:org',
    redirectPath: '/api/github/callback',
  },

  api: {
    baseUrl: 'https://api.github.com',
    oauthUrl: 'https://github.com/login/oauth',
    perPage: 100,
    maxReposQuickSync: 30,
    maxCommitsPerRepo: 100,
    syncPeriodMonths: 6,
  },

  rateLimit: {
    // GitHub App gets higher rate limits
    appRequestsPerHour: 15000,
    oauthRequestsPerHour: 5000,
    searchRequestsPerHour: 30,
  },

  // Token management
  tokens: {
    // App installation tokens expire after 1 hour
    appTokenTtl: 60 * 60 * 1000, // 1 hour in ms
    // OAuth tokens can be long-lived or have refresh tokens
    oauthTokenTtl: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
    // Refresh tokens before they expire
    refreshThreshold: 5 * 60 * 1000, // 5 minutes in ms
  },
} as const

// GitLab Integration Configuration
export const gitlabConfig = {
  oauth: {
    clientId: process.env.GITLAB_CLIENT_ID || '',
    clientSecret: process.env.GITLAB_CLIENT_SECRET || '',
    scope: 'read_user read_api read_repository',
    redirectPath: '/api/gitlab/callback',
  },

  api: {
    baseUrl: 'https://gitlab.com/api/v4',
    oauthUrl: 'https://gitlab.com/oauth',
    perPage: 100,
    maxReposQuickSync: 30,
    maxCommitsPerRepo: 100,
    syncPeriodMonths: 6,
  },

  rateLimit: {
    requestsPerMinute: 600,
    burstLimit: 1000,
  },

  tokens: {
    // OAuth access tokens from GitLab don't expire by default
    // But refresh tokens can be used for security
    oauthTokenTtl: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
    refreshThreshold: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  },
} as const

// Certificate Configuration
export const certificateConfig = {
  generation: {
    maxSkillsDisplay: 10,
    qrCode: {
      width: 150,
      margin: 1,
    },
    template: {
      borderColor: '#2563eb',
      primaryColor: '#2563eb',
      secondaryColor: '#666',
    },
  },

  verification: {
    baseUrl: `${env.APP_URL}/verify`,
    publicKeyId: 'workledger-public-key',
  },

  expiry: {
    defaultDays: 365,
    maxDays: 1095, // 3 years
  },
} as const

// Pagination Configuration
export const paginationConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,

  // Specific entity limits
  employees: { default: 20, max: 50 },
  repositories: { default: 10, max: 30 },
  skills: { default: 25, max: 100 },
  certificates: { default: 10, max: 25 },
  activities: { default: 15, max: 50 },
} as const

// UI Configuration
export const uiConfig = {
  timeouts: {
    toast: 5000,
    redirect: 2000,
    sync: 1000,
  },

  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },

  colors: {
    skill: {
      EXPERT: 'bg-green-100 text-green-800',
      ADVANCED: 'bg-blue-100 text-blue-800',
      INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
      BEGINNER: 'bg-gray-100 text-gray-800',
    },
    role: {
      DEVELOPER: 'bg-blue-100 text-blue-800',
      DESIGNER: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-green-100 text-green-800',
      SALES: 'bg-orange-100 text-orange-800',
      MARKETING: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800',
    },
  },
} as const

// Security Configuration
export const securityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    saltLength: 32,
    tagLength: 16,
    ivLength: 16,
    iterations: 100000,
  },

  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },

  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false,
  },
} as const

// Email Configuration
export const emailConfig = {
  from: env.RESEND_FROM_EMAIL || env.EMAIL_FROM || `${env.APP_NAME} <noreply@${new URL(env.APP_URL).hostname}>`,

  templates: {
    invitation: {
      subject: `You've been invited to join {companyName} on ${env.APP_NAME}`,
      expiryDays: 7,
    },
    certificateIssued: {
      subject: 'Your new skill certificate is ready',
    },
    welcome: {
      subject: `Welcome to ${env.APP_NAME}`,
    },
  },

  limits: {
    maxRecipientsPerEmail: 50,
    maxEmailsPerHour: 100,
  },
} as const

// Database Configuration
export const dbConfig = {
  connection: {
    maxConnections: 10,
    connectionTimeoutMs: 30000,
    queryTimeoutMs: 60000,
  },

  pagination: {
    defaultTake: 25,
    maxTake: 100,
  },

  cleanup: {
    expiredInvitations: 30, // days
    oldAuditLogs: 365, // days
    expiredSessions: 7, // days
  },
} as const

// Feature Flags
export const featureFlags = {
  githubIntegration: true,
  certificateGeneration: true,
  publicProfiles: true,
  skillEvolution: true,
  auditLogging: true,
  emailNotifications: !!(env.RESEND_API_KEY || env.SMTP_HOST), // Support both Resend and SMTP
  bulkImport: true,
  webhooks: false, // Not implemented yet
  mobileApp: false, // Future feature
  apiKeys: false, // Future feature
  sso: false, // Future feature
} as const

// Export all configurations
export const config = {
  app: appConfig,
  env,
  skill: skillConfig,
  github: githubConfig,
  gitlab: gitlabConfig,
  certificate: certificateConfig,
  pagination: paginationConfig,
  ui: uiConfig,
  security: securityConfig,
  email: emailConfig,
  db: dbConfig,
  features: featureFlags,
} as const

// Type exports
export type Config = typeof config
export type SkillLevel = keyof typeof skillConfig.detection.levels
export type UserRole = keyof typeof uiConfig.colors.role
export type Environment = typeof env
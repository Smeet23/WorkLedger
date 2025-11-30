import { z } from 'zod'
import { EmployeeRole, SkillLevel, CertificateStatus, ProjectStatus } from '@prisma/client'

// Common validation patterns
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim()

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim()

const companyNameSchema = z
  .string()
  .min(1, 'Company name is required')
  .max(100, 'Company name must not exceed 100 characters')
  .trim()

const domainSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
    'Please enter a valid domain name'
  )
  .toLowerCase()
  .trim()

const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .trim()

const phoneSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
  .optional()

// UUID validation
const uuidSchema = z
  .string()
  .uuid('Invalid identifier format')

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce.number().int().min(1).max(100, 'Page size must be between 1 and 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long').trim(),
  filters: z.record(z.string()).optional(),
})

// Authentication schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  companyName: companyNameSchema,
  companyDomain: domainSchema,
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Company schemas
export const companySchema = z.object({
  name: companyNameSchema,
  domain: domainSchema,
  logoUrl: urlSchema.optional(),
  website: urlSchema.optional(),
  industry: z.string().max(100, 'Industry must not exceed 100 characters').optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
})

export const companySettingsSchema = z.object({
  shareSkills: z.boolean().default(true),
  shareAchievements: z.boolean().default(true),
  shareProjectTypes: z.boolean().default(true),
  shareTraining: z.boolean().default(true),
  shareTenure: z.boolean().default(true),
  certificateTemplate: z.string().optional(),
  companyBranding: z.boolean().default(false),
  autoIssueEnabled: z.boolean().default(false),
  minTrackingDays: z.number().int().min(1).max(365).default(30),
})

// Employee schemas
export const employeeSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.nativeEnum(EmployeeRole),
  title: z.string().max(100, 'Title must not exceed 100 characters').optional(),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  linkedinUrl: urlSchema.optional(),
  personalWebsite: urlSchema.optional(),
  startDate: z.coerce.date().optional(),
})

export const updateEmployeeSchema = employeeSchema.partial().omit({ email: true })

export const inviteEmployeeSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.nativeEnum(EmployeeRole),
  title: z.string().max(100, 'Title must not exceed 100 characters').optional(),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  sendEmail: z.boolean().default(true),
})

export const bulkInviteSchema = z.object({
  employees: z.array(inviteEmployeeSchema).min(1, 'At least one employee is required').max(50, 'Maximum 50 employees per bulk invite'),
  sendEmails: z.boolean().default(true),
})

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Skill schemas
export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100, 'Skill name must not exceed 100 characters').trim(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must not exceed 100 characters').trim(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
})

export const skillRecordSchema = z.object({
  skillId: uuidSchema,
  level: z.nativeEnum(SkillLevel),
  confidence: z.number().min(0).max(1).optional(),
  linesOfCode: z.number().int().min(0).optional(),
  projectsUsed: z.number().int().min(0).optional(),
  lastUsed: z.coerce.date().optional(),
  source: z.string().max(50).optional(),
})

export const updateSkillRecordSchema = skillRecordSchema.partial().omit({ skillId: true })

// Certificate schemas
export const generateCertificateSchema = z.object({
  employeeId: uuidSchema,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  title: z.string().max(200, 'Title must not exceed 200 characters').optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
}).refine(data => data.periodEnd > data.periodStart, {
  message: 'End date must be after start date',
  path: ['periodEnd'],
})

export const certificateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  status: z.nativeEnum(CertificateStatus).default('DRAFT'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
}).refine(data => data.periodEnd > data.periodStart, {
  message: 'End date must be after start date',
  path: ['periodEnd'],
})

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name must not exceed 200 characters').trim(),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
  status: z.nativeEnum(ProjectStatus).default('PLANNING'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  budget: z.coerce.number().positive('Budget must be a positive number').optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  techStackIds: z.array(z.string()).min(1, 'At least one technology is required'),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate
  }
  return true
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name must not exceed 200 characters').trim().optional(),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().positive('Budget must be a positive number').optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().nullable(),
  techStackIds: z.array(z.string()).min(1, 'At least one technology is required').optional(),
})

export const projectTechStackSchema = z.object({
  skillId: z.string().min(1, 'Skill ID is required'),
  isRequired: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(1),
})

export const addProjectMemberSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  role: z.string().max(100, 'Role must not exceed 100 characters').optional(),
  isLead: z.boolean().default(false),
})

export const updateProjectMemberSchema = z.object({
  role: z.string().max(100, 'Role must not exceed 100 characters').optional().nullable(),
  isLead: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const teamRecommendationSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  teamSize: z.number().int().min(1, 'Team size must be at least 1').max(50, 'Team size must not exceed 50').default(5),
  includePartialMatches: z.boolean().default(true),
})

// GitHub integration schemas
export const githubOAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
})

export const githubSyncSchema = z.object({
  fullSync: z.boolean().default(false),
  repositories: z.array(z.string()).optional(),
})

// Certificate generation request schema
export const generateCertificateRequestSchema = z.object({
  periodMonths: z.coerce.number().int().min(1, 'Period must be at least 1 month').max(24, 'Period must not exceed 24 months').default(3),
  title: z.string().max(200, 'Title must not exceed 200 characters').optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
})

// Employee profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must not exceed 50 characters').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must not exceed 50 characters').trim().optional(),
  title: z.string().max(100, 'Title must not exceed 100 characters').optional().nullable(),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional().nullable(),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional().nullable(),
  linkedinUrl: z.string().url('Please enter a valid LinkedIn URL').optional().nullable().or(z.literal('')),
  personalWebsite: z.string().url('Please enter a valid URL').optional().nullable().or(z.literal('')),
})

// OAuth state validation schemas
export const slackOAuthStateSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  userId: z.string().min(1, 'User ID is required'),
  timestamp: z.number().int().positive('Invalid timestamp'),
})

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().int().positive().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
}).refine(data => data.file.size <= data.maxSize, {
  message: `File size must not exceed ${Math.round(10)} MB`,
  path: ['file'],
}).refine(data => data.allowedTypes.includes(data.file.type), {
  message: 'File type not allowed',
  path: ['file'],
})

export const csvUploadSchema = z.object({
  file: z.instanceof(File),
}).refine(data => data.file.type === 'text/csv' || data.file.name.endsWith('.csv'), {
  message: 'File must be a CSV file',
  path: ['file'],
})

// API schemas
export const apiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100, 'Name must not exceed 100 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.coerce.date().optional(),
})

// Query parameter schemas
export const idParamSchema = z.object({
  id: uuidSchema,
})

export const tokenParamSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

// Webhook schemas
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event type is required'),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  active: z.boolean().default(true),
})

// Configuration schemas
export const configSchema = z.object({
  github: z.object({
    clientId: z.string().min(1, 'GitHub client ID is required'),
    clientSecret: z.string().min(1, 'GitHub client secret is required'),
  }),
  email: z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().int().min(1).max(65535),
    user: z.string().min(1, 'SMTP user is required'),
    password: z.string().min(1, 'SMTP password is required'),
    from: emailSchema,
  }).optional(),
  database: z.object({
    url: z.string().min(1, 'Database URL is required'),
  }),
})

// Export all schema types
export type SignUpData = z.infer<typeof signUpSchema>
export type SignInData = z.infer<typeof signInSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type CompanyData = z.infer<typeof companySchema>
export type CompanySettingsData = z.infer<typeof companySettingsSchema>
export type EmployeeData = z.infer<typeof employeeSchema>
export type UpdateEmployeeData = z.infer<typeof updateEmployeeSchema>
export type InviteEmployeeData = z.infer<typeof inviteEmployeeSchema>
export type BulkInviteData = z.infer<typeof bulkInviteSchema>
export type AcceptInvitationData = z.infer<typeof acceptInvitationSchema>
export type SkillData = z.infer<typeof skillSchema>
export type SkillRecordData = z.infer<typeof skillRecordSchema>
export type UpdateSkillRecordData = z.infer<typeof updateSkillRecordSchema>
export type GenerateCertificateData = z.infer<typeof generateCertificateSchema>
export type CertificateData = z.infer<typeof certificateSchema>
export type GitHubOAuthData = z.infer<typeof githubOAuthSchema>
export type GitHubSyncData = z.infer<typeof githubSyncSchema>
export type GenerateCertificateRequestData = z.infer<typeof generateCertificateRequestSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type SlackOAuthStateData = z.infer<typeof slackOAuthStateSchema>
export type FileUploadData = z.infer<typeof fileUploadSchema>
export type CSVUploadData = z.infer<typeof csvUploadSchema>
export type ApiKeyData = z.infer<typeof apiKeySchema>
export type IdParam = z.infer<typeof idParamSchema>
export type TokenParam = z.infer<typeof tokenParamSchema>
export type DateRangeData = z.infer<typeof dateRangeSchema>
export type WebhookData = z.infer<typeof webhookSchema>
export type PaginationData = z.infer<typeof paginationSchema>
export type SearchData = z.infer<typeof searchSchema>
export type CreateProjectData = z.infer<typeof createProjectSchema>
export type UpdateProjectData = z.infer<typeof updateProjectSchema>
export type ProjectTechStackData = z.infer<typeof projectTechStackSchema>
export type AddProjectMemberData = z.infer<typeof addProjectMemberSchema>
export type UpdateProjectMemberData = z.infer<typeof updateProjectMemberSchema>
export type TeamRecommendationData = z.infer<typeof teamRecommendationSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  try {
    passwordSchema.parse(password)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message),
      }
    }
    return { isValid: false, errors: ['Invalid password'] }
  }
}

export function validateDomain(domain: string): boolean {
  try {
    domainSchema.parse(domain)
    return true
  } catch {
    return false
  }
}

export function validateUUID(id: string): boolean {
  try {
    uuidSchema.parse(id)
    return true
  } catch {
    return false
  }
}

// Custom validation error messages
export const errorMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  password: {
    minLength: 'Password must be at least 8 characters long',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
  },
  name: {
    required: 'Name is required',
    invalid: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    tooLong: (max: number) => `Name must not exceed ${max} characters`,
  },
  company: {
    nameRequired: 'Company name is required',
    domainRequired: 'Company domain is required',
    domainInvalid: 'Please enter a valid domain name',
  },
  employee: {
    roleRequired: 'Employee role is required',
    emailExists: 'An employee with this email already exists',
  },
  skill: {
    nameRequired: 'Skill name is required',
    categoryRequired: 'Skill category is required',
  },
  certificate: {
    titleRequired: 'Certificate title is required',
    invalidDateRange: 'End date must be after start date',
  },
  project: {
    nameRequired: 'Project name is required',
    techStackRequired: 'At least one technology is required for the project',
    invalidDateRange: 'End date must be on or after start date',
    notFound: 'Project not found',
    memberAlreadyExists: 'Employee is already a member of this project',
  },
  file: {
    tooLarge: (maxSize: number) => `File size must not exceed ${maxSize} MB`,
    invalidType: 'File type not allowed',
    required: 'File is required',
  },
  pagination: {
    invalidPage: 'Page must be a positive number',
    invalidPageSize: 'Page size must be between 1 and 100',
  },
} as const
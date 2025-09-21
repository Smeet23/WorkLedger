import { ZodError } from 'zod'

// Base error class for all application errors
export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly code: string
  abstract readonly isOperational: boolean

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational,
    }
  }
}

// Authentication & Authorization Errors
export class AuthenticationError extends AppError {
  readonly statusCode = 401
  readonly code = 'AUTHENTICATION_FAILED'
  readonly isOperational = true

  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403
  readonly code = 'AUTHORIZATION_FAILED'
  readonly isOperational = true

  constructor(message = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class SessionExpiredError extends AppError {
  readonly statusCode = 401
  readonly code = 'SESSION_EXPIRED'
  readonly isOperational = true

  constructor(message = 'Session has expired', context?: Record<string, unknown>) {
    super(message, context)
  }
}

// Validation Errors
export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly code = 'VALIDATION_FAILED'
  readonly isOperational = true

  constructor(
    message = 'Validation failed',
    public readonly errors: Array<{ field: string; message: string }> = [],
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }

  static fromZodError(error: ZodError): ValidationError {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }))

    return new ValidationError('Validation failed', errors, { zodError: error })
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly code = 'RESOURCE_NOT_FOUND'
  readonly isOperational = true

  constructor(
    resource: string,
    identifier?: string | number,
    context?: Record<string, unknown>
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, { resource, identifier, ...context })
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409
  readonly code = 'RESOURCE_CONFLICT'
  readonly isOperational = true

  constructor(message = 'Resource conflict', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class DuplicateResourceError extends AppError {
  readonly statusCode = 409
  readonly code = 'DUPLICATE_RESOURCE'
  readonly isOperational = true

  constructor(
    resource: string,
    field?: string,
    value?: string,
    context?: Record<string, unknown>
  ) {
    const message = field && value
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} already exists`
    super(message, { resource, field, value, ...context })
  }
}

// External Service Errors
export class ExternalServiceError extends AppError {
  readonly statusCode = 502
  readonly code = 'EXTERNAL_SERVICE_ERROR'
  readonly isOperational = true

  constructor(
    service: string,
    message?: string,
    context?: Record<string, unknown>
  ) {
    super(message || `External service '${service}' is unavailable`, { service, ...context })
  }
}

export class GitHubAPIError extends ExternalServiceError {
  readonly code = 'GITHUB_API_ERROR'

  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: unknown,
    context?: Record<string, unknown>
  ) {
    super('GitHub', message, { status, response, ...context })
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly code = 'RATE_LIMIT_EXCEEDED'
  readonly isOperational = true

  constructor(
    service?: string,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    const message = service
      ? `Rate limit exceeded for ${service}`
      : 'Rate limit exceeded'
    super(message, { service, retryAfter, ...context })
  }
}

// Business Logic Errors
export class BusinessLogicError extends AppError {
  readonly statusCode = 422
  readonly code = 'BUSINESS_LOGIC_ERROR'
  readonly isOperational = true

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class InvitationError extends BusinessLogicError {
  readonly code = 'INVITATION_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class CertificateGenerationError extends BusinessLogicError {
  readonly code = 'CERTIFICATE_GENERATION_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class SkillDetectionError extends BusinessLogicError {
  readonly code = 'SKILL_DETECTION_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

// Infrastructure Errors
export class DatabaseError extends AppError {
  readonly statusCode = 500
  readonly code = 'DATABASE_ERROR'
  readonly isOperational = false

  constructor(
    message: string,
    public readonly originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, { originalError: originalError?.message, ...context })
  }
}

export class FileSystemError extends AppError {
  readonly statusCode = 500
  readonly code = 'FILESYSTEM_ERROR'
  readonly isOperational = false

  constructor(
    operation: string,
    path?: string,
    context?: Record<string, unknown>
  ) {
    super(`File system operation '${operation}' failed`, { operation, path, ...context })
  }
}

export class ConfigurationError extends AppError {
  readonly statusCode = 500
  readonly code = 'CONFIGURATION_ERROR'
  readonly isOperational = false

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

// Request Errors
export class BadRequestError extends AppError {
  readonly statusCode = 400
  readonly code = 'BAD_REQUEST'
  readonly isOperational = true

  constructor(message = 'Bad request', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class PayloadTooLargeError extends AppError {
  readonly statusCode = 413
  readonly code = 'PAYLOAD_TOO_LARGE'
  readonly isOperational = true

  constructor(
    maxSize?: number,
    actualSize?: number,
    context?: Record<string, unknown>
  ) {
    const message = maxSize
      ? `Payload too large. Maximum size: ${maxSize} bytes`
      : 'Payload too large'
    super(message, { maxSize, actualSize, ...context })
  }
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational
}

// Error factory functions
export function createNotFoundError(resource: string, id?: string | number) {
  return new NotFoundError(resource, id)
}

export function createValidationError(errors: Array<{ field: string; message: string }>) {
  return new ValidationError('Validation failed', errors)
}

export function createDuplicateError(resource: string, field: string, value: string) {
  return new DuplicateResourceError(resource, field, value)
}

// Error utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code
  }
  if (error instanceof Error) {
    return error.name
  }
  return 'UNKNOWN_ERROR'
}

export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode
  }
  return 500
}

// Error serialization for logging
export function serializeError(error: unknown): Record<string, unknown> {
  if (isAppError(error)) {
    return error.toJSON()
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    error: String(error),
  }
}

// Common error patterns
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_REQUIRED: 'Authentication required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',

  // Validation
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `${field} has invalid format`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,

  // Resources
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  COMPANY_NOT_FOUND: 'Company not found',
  CERTIFICATE_NOT_FOUND: 'Certificate not found',
  INVITATION_NOT_FOUND: 'Invitation not found',
  REPOSITORY_NOT_FOUND: 'Repository not found',

  // Business Logic
  INVITATION_EXPIRED: 'Invitation has expired',
  INVITATION_ALREADY_ACCEPTED: 'Invitation has already been accepted',
  DUPLICATE_EMAIL: 'An account with this email already exists',
  INVALID_INVITATION_TOKEN: 'Invalid invitation token',
  GITHUB_ALREADY_CONNECTED: 'GitHub account is already connected',
  GITHUB_NOT_CONNECTED: 'GitHub account is not connected',

  // External Services
  GITHUB_API_ERROR: 'GitHub API is currently unavailable',
  EMAIL_SEND_FAILED: 'Failed to send email',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // Generic
  INTERNAL_ERROR: 'An internal error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  OPERATION_FAILED: 'Operation failed to complete',
} as const

export type ErrorMessageKey = keyof typeof ErrorMessages
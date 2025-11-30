import { serializeError, isAppError } from './errors'

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Safe environment detection that works on both client and server
const isDev = process.env.NODE_ENV === 'development'
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'WorkLedger'
const nodeEnv = process.env.NODE_ENV || 'development'

// Log entry interface
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  error?: unknown
  userId?: string
  requestId?: string
  companyId?: string
  employeeId?: string
}

// Logger interface
export interface Logger {
  error(message: string, error?: unknown, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}

// Base logger implementation
class BaseLogger implements Logger {
  constructor(
    private readonly minLevel: LogLevel = isDev ? LogLevel.DEBUG : LogLevel.INFO
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const level = LogLevel[entry.level]
    const prefix = `[${timestamp}] ${level}:`

    let message = `${prefix} ${entry.message}`

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` | Context: ${JSON.stringify(entry.context)}`
    }

    if (entry.error) {
      const serialized = serializeError(entry.error)
      message += ` | Error: ${JSON.stringify(serialized)}`
    }

    return message
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: {
        ...context,
        environment: nodeEnv,
        appName: appName,
      },
      error,
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry = this.createLogEntry(LogLevel.ERROR, message, error, context)

    if (isDev) {
      console.error(this.formatMessage(entry))
      if (error instanceof Error && error.stack) {
        console.error(error.stack)
      }
    } else {
      // In production, send to external logging service
      this.sendToExternalService(entry)
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, context)

    if (isDev) {
      console.warn(this.formatMessage(entry))
    } else {
      this.sendToExternalService(entry)
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, context)

    if (isDev) {
      console.info(this.formatMessage(entry))
    } else {
      this.sendToExternalService(entry)
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context)

    if (isDev) {
      console.debug(this.formatMessage(entry))
    }
    // Don't send debug logs to external service in production
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // For now, just use console in production too
    const formatted = this.formatMessage(entry)

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      default:
        console.log(formatted)
    }
  }
}

// Contextual logger that preserves context across log calls
export class ContextualLogger implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly context: Record<string, unknown> = {}
  ) {}

  withContext(additionalContext: Record<string, unknown>): ContextualLogger {
    return new ContextualLogger(this.baseLogger, {
      ...this.context,
      ...additionalContext,
    })
  }

  withUser(userId: string): ContextualLogger {
    return this.withContext({ userId })
  }

  withCompany(companyId: string): ContextualLogger {
    return this.withContext({ companyId })
  }

  withEmployee(employeeId: string): ContextualLogger {
    return this.withContext({ employeeId })
  }

  withRequest(requestId: string): ContextualLogger {
    return this.withContext({ requestId })
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.baseLogger.error(message, error, { ...this.context, ...context })
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.warn(message, { ...this.context, ...context })
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.info(message, { ...this.context, ...context })
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.debug(message, { ...this.context, ...context })
  }
}

// Create default logger instance
export const logger = new BaseLogger()

// Create contextual logger factory
export function createLogger(context?: Record<string, unknown>): ContextualLogger {
  return new ContextualLogger(logger, context)
}

// Utility functions for common logging patterns
export const loggers = {
  // API request logging
  apiRequest: (method: string, path: string, userId?: string) => {
    return createLogger({
      type: 'api_request',
      method,
      path,
      userId,
    })
  },

  // Database operation logging
  database: (operation: string, table: string) => {
    return createLogger({
      type: 'database',
      operation,
      table,
    })
  },

  // External service logging
  external: (service: string) => {
    return createLogger({
      type: 'external_service',
      service,
    })
  },

  // Business logic logging
  business: (domain: string) => {
    return createLogger({
      type: 'business_logic',
      domain,
    })
  },

  // Security logging
  security: (event: string) => {
    return createLogger({
      type: 'security',
      event,
    })
  },

  // Performance logging
  performance: (operation: string) => {
    return createLogger({
      type: 'performance',
      operation,
    })
  },
}

// Performance measurement utility
export function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  logger?: ContextualLogger
): Promise<T> {
  const start = Date.now()
  const log = logger || loggers.performance(operation)

  return fn().then(
    (result) => {
      const duration = Date.now() - start
      log.info(`Operation completed successfully`, { duration })
      return result
    },
    (error) => {
      const duration = Date.now() - start
      log.error(`Operation failed`, error, { duration })
      throw error
    }
  )
}

// Error logging utility
export function logError(
  error: unknown,
  context: {
    operation?: string
    userId?: string
    companyId?: string
    employeeId?: string
    requestId?: string
  } = {}
): void {
  const errorLogger = createLogger(context)

  if (isAppError(error)) {
    errorLogger.error(`${error.code}: ${error.message}`, error, error.context)
  } else if (error instanceof Error) {
    errorLogger.error(`Unexpected error: ${error.message}`, error)
  } else {
    errorLogger.error('Unknown error occurred', error)
  }
}

// Audit logging for security-sensitive operations
export function logAudit(
  action: string,
  resource: string,
  context: {
    userId?: string
    companyId?: string
    employeeId?: string
    resourceId?: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
): void {
  const auditLogger = loggers.security('audit')

  auditLogger.info(`Audit: ${action} on ${resource}`, {
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...context,
  })
}

// Structured logging for specific events
export const eventLoggers = {
  userLogin: (userId: string, success: boolean, context?: Record<string, unknown>) => {
    loggers.security('user_login').info(
      success ? 'User login successful' : 'User login failed',
      { userId, success, ...context }
    )
  },

  userLogout: (userId: string) => {
    loggers.security('user_logout').info('User logout', { userId })
  },

  invitationSent: (companyId: string, email: string, invitedBy: string) => {
    loggers.business('invitation').info('Invitation sent', {
      companyId,
      email,
      invitedBy,
    })
  },

  certificateGenerated: (employeeId: string, certificateId: string) => {
    loggers.business('certificate').info('Certificate generated', {
      employeeId,
      certificateId,
    })
  },

  githubSync: (employeeId: string, repoCount: number, success: boolean, error?: unknown) => {
    const githubLogger = loggers.external('github')

    if (success) {
      githubLogger.info('GitHub sync completed', { employeeId, repoCount })
    } else {
      githubLogger.error('GitHub sync failed', error, { employeeId })
    }
  },

  skillDetection: (employeeId: string, skillCount: number, detectionTime: number) => {
    loggers.business('skill_detection').info('Skills detected', {
      employeeId,
      skillCount,
      detectionTime,
    })
  },
}

export default logger
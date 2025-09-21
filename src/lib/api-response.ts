import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  AppError,
  ValidationError,
  isAppError,
  getStatusCode,
  getErrorCode,
  getErrorMessage,
  serializeError
} from './errors'
import { logError } from './logger'

// Standard API response interfaces
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  pagination?: PaginationInfo
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
    validationErrors?: Array<{ field: string; message: string }>
  }
  timestamp: string
  requestId?: string
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// Response builder class
export class ApiResponseBuilder {
  private requestId?: string

  constructor(requestId?: string) {
    this.requestId = requestId
  }

  // Success responses
  success<T>(data: T, message?: string, pagination?: PaginationInfo): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      pagination,
    }

    return NextResponse.json(response, { status: 200 })
  }

  created<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message: message || 'Resource created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  }

  noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  // Error responses
  error(
    error: unknown,
    context?: {
      operation?: string
      userId?: string
      companyId?: string
      employeeId?: string
    }
  ): NextResponse<ApiErrorResponse> {
    // Log the error
    logError(error, { ...context, requestId: this.requestId })

    const statusCode = getStatusCode(error)
    const errorCode = getErrorCode(error)
    const message = getErrorMessage(error)

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    // Add validation errors if applicable
    if (error instanceof ValidationError) {
      response.error.validationErrors = error.errors
    }

    // Add additional details in development
    if (process.env.NODE_ENV === 'development' && isAppError(error)) {
      response.error.details = serializeError(error)
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Specific error types
  badRequest(message = 'Bad request', details?: unknown): NextResponse<ApiErrorResponse> {
    return this.error(new AppError(message, details) as any)
  }

  unauthorized(message = 'Unauthorized'): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 401 })
  }

  forbidden(message = 'Forbidden'): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 403 })
  }

  notFound(resource = 'Resource', identifier?: string): NextResponse<ApiErrorResponse> {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 404 })
  }

  conflict(message = 'Resource conflict'): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 409 })
  }

  validation(errors: Array<{ field: string; message: string }>): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        validationErrors: errors,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 400 })
  }

  rateLimit(retryAfter?: number): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    const headers: Record<string, string> = {}
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString()
    }

    return NextResponse.json(response, { status: 429, headers })
  }

  internalError(message = 'Internal server error'): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// Factory function to create response builder
export function createApiResponse(requestId?: string): ApiResponseBuilder {
  return new ApiResponseBuilder(requestId)
}

// Default response builder
export const apiResponse = new ApiResponseBuilder()

// Utility functions for handling different error types
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const validationError = ValidationError.fromZodError(error)
  return apiResponse.error(validationError)
}

export function handlePrismaError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle Prisma-specific errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as any

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return apiResponse.conflict('A record with this information already exists')

      case 'P2025': // Record not found
        return apiResponse.notFound('Resource')

      case 'P2003': // Foreign key constraint violation
        return apiResponse.badRequest('Invalid reference to related resource')

      case 'P2014': // Required relation is missing
        return apiResponse.badRequest('Required related resource is missing')

      default:
        return apiResponse.internalError('Database operation failed')
    }
  }

  return apiResponse.internalError('Database error occurred')
}

// Create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    pageSize: number
    total: number
  }
): ApiSuccessResponse<T[]> {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1,
    },
  }
}

// Async error wrapper for API handlers
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error)
      }

      // Check if it's a Prisma error
      if (typeof error === 'object' && error !== null && 'code' in error) {
        return handlePrismaError(error)
      }

      if (isAppError(error)) {
        return apiResponse.error(error)
      }

      // Log unexpected errors
      console.error('Unexpected error in API handler:', error)
      return apiResponse.internalError('An unexpected error occurred')
    }
  }
}

// Request validation helper
export async function validateRequest<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error)
    }
    throw error
  }
}

// Type-safe response helpers
export const responses = {
  // Success responses
  ok: <T>(data: T, message?: string) => apiResponse.success(data, message),
  created: <T>(data: T, message?: string) => apiResponse.created(data, message),
  noContent: () => apiResponse.noContent(),

  // Error responses
  badRequest: (message?: string, details?: unknown) => apiResponse.badRequest(message, details),
  unauthorized: (message?: string) => apiResponse.unauthorized(message),
  forbidden: (message?: string) => apiResponse.forbidden(message),
  notFound: (resource?: string, identifier?: string) => apiResponse.notFound(resource, identifier),
  conflict: (message?: string) => apiResponse.conflict(message),
  validation: (errors: Array<{ field: string; message: string }>) => apiResponse.validation(errors),
  rateLimit: (retryAfter?: number) => apiResponse.rateLimit(retryAfter),
  internalError: (message?: string) => apiResponse.internalError(message),

  // Paginated response
  paginated: <T>(data: T[], pagination: { page: number; pageSize: number; total: number }) => {
    const response = createPaginatedResponse(data, pagination)
    return NextResponse.json(response)
  },
}
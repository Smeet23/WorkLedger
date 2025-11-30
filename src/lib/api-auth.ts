import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from './session'
import { db } from './db'
import { createApiResponse, ApiErrorResponse } from './api-response'
import crypto from 'crypto'

// Types for authenticated requests
export interface AuthenticatedUser {
  id: string
  email: string
  role: 'company_admin' | 'user'
  firstName?: string
  lastName?: string
}

export interface AuthenticatedEmployee {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  companyId: string
  githubUsername?: string | null
}

export interface AuthContext {
  user: AuthenticatedUser
  employee: AuthenticatedEmployee
  companyId: string
}

type ApiHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>

type PublicApiHandler = (
  request: NextRequest
) => Promise<NextResponse>

// API Response builder instance
const apiResponse = createApiResponse()

/**
 * Wrapper for routes that require any authenticated user
 * Usage:
 * export const GET = withAuth(async (request, { user, employee, companyId }) => {
 *   // Your handler code
 * })
 */
export function withAuth(handler: ApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getServerSession()

      if (!session?.user?.id) {
        return apiResponse.unauthorized('Authentication required')
      }

      // Get employee record
      const employee = await db.employee.findFirst({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          companyId: true,
          githubUsername: true,
        }
      })

      if (!employee) {
        return apiResponse.notFound('Employee', session.user.email || 'unknown')
      }

      const authContext: AuthContext = {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.role as 'company_admin' | 'user',
          firstName: session.user.firstName,
          lastName: session.user.lastName,
        },
        employee: {
          id: employee.id,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role,
          companyId: employee.companyId,
          githubUsername: employee.githubUsername,
        },
        companyId: employee.companyId,
      }

      return await handler(request, authContext)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return apiResponse.internalError('Authentication failed')
    }
  }
}

/**
 * Wrapper for routes that require company admin role
 * Usage:
 * export const POST = withCompanyAdmin(async (request, { user, employee, companyId }) => {
 *   // Your handler code - user is guaranteed to be company_admin
 * })
 */
export function withCompanyAdmin(handler: ApiHandler) {
  return withAuth(async (request, context) => {
    if (context.user.role !== 'company_admin') {
      return apiResponse.forbidden('Company admin access required')
    }
    return handler(request, context)
  })
}

/**
 * Wrapper for routes that need to verify the user owns/belongs to a specific company
 * Useful for routes with company-specific resources
 */
export function withCompanyAccess(
  handler: ApiHandler,
  getCompanyId: (request: NextRequest) => string | null
) {
  return withAuth(async (request, context) => {
    const requestedCompanyId = getCompanyId(request)

    if (requestedCompanyId && requestedCompanyId !== context.companyId) {
      return apiResponse.forbidden('Access denied to this company resource')
    }

    return handler(request, context)
  })
}

/**
 * Wrapper for public routes (no auth required)
 * Still provides error handling
 */
export function withPublic(handler: PublicApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('Public route error:', error)
      return apiResponse.internalError('An error occurred')
    }
  }
}

/**
 * Wrapper for webhook routes with signature verification
 */
interface WebhookConfig {
  secretEnvVar: string
  signatureHeader: string
  algorithm?: 'sha256' | 'sha1'
  signaturePrefix?: string
}

export function withWebhookAuth(
  handler: PublicApiHandler,
  config: WebhookConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const secret = process.env[config.secretEnvVar]

      if (!secret) {
        console.error(`Webhook secret not configured: ${config.secretEnvVar}`)
        return apiResponse.internalError('Webhook not configured')
      }

      const signature = request.headers.get(config.signatureHeader)

      if (!signature) {
        return apiResponse.unauthorized('Missing webhook signature')
      }

      // Clone request to read body (can only read once)
      const body = await request.text()

      // Compute expected signature
      const algorithm = config.algorithm || 'sha256'
      const computedSignature = crypto
        .createHmac(algorithm, secret)
        .update(body)
        .digest('hex')

      const prefix = config.signaturePrefix || `${algorithm}=`
      const expectedSignature = `${prefix}${computedSignature}`

      // Timing-safe comparison
      if (!timingSafeEqual(signature, expectedSignature)) {
        console.warn('Webhook signature mismatch')
        return apiResponse.unauthorized('Invalid webhook signature')
      }

      // Re-create request with parsed body for handler
      const newRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: body,
      })

      // Attach parsed body to request for easy access
      ;(newRequest as any).parsedBody = JSON.parse(body)

      return await handler(newRequest)
    } catch (error) {
      console.error('Webhook auth error:', error)
      return apiResponse.internalError('Webhook processing failed')
    }
  }
}

/**
 * Pre-configured webhook auth for GitHub
 */
export function withGitHubWebhook(handler: PublicApiHandler) {
  return withWebhookAuth(handler, {
    secretEnvVar: 'GITHUB_WEBHOOK_SECRET',
    signatureHeader: 'x-hub-signature-256',
    algorithm: 'sha256',
    signaturePrefix: 'sha256=',
  })
}

/**
 * Pre-configured webhook auth for GitLab
 */
export function withGitLabWebhook(handler: PublicApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const secret = process.env.GITLAB_WEBHOOK_SECRET
      const token = request.headers.get('x-gitlab-token')

      if (!secret) {
        console.error('GitLab webhook secret not configured')
        return apiResponse.internalError('Webhook not configured')
      }

      if (!token || token !== secret) {
        return apiResponse.unauthorized('Invalid GitLab webhook token')
      }

      return await handler(request)
    } catch (error) {
      console.error('GitLab webhook error:', error)
      return apiResponse.internalError('Webhook processing failed')
    }
  }
}

/**
 * Pre-configured webhook auth for Jira
 */
export function withJiraWebhook(handler: PublicApiHandler) {
  return withWebhookAuth(handler, {
    secretEnvVar: 'JIRA_WEBHOOK_SECRET',
    signatureHeader: 'x-hub-signature',
    algorithm: 'sha256',
    signaturePrefix: 'sha256=',
  })
}

/**
 * Pre-configured webhook auth for Slack
 */
export function withSlackWebhook(handler: PublicApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const signingSecret = process.env.SLACK_SIGNING_SECRET

      if (!signingSecret) {
        console.error('Slack signing secret not configured')
        return apiResponse.internalError('Webhook not configured')
      }

      const timestamp = request.headers.get('x-slack-request-timestamp')
      const signature = request.headers.get('x-slack-signature')

      if (!timestamp || !signature) {
        return apiResponse.unauthorized('Missing Slack signature headers')
      }

      // Check timestamp to prevent replay attacks (5 minute window)
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
      if (parseInt(timestamp) < fiveMinutesAgo) {
        return apiResponse.unauthorized('Request timestamp too old')
      }

      const body = await request.text()
      const sigBasestring = `v0:${timestamp}:${body}`
      const mySignature = 'v0=' + crypto
        .createHmac('sha256', signingSecret)
        .update(sigBasestring)
        .digest('hex')

      if (!timingSafeEqual(signature, mySignature)) {
        return apiResponse.unauthorized('Invalid Slack signature')
      }

      // Re-create request with body
      const newRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: body,
      })
      ;(newRequest as any).parsedBody = new URLSearchParams(body)

      return await handler(newRequest)
    } catch (error) {
      console.error('Slack webhook error:', error)
      return apiResponse.internalError('Webhook processing failed')
    }
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Rate limiting helper (basic implementation)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: ApiHandler | PublicApiHandler,
  options: {
    limit: number
    windowMs: number
    keyGenerator?: (request: NextRequest) => string
  }
) {
  const { limit, windowMs, keyGenerator } = options

  return async (request: NextRequest, context?: AuthContext): Promise<NextResponse> => {
    const key = keyGenerator
      ? keyGenerator(request)
      : request.headers.get('x-forwarded-for') || 'unknown'

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (record && record.resetTime > now) {
      if (record.count >= limit) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000)
        return apiResponse.rateLimit(retryAfter)
      }
      record.count++
    } else {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      Array.from(rateLimitStore.entries()).forEach(([k, v]) => {
        if (v.resetTime < now) {
          rateLimitStore.delete(k)
        }
      })
    }

    if (context) {
      return (handler as ApiHandler)(request, context)
    }
    return (handler as PublicApiHandler)(request)
  }
}

/**
 * Combine multiple middleware wrappers
 * Usage:
 * export const POST = compose(
 *   withRateLimit({ limit: 10, windowMs: 60000 }),
 *   withCompanyAdmin
 * )(async (request, context) => { ... })
 */
export function compose(
  ...wrappers: Array<(handler: any) => any>
) {
  return (handler: ApiHandler) => {
    return wrappers.reduceRight((acc, wrapper) => wrapper(acc), handler)
  }
}

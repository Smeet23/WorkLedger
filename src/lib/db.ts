import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Normalize database URL to ensure proper pgBouncer configuration for serverless
 * This ensures prepared statements are disabled when using connection poolers
 */
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url

  // In serverless environments (Vercel), always use pooler configuration
  const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production'
  
  // Always normalize URLs in serverless, or if they already have pgbouncer=true
  if (isServerless || url.includes('pgbouncer=true') || url.includes('pooler')) {
    try {
      const urlObj = new URL(url)
      
      // Warn if using direct connection port in serverless (should use pooler port 6543)
      if (isServerless && urlObj.port === '5432' && !url.includes('pooler')) {
        console.warn(
          '⚠️ WARNING: Using direct database connection (port 5432) in serverless environment.\n' +
          'This may cause connection issues. Please use connection pooler port 6543.\n' +
          'See DEPLOYMENT.md for instructions.'
        )
      }
      
      // CRITICAL: Ensure pgbouncer=true is present (required for Prisma to disable prepared statements)
      // When pgbouncer=true is in the connection string, Prisma automatically disables prepared statements
      // This prevents "prepared statement already exists" errors in serverless environments
      urlObj.searchParams.set('pgbouncer', 'true')
      
      // Set connection limit for serverless (1 connection per instance)
      // This prevents connection pool exhaustion in serverless environments
      if (!urlObj.searchParams.has('connection_limit')) {
        urlObj.searchParams.set('connection_limit', '1')
      }
      
      // Add connection timeouts for serverless to prevent hanging connections
      if (!urlObj.searchParams.has('connect_timeout')) {
        urlObj.searchParams.set('connect_timeout', '10')
      }
      
      // Pool timeout to prevent long waits
      if (!urlObj.searchParams.has('pool_timeout')) {
        urlObj.searchParams.set('pool_timeout', '10')
      }

      const normalizedUrl = urlObj.toString()
      
      // Log in development to verify normalization is working
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Normalized DATABASE_URL for serverless:', normalizedUrl.replace(/:[^:@]+@/, ':****@'))
      }
      
      return normalizedUrl
    } catch (error) {
      console.error('❌ Error normalizing DATABASE_URL:', error)
      // Return original URL if normalization fails
      return url
    }
  }

  return url
}

// Configure Prisma for serverless environments (Vercel, etc.)
// This prevents prepared statement conflicts when using connection poolers (pgBouncer)
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}

// Prefer Vercel's Prisma-specific URL if available (already configured for pooling)
// Otherwise, use DATABASE_URL and normalize it
const rawDatabaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl)

// Explicitly set datasource URL to ensure Prisma uses the normalized connection string
// This ensures pgBouncer configuration and prepared statement disabling is properly applied
if (databaseUrl) {
  prismaClientOptions.datasources = {
    db: {
      url: databaseUrl,
    },
  }
} else {
  console.error('❌ ERROR: No DATABASE_URL or POSTGRES_PRISMA_URL environment variable found!')
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

// Reuse Prisma client to prevent creating multiple instances
// In Vercel, container reuse means we should share the client instance
// This prevents connection pool exhaustion
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = db
}

// Handle graceful disconnection for serverless environments
if (typeof window === 'undefined') {
  // Disconnect on process termination to prevent connection leaks
  const disconnect = async () => {
    try {
      await db.$disconnect()
    } catch (error) {
      // Ignore errors during shutdown
      console.error('Error disconnecting Prisma:', error)
    }
  }
  
  process.on('SIGINT', disconnect)
  process.on('SIGTERM', disconnect)
  process.on('beforeExit', disconnect)
}
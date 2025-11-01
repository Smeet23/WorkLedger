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
  
  // Always normalize URLs in serverless, or if they already have pgbouncer=true or pooler hostname
  // The presence of "pooler" in hostname indicates connection pooler, which requires normalization
  const hasPoolerHostname = url.includes('pooler') || url.includes('pooler.supabase.com')
  if (isServerless || url.includes('pgbouncer=true') || hasPoolerHostname) {
    try {
      const urlObj = new URL(url)
      
      // CRITICAL: In serverless, must use pooler port 6543, not direct port 5432
      // Using port 5432 will cause "prepared statement already exists" errors
      if (isServerless && urlObj.port === '5432' && !url.includes('pooler')) {
        const errorMessage = 
          '❌ CRITICAL ERROR: DATABASE_URL uses direct connection port 5432 in serverless environment!\n' +
          'This will cause "prepared statement already exists" errors.\n\n' +
          'SOLUTION: Update DATABASE_URL in Vercel to use connection pooler port 6543:\n' +
          '  1. Go to Supabase Dashboard → Settings → Database → Connection Pooling\n' +
          '  2. Copy the "Transaction mode" connection string (port 6543)\n' +
          '  3. Update DATABASE_URL in Vercel environment variables\n' +
          '  4. Redeploy your application\n\n' +
          'See DEPLOYMENT.md for detailed instructions.'
        
        // In production/vercel, throw error to prevent runtime issues
        // In development, just warn so they can fix it before deploying
        if (process.env.VERCEL) {
          throw new Error(errorMessage)
        } else {
          console.error(errorMessage)
        }
      }
      
      // CRITICAL: Ensure pgbouncer=true is present (required for Prisma to disable prepared statements)
      // When pgbouncer=true is in the connection string, Prisma automatically disables prepared statements
      // This prevents "prepared statement already exists" errors in serverless environments
      urlObj.searchParams.set('pgbouncer', 'true')
      
      // Set connection limit for serverless (1 connection per instance)
      // CRITICAL: Must be 1 for Supabase pooler to prevent connection exhaustion
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
      
      // Log normalized URL (without password) to verify configuration (development only)
      if (process.env.NODE_ENV === 'development') {
        const safeUrl = normalizedUrl.replace(/:([^:@]+)@/, ':****@')
        console.log('🔧 Prisma Configuration:', {
          hasPgbouncer: normalizedUrl.includes('pgbouncer=true'),
          port: urlObj.port,
          connectionLimit: urlObj.searchParams.get('connection_limit'),
          urlPreview: safeUrl.substring(0, 100) + '...'
        })
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

// Prefer Vercel's Prisma-specific URL if available (already configured for pooling)
// Otherwise, use DATABASE_URL and normalize it
const rawDatabaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl)

if (!databaseUrl) {
  console.error('❌ ERROR: No DATABASE_URL or POSTGRES_PRISMA_URL environment variable found!')
  throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL must be set')
}

// CRITICAL: Override DATABASE_URL in process.env BEFORE creating PrismaClient
// Prisma Engine reads DATABASE_URL at initialization time, so we must set it early
// This ensures Prisma Engine sees pgbouncer=true and disables prepared statements
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Store original for reference
  if (rawDatabaseUrl && rawDatabaseUrl !== databaseUrl) {
    process.env.DATABASE_URL_ORIGINAL = rawDatabaseUrl
  }
  // Override with normalized URL
  process.env.DATABASE_URL = databaseUrl
}

// Configure Prisma for serverless environments (Vercel, etc.)
// This prevents prepared statement conflicts when using connection poolers (pgBouncer)
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Explicitly set datasource to ensure Prisma uses the normalized connection string
  // The normalized URL includes pgbouncer=true which tells Prisma Engine to disable prepared statements
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
}

// Verify normalized URL has pgbouncer=true before creating client
const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production'
if (isServerless && !databaseUrl.includes('pgbouncer=true')) {
  console.error('⚠️ WARNING: Normalized DATABASE_URL missing pgbouncer=true parameter!')
  console.error('This may cause prepared statement conflicts. URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
}

// Create Prisma client with normalized connection string
// This ensures prepared statements are disabled via pgbouncer=true parameter
// Reuse existing instance if available to prevent multiple clients
export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

// Reuse Prisma client to prevent creating multiple instances
// In Vercel, container reuse means we should share the client instance
// This prevents connection pool exhaustion and ensures consistent configuration
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
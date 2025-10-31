import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma for serverless environments (Vercel, etc.)
// This prevents prepared statement conflicts when using connection poolers (pgBouncer)
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}

// Disable prepared statements when using connection poolers (required for pgBouncer)
// This prevents "prepared statement already exists" errors in serverless environments
if (process.env.DATABASE_URL?.includes('pgbouncer=true') || process.env.VERCEL) {
  // For Prisma 5.x, we disable prepared statements via connection string parameters
  // Ensure DATABASE_URL includes ?pgbouncer=true&connection_limit=1
  // Alternatively, we configure via datasources if needed
  prismaClientOptions.datasources = {
    db: {
      url: process.env.DATABASE_URL,
    },
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

// Only reuse Prisma client in development (not in serverless)
// In production/serverless, each function instance gets its own client
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  globalForPrisma.prisma = db
}

// Handle graceful disconnection
if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    await db.$disconnect()
  })
  process.on('SIGTERM', async () => {
    await db.$disconnect()
  })
}
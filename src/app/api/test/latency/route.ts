import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const measurements = {
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    databaseUrl: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
    timings: {} as Record<string, number>
  }

  try {
    // Test 1: Simple query
    const start1 = Date.now()
    await db.$queryRaw`SELECT 1`
    measurements.timings.simpleQuery = Date.now() - start1

    // Test 2: Count query
    const start2 = Date.now()
    await db.user.count()
    measurements.timings.countQuery = Date.now() - start2

    // Test 3: Find query
    const start3 = Date.now()
    await db.user.findFirst({ take: 1 })
    measurements.timings.findQuery = Date.now() - start3

    return NextResponse.json({
      success: true,
      measurements,
      analysis: {
        totalLatency: measurements.timings.simpleQuery + measurements.timings.countQuery + measurements.timings.findQuery,
        averageLatency: Math.round((measurements.timings.simpleQuery + measurements.timings.countQuery + measurements.timings.findQuery) / 3),
        recommendation: measurements.timings.simpleQuery > 100
          ? '⚠️ High latency detected - region mismatch likely'
          : '✅ Latency looks good'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      measurements
    }, { status: 500 })
  }
}

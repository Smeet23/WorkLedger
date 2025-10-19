'use client'

import { SlackIntegrationCard } from '@/components/slack/slack-integration-card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SlackIntegrationPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Link href="/dashboard/integrations">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Slack Integration</h1>
        <p className="text-muted-foreground">
          Connect your Slack workspace to track team communication and collaboration patterns
        </p>
      </div>

      {/* Slack Integration Card */}
      <SlackIntegrationCard />

      {/* Additional Info */}
      <div className="mt-8 space-y-4">
        <div className="bg-muted/50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">What gets tracked?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Message volume per user (aggregated by hour)</li>
            <li>• Channel activity and engagement</li>
            <li>• Response times and availability patterns</li>
            <li>• Collaboration metrics</li>
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">Privacy Notice</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            We respect your privacy. Message content is never stored. We only track aggregated
            statistics like message counts per hour, channel activity, and engagement metrics.
          </p>
        </div>
      </div>
    </div>
  )
}

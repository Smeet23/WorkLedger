import { Suspense } from 'react'
import { GitHubIntegrationCard } from './github-integration-card'
import { Card, CardContent } from '@/components/ui/card'

export function GitHubIntegrationWrapper() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading GitHub integration...</div>
        </CardContent>
      </Card>
    }>
      <GitHubIntegrationCard />
    </Suspense>
  )
}
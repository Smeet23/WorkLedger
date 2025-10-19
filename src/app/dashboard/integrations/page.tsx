'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, GitBranch, MessageSquare, CheckSquare, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools to automatically track productivity, skills, and team performance
        </p>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {/* Code & Version Control */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Code & Version Control
            </h2>
            <p className="text-sm text-muted-foreground">Track commits, pull requests, and code contributions</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* GitHub Integration */}
            <Link href="/dashboard/integrations/github">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Github className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>GitHub</CardTitle>
                      <CardDescription>Code repositories & commits</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track repository activity, commits, pull requests, and automatically detect skills from code.
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    Manage Integration →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* GitLab Integration */}
            <Link href="/dashboard/integrations/gitlab">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <GitBranch className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle>GitLab</CardTitle>
                      <CardDescription>Projects & merge requests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect GitLab projects, track merge requests, and analyze development patterns.
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    Manage Integration →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Communication & Collaboration */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication & Collaboration
            </h2>
            <p className="text-sm text-muted-foreground">Monitor team communication and engagement</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Slack Integration */}
            <Link href="/dashboard/integrations/slack">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle>Slack</CardTitle>
                      <CardDescription>Team communication</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track workspace activity, channel engagement, and team collaboration patterns.
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    Manage Integration →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Discord - Coming Soon */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Discord</CardTitle>
                    <CardDescription>Server & voice activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track Discord server activity, voice channels, and community engagement.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Microsoft Teams - Coming Soon */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Microsoft Teams</CardTitle>
                    <CardDescription>Chat & meetings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor Teams chat activity, meeting attendance, and collaboration metrics.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Project Management - Coming Soon */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Project Management
            </h2>
            <p className="text-sm text-muted-foreground">Track tasks, issues, and project progress</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Jira */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CheckSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Jira</CardTitle>
                    <CardDescription>Issues & sprints</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track Jira issues, sprint velocity, and team workload distribution.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Linear */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Linear</CardTitle>
                    <CardDescription>Issues & cycles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor Linear issues, project cycles, and team productivity metrics.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Trello */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CheckSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Trello</CardTitle>
                    <CardDescription>Boards & cards</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track Trello boards, card assignments, and workflow progress.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Documentation - Coming Soon */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentation & Knowledge
            </h2>
            <p className="text-sm text-muted-foreground">Track documentation contributions</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Notion */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Notion</CardTitle>
                    <CardDescription>Workspace & pages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor Notion workspace activity, page creation, and knowledge contributions.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Confluence */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Confluence</CardTitle>
                    <CardDescription>Pages & spaces</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track Confluence page updates, space activity, and documentation growth.
                </p>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Code, TrendingUp, Users, Zap, RefreshCw, Loader2 } from 'lucide-react'

interface SkillSummary {
  skillName: string
  category: string
  employeeCount: number
  averageLevel: string
  totalProjects: number
}

interface SkillDetectionStats {
  totalSkillsDetected: number
  employeesWithSkills: number
  totalEmployees: number
  skillCategories: Record<string, number>
  topSkills: SkillSummary[]
  detectionProgress: number
  lastAnalyzedAt: string | null
}

interface SkillDetectionProgressProps {
  companyId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function SkillDetectionProgress({ companyId }: SkillDetectionProgressProps) {
  const [stats, setStats] = useState<SkillDetectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchSkillStats()
  }, [companyId])

  const fetchSkillStats = async () => {
    try {
      const response = await fetch(`/api/github/skill-detection-stats?companyId=${companyId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch skill stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const runSkillAnalysis = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/github/analyze-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })

      const data = await response.json()
      if (data.success) {
        alert('Skill analysis started! This may take a few minutes.')
        // Poll for updates
        setTimeout(fetchSkillStats, 5000)
      }
    } catch (error) {
      console.error('Failed to start skill analysis:', error)
      alert('Failed to start skill analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No skill data available</p>
        <Button onClick={runSkillAnalysis} className="mt-4">
          Start Skill Analysis
        </Button>
      </div>
    )
  }

  const pieData = Object.entries(stats.skillCategories).map(([name, value]) => ({
    name,
    value
  }))

  const barData = stats.topSkills.map(skill => ({
    name: skill.skillName,
    employees: skill.employeeCount,
    projects: skill.totalProjects
  }))

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detection Progress</h4>
          <div className="flex items-center gap-4">
            <Progress value={stats.detectionProgress} className="w-64" />
            <span className="text-sm font-medium">{stats.detectionProgress}%</span>
          </div>
          <p className="text-xs text-gray-500">
            {stats.employeesWithSkills} of {stats.totalEmployees} employees analyzed
          </p>
        </div>
        <Button
          onClick={runSkillAnalysis}
          disabled={analyzing}
          size="sm"
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Skills</p>
                <p className="text-2xl font-bold">{stats.totalSkillsDetected}</p>
              </div>
              <Code className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skilled Employees</p>
                <p className="text-2xl font-bold">{stats.employeesWithSkills}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(stats.skillCategories).length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Analysis</p>
                <p className="text-sm font-medium">
                  {stats.lastAnalyzedAt
                    ? new Date(stats.lastAnalyzedAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Categories Pie Chart */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-4">Skills by Category</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Skills Bar Chart */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-4">Top Skills by Employee Count</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="employees" fill="#8884d8" name="Employees" />
                <Bar dataKey="projects" fill="#82ca9d" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills Table */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium mb-4">Top Skills Summary</h4>
          <div className="space-y-3">
            {stats.topSkills.map((skill, index) => (
              <div key={skill.skillName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{skill.skillName}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {skill.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{skill.employeeCount}</p>
                    <p className="text-xs text-gray-500">Employees</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{skill.totalProjects}</p>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                  <div className="text-center">
                    <Badge>{skill.averageLevel}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Avg Level</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
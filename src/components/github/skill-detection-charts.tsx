'use client'

import { Card, CardContent } from '@/components/ui/card'
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

interface SkillSummary {
  skillName: string
  category: string
  employeeCount: number
  averageLevel: string
  totalProjects: number
}

interface SkillDetectionChartsProps {
  skillCategories: Record<string, number>
  topSkills: SkillSummary[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function SkillDetectionCharts({ skillCategories, topSkills }: SkillDetectionChartsProps) {
  const pieData = Object.entries(skillCategories).map(([name, value]) => ({
    name,
    value
  }))

  const barData = topSkills.map(skill => ({
    name: skill.skillName,
    employees: skill.employeeCount,
    projects: skill.totalProjects
  }))

  return (
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
  )
}

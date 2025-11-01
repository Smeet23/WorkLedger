'use client'

// Note: Client component - caching handled by API route

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientPagination } from "@/components/ui/client-pagination"
import {
  BarChart,
  Users,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  Code,
  Briefcase,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Grid,
  List
} from 'lucide-react'

const ITEMS_PER_PAGE = 12

interface SkillData {
  id: string
  name: string
  category: string
  totalEmployees: number
  levels: {
    BEGINNER: number
    INTERMEDIATE: number
    ADVANCED: number
    EXPERT: number
  }
  avgConfidence: number
}

interface EmployeeData {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string | null
  role: string
  department: string | null
  skillCount: number
}

export default function CompanySkillsMatrix() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [skillsPage, setSkillsPage] = useState(1)
  const [employeesPage, setEmployeesPage] = useState(1)

  useEffect(() => {
    fetchSkillsMatrix()
  }, [])

  // Reset page when filters change - MUST be before any early returns
  useEffect(() => {
    setSkillsPage(1)
  }, [selectedCategory])

  useEffect(() => {
    setEmployeesPage(1)
  }, [selectedDepartment])

  const fetchSkillsMatrix = async () => {
    try {
      const response = await fetch('/api/company/skills-matrix')
      if (!response.ok) {
        throw new Error('Failed to fetch skills matrix')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return 'bg-purple-500'
      case 'ADVANCED': return 'bg-blue-500'
      case 'INTERMEDIATE': return 'bg-yellow-500'
      case 'BEGINNER': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getSkillLevelBadgeVariant = (level: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (level) {
      case 'EXPERT': return 'default'
      case 'ADVANCED': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading skills matrix...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Skills</CardTitle>
            <CardDescription>{error || 'Unable to load skills matrix'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSkillsMatrix}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categories = ['all', ...Object.keys(data.skillsByCategory || {})]
  const departments = ['all', ...Object.keys(data.employeesByDepartment || {})]

  const filteredSkills = selectedCategory === 'all'
    ? (data.skills || [])
    : (data.skillsByCategory?.[selectedCategory] || [])

  const filteredEmployees = selectedDepartment === 'all'
    ? (data.employees || [])
    : (data.employeesByDepartment?.[selectedDepartment] || [])

  // Pagination calculations
  const totalSkillPages = Math.ceil((filteredSkills?.length || 0) / ITEMS_PER_PAGE)
  const paginatedSkills = filteredSkills?.slice(
    (skillsPage - 1) * ITEMS_PER_PAGE,
    skillsPage * ITEMS_PER_PAGE
  ) || []

  const totalEmployeePages = Math.ceil((filteredEmployees?.length || 0) / ITEMS_PER_PAGE)
  const paginatedEmployees = filteredEmployees?.slice(
    (employeesPage - 1) * ITEMS_PER_PAGE,
    employeesPage * ITEMS_PER_PAGE
  ) || []

  return (
    <div className="container mx-auto p-8 space-y-8 animate-fade-in">
      {/* Page intro aligned with dashboard */}
      <div className="space-y-2">
        <h1 className="text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
          Team Skills Matrix
        </h1>
        <p className="text-lg text-slate-600">Comprehensive view of your team's technical capabilities</p>
      </div>

      <main className="space-y-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {data.statistics.totalEmployees}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Unique Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                {data.statistics.totalSkills}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg Skills/Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                {data.statistics.avgSkillsPerEmployee}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                {data.statistics.departments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Skill Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600 flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                {data.statistics.totalSkillRecords}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="matrix" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matrix">Skills Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Skills</TabsTrigger>
            <TabsTrigger value="insights">Insights & Gaps</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>

          {/* Skills Overview Tab */}
          <TabsContent value="matrix" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Company-Wide Skills Distribution</CardTitle>
                    <CardDescription>
                      Overview of all skills across your organization
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedSkills.map((skill: SkillData) => (
                      <div key={skill.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{skill.name}</h4>
                            <p className="text-xs text-gray-500">{skill.category}</p>
                          </div>
                          <Badge variant="secondary">
                            {skill.totalEmployees} {skill.totalEmployees === 1 ? 'person' : 'people'}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Skill Distribution</span>
                            <span>{Math.round(skill.avgConfidence * 100)}% avg</span>
                          </div>
                          <Progress value={skill.avgConfidence * 100} className="h-2" />

                          <div className="flex gap-1 mt-3">
                            {Object.entries(skill.levels).map(([level, count]) => (
                              count > 0 && (
                                <div
                                  key={level}
                                  className={`${getSkillLevelColor(level)} text-white text-xs px-2 py-1 rounded`}
                                >
                                  {count}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedSkills.map((skill: SkillData) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{skill.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {skill.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500">
                            {skill.totalEmployees} {skill.totalEmployees === 1 ? 'employee' : 'employees'}
                          </div>
                          <div className="flex gap-1">
                            <span className={`${getSkillLevelColor('EXPERT')} text-xs text-white px-2 py-1 rounded`}>
                              {skill.levels.EXPERT}E
                            </span>
                            <span className={`${getSkillLevelColor('ADVANCED')} text-xs text-white px-2 py-1 rounded`}>
                              {skill.levels.ADVANCED}A
                            </span>
                            <span className={`${getSkillLevelColor('INTERMEDIATE')} text-xs text-white px-2 py-1 rounded`}>
                              {skill.levels.INTERMEDIATE}I
                            </span>
                            <span className={`${getSkillLevelColor('BEGINNER')} text-xs text-white px-2 py-1 rounded`}>
                              {skill.levels.BEGINNER}B
                            </span>
                          </div>
                          <Progress value={skill.avgConfidence * 100} className="w-20 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {totalSkillPages > 1 && (
                <div className="px-6 pb-6">
                  <ClientPagination
                    currentPage={skillsPage}
                    totalPages={totalSkillPages}
                    totalItems={filteredSkills.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setSkillsPage}
                  />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Employee Skills Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employee Skill Profiles</CardTitle>
                    <CardDescription>
                      Individual skill sets across your team
                    </CardDescription>
                  </div>
                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedEmployees.map((employee: any) => {
                    const employeeSkills = data.matrix[employee.id] || {}
                    const topSkills = Object.entries(employeeSkills)
                      .sort((a: any, b: any) => b[1].confidence - a[1].confidence)
                      .slice(0, 5)

                    return (
                      <div key={employee.id} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-xs text-gray-500">{employee.title || employee.role}</p>
                          {employee.department && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {employee.department}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Total Skills</span>
                            <span className="font-medium">{employee.skillCount}</span>
                          </div>

                          {topSkills.length > 0 ? (
                            <div className="space-y-1">
                              {topSkills.map(([skillId, skillData]: any) => {
                                const skill = data.skills.find((s: SkillData) => s.id === skillId)
                                if (!skill) return null

                                return (
                                  <div key={skillId} className="flex items-center justify-between">
                                    <span className="text-xs truncate flex-1">{skill.name}</span>
                                    <Badge
                                      variant={getSkillLevelBadgeVariant(skillData.level)}
                                      className="text-xs ml-2"
                                    >
                                      {skillData.level.slice(0, 3)}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No skills recorded</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              {totalEmployeePages > 1 && (
                <div className="px-6 pb-6">
                  <ClientPagination
                    currentPage={employeesPage}
                    totalPages={totalEmployeePages}
                    totalItems={filteredEmployees.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setEmployeesPage}
                  />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Team Strengths
                  </CardTitle>
                  <CardDescription>
                    Your team's strongest technical competencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.insights.teamStrengths.map((skill: SkillData) => (
                      <div key={skill.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-xs text-gray-500">
                            {skill.levels.EXPERT} experts, {skill.levels.ADVANCED} advanced
                          </p>
                        </div>
                        <Badge variant="default">
                          {Math.round((skill.levels.EXPERT + skill.levels.ADVANCED) / skill.totalEmployees * 100)}% proficient
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skill Gaps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Skill Gaps
                  </CardTitle>
                  <CardDescription>
                    Skills with low representation in your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.insights.skillGaps.map((skill: SkillData) => (
                      <div key={skill.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-xs text-gray-500">
                            Only {skill.totalEmployees} {skill.totalEmployees === 1 ? 'person knows' : 'people know'} this
                          </p>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {Math.round(skill.totalEmployees / data.statistics.totalEmployees * 100)}% coverage
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Common Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Most Common Skills
                  </CardTitle>
                  <CardDescription>
                    Widely adopted skills across your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.insights.mostCommonSkills.map((skill: SkillData) => (
                      <div key={skill.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{skill.name}</p>
                          <Progress
                            value={(skill.totalEmployees / data.statistics.totalEmployees) * 100}
                            className="h-2 mt-1"
                          />
                        </div>
                        <span className="text-sm text-gray-600 ml-3">
                          {Math.round((skill.totalEmployees / data.statistics.totalEmployees) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recently Used Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Recently Active Skills
                  </CardTitle>
                  <CardDescription>
                    Skills being actively used by your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.insights.recentlyUsedSkills.map((skill: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-xs text-gray-500">
                          {skill.lastUsed ? new Date(skill.lastUsed).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* By Category Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Skills by Category</CardTitle>
                    <CardDescription>
                      Organized view of skills grouped by type
                    </CardDescription>
                  </div>
                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCategory === 'all' ? (
                  <div className="space-y-6">
                    {Object.entries(data.skillsByCategory).map(([category, skills]: [string, any]) => (
                      <div key={category}>
                        <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                          {category === 'Programming Language' && <Code className="w-4 h-4" />}
                          {category === 'Framework' && <Lightbulb className="w-4 h-4" />}
                          {category === 'Practice' && <Target className="w-4 h-4" />}
                          {category}
                          <Badge variant="secondary" className="ml-2">
                            {skills.length} skills
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {skills.map((skill: SkillData) => (
                            <div key={skill.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm truncate">{skill.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {skill.totalEmployees}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSkills.map((skill: SkillData) => (
                      <div key={skill.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="secondary">
                            {skill.totalEmployees} people
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={skill.avgConfidence * 100} className="h-2" />
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <div className="text-center">
                              <div className={`${getSkillLevelColor('EXPERT')} text-white rounded py-1`}>
                                {skill.levels.EXPERT}
                              </div>
                              <p className="text-gray-500 mt-1">EXP</p>
                            </div>
                            <div className="text-center">
                              <div className={`${getSkillLevelColor('ADVANCED')} text-white rounded py-1`}>
                                {skill.levels.ADVANCED}
                              </div>
                              <p className="text-gray-500 mt-1">ADV</p>
                            </div>
                            <div className="text-center">
                              <div className={`${getSkillLevelColor('INTERMEDIATE')} text-white rounded py-1`}>
                                {skill.levels.INTERMEDIATE}
                              </div>
                              <p className="text-gray-500 mt-1">INT</p>
                            </div>
                            <div className="text-center">
                              <div className={`${getSkillLevelColor('BEGINNER')} text-white rounded py-1`}>
                                {skill.levels.BEGINNER}
                              </div>
                              <p className="text-gray-500 mt-1">BEG</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
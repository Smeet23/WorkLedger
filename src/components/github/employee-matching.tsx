'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Github, User, Link, Unlink, CheckCircle, XCircle, AlertCircle, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface UnmatchedMember {
  id: string
  githubUserId: string
  githubUsername: string
  githubName: string | null
  githubEmail: string | null
  matchConfidence: number | null
  discoveredAt: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  githubUsername: string | null
  autoDiscovered: boolean
}

interface EmployeeMatchingInterfaceProps {
  companyId: string
}

export function EmployeeMatchingInterface({ companyId }: EmployeeMatchingInterfaceProps) {
  const [unmatchedMembers, setUnmatchedMembers] = useState<UnmatchedMember[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<UnmatchedMember | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [linking, setLinking] = useState(false)
  const [unlinkEmployeeId, setUnlinkEmployeeId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [companyId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [membersRes, employeesRes] = await Promise.all([
        fetch(`/api/github/unmatched-members?companyId=${companyId}`),
        fetch(`/api/employees?companyId=${companyId}`)
      ])

      const membersData = await membersRes.json()
      const employeesData = await employeesRes.json()

      if (membersData.success) {
        setUnmatchedMembers(membersData.data)
      }
      if (employeesData.success) {
        setEmployees(employeesData.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkMember = async () => {
    if (!selectedMember || !selectedEmployeeId) return

    setLinking(true)
    try {
      const response = await fetch('/api/github/link-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.id,
          employeeId: selectedEmployeeId,
          companyId
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Successfully linked GitHub member to employee!",
        })
        setSelectedMember(null)
        setSelectedEmployeeId('')
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link member",
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkEmployee = async (employeeId: string) => {
    try {
      const response = await fetch('/api/github/unlink-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Successfully unlinked GitHub account",
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink member",
        variant: "destructive",
      })
    } finally {
      setUnlinkEmployeeId(null)
    }
  }

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="secondary">Unknown</Badge>
    if (confidence >= 0.9) return <Badge className="bg-green-500">High ({Math.round(confidence * 100)}%)</Badge>
    if (confidence >= 0.7) return <Badge className="bg-yellow-500">Medium ({Math.round(confidence * 100)}%)</Badge>
    return <Badge className="bg-red-500">Low ({Math.round(confidence * 100)}%)</Badge>
  }

  const filteredMembers = unmatchedMembers.filter(member =>
    member.githubUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.githubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.githubEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Alert */}
      {unmatchedMembers.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {unmatchedMembers.length} unmatched GitHub members.
            Link them to employees to enable skill tracking.
          </AlertDescription>
        </Alert>
      )}

      {/* Matched Employees */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Matched Employees</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>GitHub Account</TableHead>
                <TableHead>Discovery Method</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.filter(e => e.githubUsername).map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      <span>{employee.githubUsername}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.autoDiscovered ? 'default' : 'secondary'}>
                      {employee.autoDiscovered ? 'Auto-Discovered' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnlinkEmployeeId(employee.id)}
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      Unlink
                    </Button>
                    <ConfirmationDialog
                      open={unlinkEmployeeId === employee.id}
                      onOpenChange={(open) => !open && setUnlinkEmployeeId(null)}
                      title="Unlink GitHub Account"
                      description="Are you sure you want to unlink this GitHub account?"
                      confirmText="Unlink"
                      variant="destructive"
                      onConfirm={() => handleUnlinkEmployee(employee.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.filter(e => e.githubUsername).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No matched employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Unmatched GitHub Members */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Unmatched GitHub Members</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GitHub Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Match Confidence</TableHead>
                <TableHead>Discovered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      <div>
                        <p className="font-medium">@{member.githubUsername}</p>
                        {member.githubName && (
                          <p className="text-sm text-gray-500">{member.githubName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.githubEmail || (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </TableCell>
                  <TableCell>{getConfidenceBadge(member.matchConfidence)}</TableCell>
                  <TableCell>
                    {new Date(member.discoveredAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link GitHub Member to Employee</DialogTitle>
                          <DialogDescription>
                            Select an employee to link with @{member.githubUsername}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>GitHub Member</Label>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium">@{member.githubUsername}</p>
                              {member.githubName && (
                                <p className="text-sm text-gray-500">{member.githubName}</p>
                              )}
                              {member.githubEmail && (
                                <p className="text-sm text-gray-500">{member.githubEmail}</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="employee">Select Employee</Label>
                            <Select
                              value={selectedEmployeeId}
                              onValueChange={setSelectedEmployeeId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose an employee..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.filter(e => !e.githubUsername).map(employee => (
                                  <SelectItem key={employee.id} value={employee.id}>
                                    {employee.firstName} {employee.lastName} ({employee.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedMember(null)
                              setSelectedEmployeeId('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleLinkMember}
                            disabled={!selectedEmployeeId || linking}
                          >
                            {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Link Accounts
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    All GitHub members are matched!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
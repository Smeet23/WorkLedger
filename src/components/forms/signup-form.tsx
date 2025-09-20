"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SignUpFormProps {
  userType: 'company' | 'employee'
}

export function SignUpForm({ userType }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
    companyDomain: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess("Account created successfully! You can now sign in.")

      // Redirect to signin page after 2 seconds
      setTimeout(() => {
        router.push(`/auth/signin?type=${userType}`)
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {userType === "company" ? "Create Company Account" : "Join Your Team"}
        </CardTitle>
        <CardDescription>
          {userType === "company"
            ? "Set up your company's skill tracking platform"
            : "Join your company's WorkLedger platform"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          {userType === "company" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Acme Corp"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDomain">Company Domain</Label>
                <Input
                  id="companyDomain"
                  name="companyDomain"
                  placeholder="acme.com"
                  value={formData.companyDomain}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for employee invitations
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="companyDomain">Company Domain</Label>
              <Input
                id="companyDomain"
                name="companyDomain"
                placeholder="acme.com"
                value={formData.companyDomain}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask your administrator for your company domain
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600">
              {success}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
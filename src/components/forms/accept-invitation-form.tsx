"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, Github, ArrowRight, Sparkles } from "lucide-react"

interface InvitationData {
  id: string
  token: string
  email: string
  firstName: string
  lastName: string
  companyId: string
  companyName: string
  role: string
  title?: string
  department?: string
}

interface AcceptInvitationFormProps {
  invitation: InvitationData
  existingUser: boolean
}

type Step = 'account' | 'github' | 'complete'

export function AcceptInvitationForm({ invitation, existingUser }: AcceptInvitationFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('account')
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [githubConnected, setGithubConnected] = useState(false)
  const [skipGithub, setSkipGithub] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (existingUser) {
        // Existing user - just accept the invitation
        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: invitation.token,
            password: password // For verification
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to accept invitation")
        }

        // Sign in the user
        const signInResult = await signIn("credentials", {
          email: invitation.email,
          password: password,
          redirect: false
        })

        if (signInResult?.error) {
          throw new Error("Invalid password")
        }

        // Move to GitHub connection step
        setCurrentStep('github')

      } else {
        // New user - create account and accept invitation
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters")
        }

        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: invitation.token,
            password: password,
            createUser: true
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create account")
        }

        // Sign in the newly created user
        const signInResult = await signIn("credentials", {
          email: invitation.email,
          password: password,
          redirect: false
        })

        if (signInResult?.error) {
          throw new Error("Failed to sign in after account creation")
        }

        // Move to GitHub connection step
        setCurrentStep('github')
      }

    } catch (err) {
      console.error("Accept invitation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const connectGitHub = () => {
    // Store return URL in session storage
    sessionStorage.setItem('github_return_url', '/employee/onboarding/complete')
    // Redirect to GitHub OAuth
    window.location.href = '/api/github/connect'
  }

  const skipGitHubConnection = () => {
    setSkipGithub(true)
    setCurrentStep('complete')
    // Redirect after a short delay
    setTimeout(() => {
      router.push('/employee/dashboard')
    }, 2000)
  }

  const completeOnboarding = () => {
    router.push('/employee/dashboard')
  }

  // Check if returning from GitHub OAuth
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('github') === 'connected' && currentStep === 'github') {
      setGithubConnected(true)
      setCurrentStep('complete')
    }
  }

  if (currentStep === 'account') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pre-filled information */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <Label className="text-xs text-gray-500">Email</Label>
          <p className="font-medium">{invitation.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-500">First Name</Label>
            <p className="font-medium">{invitation.firstName}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Last Name</Label>
            <p className="font-medium">{invitation.lastName}</p>
          </div>
        </div>
        {invitation.title && (
          <div>
            <Label className="text-xs text-gray-500">Position</Label>
            <p className="font-medium">{invitation.title}</p>
          </div>
        )}
      </div>

      {/* Password fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="password">
            {existingUser ? "Enter your password to continue" : "Create a password"}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder={existingUser ? "Enter your password" : "Minimum 8 characters"}
          />
        </div>

        {!existingUser && (
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Re-enter your password"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {existingUser ? "Accepting..." : "Creating Account..."}
          </>
        ) : (
          existingUser ? "Accept Invitation" : "Create Account & Join"
        )}
      </Button>

        <p className="text-center text-sm text-gray-600">
          By accepting this invitation, you agree to join{" "}
          <span className="font-medium">{invitation.companyName}</span>
        </p>
      </form>
    )
  }

  if (currentStep === 'github') {
    return (
      <Card>
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Github className="w-8 h-8" />
            </div>
            <CardTitle>Connect Your GitHub Account</CardTitle>
            <CardDescription className="mt-2">
              Link your GitHub to automatically track your contributions and skills
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Why Connect GitHub?</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-600 mr-2 flex-shrink-0" />
                      Automatic skill detection from your code
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-600 mr-2 flex-shrink-0" />
                      Track contributions across all repositories
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-600 mr-2 flex-shrink-0" />
                      Generate verified skill certificates
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-600 mr-2 flex-shrink-0" />
                      Show your growth timeline
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={connectGitHub}
                className="w-full bg-black hover:bg-gray-800"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="w-5 h-5 mr-2" />
                    Connect with GitHub
                  </>
                )}
              </Button>

              <Button
                onClick={skipGitHubConnection}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Skip for now (you can connect later)
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              We only read your public information and repository data.
              We never make changes to your code or repositories.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (currentStep === 'complete') {
    return (
      <Card>
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to WorkLedger!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account has been set up successfully.
              {githubConnected && " Your GitHub account is connected and we're analyzing your skills."}
              {skipGithub && " You can connect your GitHub account later from your dashboard."}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">What's Next?</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-start">
                  <Badge className="mt-0.5 mr-2">1</Badge>
                  <p className="text-sm text-gray-600">
                    Complete your profile with additional information
                  </p>
                </div>
                <div className="flex items-start">
                  <Badge className="mt-0.5 mr-2">2</Badge>
                  <p className="text-sm text-gray-600">
                    {githubConnected
                      ? "View your automatically detected skills"
                      : "Connect GitHub to track your skills"}
                  </p>
                </div>
                <div className="flex items-start">
                  <Badge className="mt-0.5 mr-2">3</Badge>
                  <p className="text-sm text-gray-600">
                    Generate your first skill certificate
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={completeOnboarding}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default return for unknown steps
  return null
}
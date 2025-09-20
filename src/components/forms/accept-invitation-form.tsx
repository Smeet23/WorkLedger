"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

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

export function AcceptInvitationForm({ invitation, existingUser }: AcceptInvitationFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
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

        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)

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

        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }

    } catch (err) {
      console.error("Accept invitation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Invitation Accepted!
        </h3>
        <p className="text-sm text-gray-600">
          Redirecting to your dashboard...
        </p>
      </div>
    )
  }

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
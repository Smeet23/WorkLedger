"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

interface SignInFormProps {
  userType: 'company' | 'employee'
}

export function SignInForm({ userType }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        userType,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please check your email and password.")
      } else if (result?.ok) {
        const redirectUrl = userType === "company" ? "/dashboard" : "/employee/dashboard"
        window.location.href = redirectUrl
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Input - Clean & Simple */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
          autoComplete="email"
        />
      </div>

      {/* Password Input - Clean & Simple */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Password
          </Label>
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            onClick={() => {/* TODO: Add forgot password */}}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="h-12 px-4 pr-12 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all"
        />
        <Label htmlFor="remember" className="ml-2 text-sm text-slate-600 font-medium cursor-pointer">
          Remember me for 30 days
        </Label>
      </div>

      {/* Sign In Button - Clean Gradient */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}

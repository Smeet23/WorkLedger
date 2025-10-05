"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Mail, Lock, User, Building, Globe2 } from "lucide-react"

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
  const [showPassword, setShowPassword] = useState(false)
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

      setSuccess("Account created successfully! Redirecting...")

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="animate-slide-down border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 animate-slide-down">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
              autoComplete="given-name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
            Last Name
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
              autoComplete="family-name"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            minLength={8}
            className="h-12 pl-11 pr-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Must be at least 8 characters
        </p>
      </div>

      {userType === "company" ? (
        <>
          <div className="space-y-2.5">
            <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
              Company Name
            </Label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <Input
                id="companyName"
                name="companyName"
                placeholder="Acme Corp"
                value={formData.companyName}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
                autoComplete="organization"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="companyDomain" className="text-sm font-semibold text-slate-700">
              Company Domain
            </Label>
            <div className="relative">
              <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <Input
                id="companyDomain"
                name="companyDomain"
                placeholder="acme.com"
                value={formData.companyDomain}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Used to verify and invite employees
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2.5">
          <Label htmlFor="companyDomain" className="text-sm font-semibold text-slate-700">
            Company Domain
          </Label>
          <div className="relative">
            <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
            <Input
              id="companyDomain"
              name="companyDomain"
              placeholder="acme.com"
              value={formData.companyDomain}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="h-12 pl-11 text-[15px] border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Ask your admin for your company&apos;s domain
          </p>
        </div>
      )}

      <div className="flex items-start pt-1">
        <input
          id="terms"
          type="checkbox"
          required
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-0.5"
        />
        <Label htmlFor="terms" className="ml-2.5 text-sm text-slate-600 font-normal cursor-pointer leading-relaxed">
          I agree to the{" "}
          <a href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Terms of Service
          </a>
          {" "}and{" "}
          <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Privacy Policy
          </a>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-[15px] font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all border-0"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
            Creating your account...
          </>
        ) : (
          'Get started'
        )}
      </Button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-500 font-semibold uppercase tracking-wider">
            Or sign up with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold"
          disabled={isLoading}
          onClick={() => {/* TODO: Add Google OAuth */}}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold"
          disabled={isLoading}
          onClick={() => {/* TODO: Add GitHub OAuth */}}
        >
          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </Button>
      </div>
    </form>
  )
}

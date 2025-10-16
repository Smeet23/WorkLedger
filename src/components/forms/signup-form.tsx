"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Github } from "lucide-react"

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 text-sm font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Name Fields - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
            First Name
          </Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
            Last Name
          </Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
          className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </Label>
        <div className="relative">
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
            className="h-12 px-4 pr-12 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
            autoComplete="new-password"
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
        <p className="text-xs text-slate-500 font-medium">
          Must be at least 8 characters
        </p>
      </div>

      {/* Company Fields */}
      {userType === "company" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
              Company Name
            </Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Corp"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain" className="text-sm font-semibold text-slate-700">
              Company Domain
            </Label>
            <Input
              id="companyDomain"
              name="companyDomain"
              placeholder="acme.com"
              value={formData.companyDomain}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
            />
            <p className="text-xs text-slate-500 font-medium">
              Used to verify and invite employees
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="companyDomain" className="text-sm font-semibold text-slate-700">
            Company Domain
          </Label>
          <Input
            id="companyDomain"
            name="companyDomain"
            placeholder="acme.com"
            value={formData.companyDomain}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="h-12 px-4 text-sm border-slate-200 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
          />
          <p className="text-xs text-slate-500 font-medium">
            Ask your admin for your company's domain
          </p>
        </div>
      )}

      {/* Terms Agreement */}
      <div className="flex items-start">
        <input
          id="terms"
          type="checkbox"
          required
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 mt-0.5 transition-all"
        />
        <Label htmlFor="terms" className="ml-2 text-sm text-slate-600 font-medium cursor-pointer leading-relaxed">
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

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your account...
          </span>
        ) : (
          'Get started'
        )}
      </Button>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {/* TODO: Add Google OAuth */}}
          className="h-11 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <span className="text-sm font-semibold text-slate-700">Google</span>
          </div>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {/* TODO: Add GitHub OAuth */}}
          className="h-11 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Github className="h-5 w-5 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">GitHub</span>
          </div>
        </button>
      </div>
    </form>
  )
}

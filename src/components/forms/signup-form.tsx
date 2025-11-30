"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"

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
          <a
            href={`/terms?from=${encodeURIComponent(`/auth/signup?type=${userType}`)}`}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Terms of Service
          </a>
          {" "}and{" "}
          <a
            href={`/privacy?from=${encodeURIComponent(`/auth/signup?type=${userType}`)}`}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
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
    </form>
  )
}

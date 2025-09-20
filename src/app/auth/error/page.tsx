import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchParams {
  error?: string
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const error = searchParams.error

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again."
      case "AccessDenied":
        return "Access denied. Please contact your administrator."
      case "Verification":
        return "Email verification required."
      default:
        return "An authentication error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-red-600">
            WorkLedger
          </Link>
          <p className="text-gray-600 mt-2">Authentication Error</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              Sign In Failed
            </CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/signin?type=company">
                    Try Company Login Again
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signin?type=employee">
                    Try Employee Login
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/auth/signup?type=company">
                    Create New Account
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
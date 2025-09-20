import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { AcceptInvitationForm } from "@/components/forms/accept-invitation-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getInvitation(token: string) {
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      company: true
    }
  })

  return invitation
}

export default async function AcceptInvitationPage({
  params
}: {
  params: { token: string }
}) {
  const invitation = await getInvitation(params.token)

  // Invalid token
  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Please contact your company administrator for a new invitation.
            </p>
            <Button asChild>
              <Link href="/auth/signin">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expired invitation
  if (new Date(invitation.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Invitation Expired</CardTitle>
            <CardDescription>
              This invitation expired on {new Date(invitation.expiresAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Please contact your company administrator for a new invitation.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Company:</span> {invitation.company.name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Invited by:</span> {invitation.invitedBy}
              </p>
            </div>
            <Button asChild>
              <Link href="/auth/signin">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already accepted
  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Invitation Already Accepted</CardTitle>
            <CardDescription>
              This invitation has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              You can sign in to access your dashboard.
            </p>
            <Button asChild>
              <Link href="/auth/signin">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user with this email already exists
  const existingUser = await db.user.findUnique({
    where: { email: invitation.email }
  })

  // Valid invitation - show acceptance form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Company Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  You're invited to join {invitation.company.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {invitation.invitedBy} has invited you to join as a team member
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">
                    {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()}
                  </Badge>
                  {invitation.title && (
                    <Badge variant="secondary">{invitation.title}</Badge>
                  )}
                  {invitation.department && (
                    <Badge variant="secondary">{invitation.department}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {existingUser ? "Accept Invitation" : "Create Your Account"}
            </CardTitle>
            <CardDescription>
              {existingUser
                ? "Sign in to accept your invitation and join the team"
                : "Complete your account setup to join the team"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptInvitationForm
              invitation={{
                id: invitation.id,
                token: invitation.token,
                email: invitation.email,
                firstName: invitation.firstName,
                lastName: invitation.lastName,
                companyId: invitation.companyId,
                companyName: invitation.company.name,
                role: invitation.role,
                title: invitation.title || undefined,
                department: invitation.department || undefined
              }}
              existingUser={!!existingUser}
            />
          </CardContent>
        </Card>

        {/* Expiry Notice */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "./db"

// Session durations
const SHORT_SESSION_MAX_AGE = 24 * 60 * 60 // 24 hours (no remember me)
const LONG_SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days (remember me)

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt" as const,
    maxAge: LONG_SESSION_MAX_AGE, // Max possible, actual expiry controlled in jwt callback
    updateAge: 60 * 60, // Update token every hour
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: false, // Allow cookies over ngrok (https tunnels)
      },
    },
  },
  useSecureCookies: false, // Disable for ngrok compatibility
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: false,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Validate that the userType matches the user's actual role
        const userType = credentials.userType as string
        const isCompanyAdmin = user.role === "company_admin"

        if (userType === "company" && !isCompanyAdmin) {
          throw new Error("WRONG_ACCOUNT_TYPE_USE_EMPLOYEE")
        }

        if (userType === "employee" && isCompanyAdmin) {
          throw new Error("WRONG_ACCOUNT_TYPE_USE_ADMIN")
        }

        // Pass rememberMe preference along with user data
        const rememberMe = credentials.rememberMe === "true"

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          rememberMe,
          loginAt: Date.now(),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      // Initial sign in - store rememberMe preference and login time
      if (user) {
        return {
          ...token,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          rememberMe: user.rememberMe,
          loginAt: user.loginAt,
        }
      }

      // Subsequent requests - check if session should be expired
      if (token.loginAt) {
        const elapsed = Date.now() - token.loginAt
        const maxAge = token.rememberMe ? LONG_SESSION_MAX_AGE : SHORT_SESSION_MAX_AGE
        const maxAgeMs = maxAge * 1000

        // If session has exceeded its max age, return null to force re-login
        if (elapsed > maxAgeMs) {
          return null
        }
      }

      return token
    },
    async session({ session, token }: any) {
      // If token is null (expired), return null session
      if (!token) {
        return null
      }

      const result = {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          firstName: token.firstName,
          lastName: token.lastName,
        },
      }
      return result
    },
  },
}
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "./db"

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
        userType: { label: "User Type", type: "text" }
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

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        return {
          ...token,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      }
      return token
    },
    async session({ session, token }: any) {
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
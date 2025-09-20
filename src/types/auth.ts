import { User } from "@prisma/client"

export interface AuthUser extends Omit<User, 'password' | 'resetToken' | 'resetExpires'> {
  // Extend user type for frontend use
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: 'company' | 'employee'
  companyName?: string // For company admin signup
  companyDomain?: string // For company admin signup
}

export interface SignInData {
  email: string
  password: string
  userType: 'company' | 'employee'
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      firstName?: string | null
      lastName?: string | null
      role: string
      avatarUrl?: string | null
    }
  }

  interface User {
    firstName?: string | null
    lastName?: string | null
    role: string
    avatarUrl?: string | null
  }
}
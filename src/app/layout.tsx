import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WorkLedger - Corporate Skill Certification Platform',
  description: 'Enterprise platform for tracking employee skill development and generating verified digital certificates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
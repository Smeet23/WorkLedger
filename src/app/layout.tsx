import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/toaster'
import { AppErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WorkLedger - Employee Management Platform',
  description: 'Enterprise platform for tracking employee performance, skills, and work activities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <AppErrorBoundary>
          <AuthSessionProvider>
            {children}
            <Toaster />
          </AuthSessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  )
}
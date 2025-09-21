"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { logError } from '@/lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: number[] = []

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate unique error ID for tracking
    const errorId = this.state.errorId || `error_${Date.now()}`

    // Log the error
    logError(error, {
      operation: 'react_error_boundary',
      errorBoundaryLevel: this.props.level || 'component',
      errorId,
      componentStack: errorInfo.componentStack,
      errorStack: error.stack,
    })

    // Update state with error info
    this.setState({
      errorInfo,
      errorId,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to external error tracking service
    this.reportToExternalService(error, errorInfo, errorId)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(clearTimeout)
  }

  private reportToExternalService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // TODO: Integrate with external error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // For now, just log to console in production
      console.error('Error Boundary caught an error:', {
        errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  private retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private delayedRetry = (delay: number = 1000) => {
    const timeout = window.setTimeout(this.retry, delay)
    this.retryTimeouts.push(timeout)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry)
      }

      // Default fallback based on error boundary level
      switch (this.props.level) {
        case 'critical':
          return <CriticalErrorFallback error={this.state.error} retry={this.retry} />

        case 'page':
          return (
            <PageErrorFallback
              error={this.state.error}
              errorId={this.state.errorId}
              retry={this.retry}
            />
          )

        case 'component':
        default:
          return (
            <ComponentErrorFallback
              error={this.state.error}
              retry={this.retry}
              delayedRetry={() => this.delayedRetry()}
            />
          )
      }
    }

    return this.props.children
  }
}

// Critical Error Fallback (for app-level errors)
function CriticalErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Application Error</CardTitle>
          <CardDescription>
            WorkLedger encountered a critical error and needs to restart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded border">
            <p className="font-medium mb-1">Error Details:</p>
            <p className="font-mono text-xs break-all">{error.message}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={retry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Application
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Home Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Page Error Fallback (for page-level errors)
function PageErrorFallback({
  error,
  errorId,
  retry,
}: {
  error: Error
  errorId?: string
  retry: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600">
            We encountered an error while loading this page. Our team has been notified.
          </p>
        </div>

        <Card className="text-left mb-6">
          <CardContent className="pt-6">
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-2">Error Information:</p>
              <div className="bg-gray-100 p-3 rounded border font-mono text-xs">
                <p className="break-all">{error.message}</p>
                {errorId && (
                  <p className="text-gray-500 mt-2">Error ID: {errorId}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={retry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Component Error Fallback (for component-level errors)
function ComponentErrorFallback({
  error,
  retry,
  delayedRetry,
}: {
  error: Error
  retry: () => void
  delayedRetry: () => void
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-900">Component Error</h3>
            <p className="text-sm text-red-700 mt-1">
              This component failed to load properly.
            </p>
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Show error details
              </summary>
              <div className="mt-2 text-xs font-mono text-red-600 bg-red-100 p-2 rounded border">
                {error.message}
              </div>
            </details>
            <div className="flex space-x-2 mt-3">
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              <Button size="sm" variant="ghost" onClick={delayedRetry}>
                Auto Retry
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for handling async errors in components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    logError(error, {
      operation: 'async_component_error',
      componentStack: errorInfo?.componentStack,
    })

    // TODO: Report to external error tracking service
    if (process.env.NODE_ENV === 'production') {
      console.error('Async error caught:', error)
    }
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Specific error boundaries for different parts of the app
export const AppErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="critical">{children}</ErrorBoundary>
)

export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="page">{children}</ErrorBoundary>
)

export const ComponentErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="component">{children}</ErrorBoundary>
)

// Error fallback for Suspense boundaries
export function SuspenseErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-red-600">
            <Bug className="w-5 h-5 mr-2" />
            Loading Error
          </CardTitle>
          <CardDescription>
            Failed to load this content. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
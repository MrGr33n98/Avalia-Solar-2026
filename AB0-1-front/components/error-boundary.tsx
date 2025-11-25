'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Oops! Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada
                e estamos trabalhando para resolver o problema.
              </p>
            </div>

            {this.props.showDetails && this.state.error && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <p className="text-sm font-mono text-destructive break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Voltar para Home
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based Error Boundary wrapper for functional components
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   return (
 *     <ErrorBoundaryWrapper>
 *       <YourComponent />
 *     </ErrorBoundaryWrapper>
 *   )
 * }
 * ```
 */
export function ErrorBoundaryWrapper({ 
  children, 
  ...props 
}: Omit<Props, 'children'> & { children: ReactNode }) {
  return <ErrorBoundary {...props}>{children}</ErrorBoundary>
}

export default ErrorBoundary

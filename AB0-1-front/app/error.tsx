'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

/**
 * Global Error Page
 * 
 * This is a Next.js 13+ error boundary that catches errors in the root layout.
 * It's automatically used by Next.js when an error occurs.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console
    console.error('Global Error:', error)

    // Report to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
    })
  }, [error])

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

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <p className="text-sm font-mono text-destructive break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 text-muted-foreground">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
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

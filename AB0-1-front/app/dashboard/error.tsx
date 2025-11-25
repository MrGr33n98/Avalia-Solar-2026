'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

/**
 * Dashboard Error Boundary
 * 
 * Handles errors specific to the dashboard route.
 * Provides dashboard-specific recovery options.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)

    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'dashboard',
        route: '/dashboard',
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
            Erro no Dashboard
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro ao carregar o dashboard. Tente recarregar
            ou volte para a página inicial.
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
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar Dashboard
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Ir para Home
            </Button>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Problemas comuns:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Verifique sua conexão com a internet</li>
            <li>• Tente fazer logout e login novamente</li>
            <li>• Limpe o cache do navegador</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

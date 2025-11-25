'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home, FolderTree } from 'lucide-react'
import Link from 'next/link'

/**
 * Categories Error Boundary
 * 
 * Handles errors specific to the categories route.
 */
export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Categories Error:', error)

    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'categories',
        route: '/categories',
      },
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <FolderTree className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Erro ao Carregar Categorias
          </h1>
          <p className="text-muted-foreground">
            Não foi possível carregar as categorias. Por favor, tente novamente.
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
            Tentar Novamente
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

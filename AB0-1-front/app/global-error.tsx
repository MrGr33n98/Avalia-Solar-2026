'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Global Error Handler
 * 
 * This catches errors in the root layout (including errors in error.tsx).
 * It must define its own <html> and <body> tags.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Critical Global Error:', error)
    
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global-critical',
      },
      level: 'fatal',
    })
  }, [error])

  return (
    <html lang="pt-BR" className={`${inter.className} light`}>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                backgroundColor: '#fee2e2',
                borderRadius: '9999px',
                padding: '1.5rem',
              }}>
                <svg
                  style={{ width: '3rem', height: '3rem', color: '#dc2626' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              Erro Crítico
            </h1>

            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              Ocorreu um erro crítico na aplicação. Por favor, recarregue a página
              ou entre em contato com o suporte se o problema persistir.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: '#dc2626',
                  wordBreak: 'break-word',
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={reset}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

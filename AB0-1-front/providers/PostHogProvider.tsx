'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'

// Inicializa de forma síncrona (fora do componente) para garantir
// que o posthog esteja pronto antes de qualquer captura de evento.
if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host: '/ingest', // proxy reverso via next.config.js (evita ad-blockers)
      ui_host: host,
      defaults: '2026-01-30',
      person_profiles: 'identified_only',
      capture_pageview: false,     // Controlado manualmente abaixo
      capture_pageleave: true,     // Rastreia saída de página
      autocapture: false,          // Sem autocaptura para reduzir ruído
      session_recording: {
        maskAllInputs: true,       // Protege dados sensíveis
      },
      loaded: (ph) => {
        // Vincular sessão do PostHog ao Sentry para correlação de erros
        const sessionId = ph.get_session_id()
        if (sessionId) {
          Sentry.setTag('posthog_session_id', sessionId)
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Inicializado com sucesso. Distinct ID:', ph.get_distinct_id())
        }
      },
    })
  }
}

// Rastreia mudanças de rota no App Router do Next.js
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()
  // Controla se é o primeiro render para evitar dupla captura
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!ph || !pathname) return

    // No primeiro render, aguarda o posthog carregar completamente
    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    const url = searchParams.toString()
      ? `${window.origin}${pathname}?${searchParams.toString()}`
      : `${window.origin}${pathname}`

    ph.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

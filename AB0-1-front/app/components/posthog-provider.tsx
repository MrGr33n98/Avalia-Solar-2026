'use client'

import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    if (!key || typeof window === 'undefined') return

    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
          phone: true,
          number: true,
        },
        maskTextSelector: '[data-posthog-mask="true"]',
      },
      autocapture: {
        dom_event_allowlist: ['click', 'change', 'submit'],
        element_attribute_allowlist: ['data-posthog-event', 'data-posthog-value'],
      },
      loaded: (ph) => {
        ph.onFeatureFlags(() => {
          // Feature flags loaded
        })
        setLoaded(true)
      },
    })
  }, [])

  if (!loaded) return <>{children}</>

  return <PHProvider client={posthog}>{children}</PHProvider>
}

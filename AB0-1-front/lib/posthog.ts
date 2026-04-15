import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

// ── Config ───────────────────────────────────────────────────────────
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

// ── Initialize ───────────────────────────────────────────────────────
let initialized = false

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  if (!POSTHOG_KEY) {
    console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set')
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true,
        phone: true,
        number: true,
      },
      maskTextSelector: '[data-posthog-mask="true"]',
      recordCrossOriginIframes: false,
    },
    loaded: (ph) => {
      // Feature flags
      ph.onFeatureFlags(() => {
        const wizardVersion = ph.getFeatureFlag('wizard_version')
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Feature flags loaded', { wizardVersion })
        }
      })
    },
    // Performance
    bootstrap: {},
    persistence: 'localStorage',
    cross_subdomain_cookie: false,
  })

  initialized = true
}

// ── React Hook ───────────────────────────────────────────────────────
export function usePostHog() {
  useEffect(() => {
    initPostHog()
  }, [])
  return posthog
}

// ── Identify ─────────────────────────────────────────────────────────
export function identifyUser(data: {
  leadId: string | number
  email?: string
  city?: string
  state?: string
  vertical?: string
}) {
  if (typeof window === 'undefined') return

  posthog.identify(String(data.leadId), {
    email: data.email,
    city: data.city,
    state: data.state,
    vertical: data.vertical,
  })

  // Group by city
  if (data.city) {
    posthog.group('city', data.city, {
      name: data.city,
      state: data.state,
    })
  }

  // Group by vertical
  if (data.vertical) {
    posthog.group('vertical', data.vertical)
  }
}

// ── Custom Events ────────────────────────────────────────────────────
export const posthogEvents = {
  wizard: {
    start(props?: Record<string, unknown>) {
      posthog.capture('wizard_start', props)
    },
    roiExpand(props: {
      city?: string
      state?: string
      energy_bill?: number
      estimated_savings?: number
      payback_years?: number
    }) {
      posthog.capture('roi_expand', props)
    },
    complete(props: {
      city?: string
      state?: string
      energy_bill?: number
      vertical?: string
      category?: string
      steps_completed?: number
      time_spent_seconds?: number
      utm_source?: string
      utm_campaign?: string
    }) {
      posthog.capture('wizard_complete', props)
    },
    abandon(props: {
      step: number
      city?: string
      time_spent_seconds?: number
    }) {
      posthog.capture('wizard_abandon', props)
    },
  },

  ev: {
    start(props?: Record<string, unknown>) {
      posthog.capture('ev_calc_start', props)
    },
    wallboxConfig(props: {
      vehicle_type?: string
      daily_km?: number
      charging_location?: string
    }) {
      posthog.capture('wallbox_config', props)
    },
    savingsShow(props: {
      monthly_savings?: number
      cost_per_km_fuel?: number
      cost_per_km_electric?: number
    }) {
      posthog.capture('savings_show', props)
    },
    complete(props: Record<string, unknown>) {
      posthog.capture('ev_calc_complete', props)
    },
  },

  engagement: {
    whatsappClick(props: {
      city?: string
      lead_id?: string | number
      company_id?: string | number
      intent_score?: number
    }) {
      posthog.capture('whatsapp_click', props)
    },
    compareView(props: {
      companies_compared?: number
      city?: string
    }) {
      posthog.capture('compare_view', props)
    },
    reviewViewed(props: {
      company_id?: string | number
      city?: string
      rating?: number
    }) {
      posthog.capture('review_viewed', props)
    },
    trustBadgeClick(props: {
      company_id?: string | number
      trust_score?: number
    }) {
      posthog.capture('trust_badge_clicked', props)
    },
    installerProfileVisited(props: {
      company_id?: string | number
      city?: string
      trust_score?: number
    }) {
      posthog.capture('installer_profile_visited', props)
    },
  },

  lead: {
    created(props: {
      lead_id?: string | number
      city?: string
      vertical?: string
      energy_bill?: number
      utm_source?: string
      utm_campaign?: string
    }) {
      posthog.capture('lead_created', props)
    },
  },

  content: {
    postView(props: {
      post_id?: string
      channel?: string
      topic?: string
    }) {
      posthog.capture('content_view', props)
    },
    ctaClick(props: {
      cta_text?: string
      page_url?: string
      utm_campaign?: string
    }) {
      posthog.capture('cta_click', props)
    },
  },
}

// ── Feature Flags ────────────────────────────────────────────────────
export const featureFlags = {
  get wizardVersion() {
    return posthog.getFeatureFlag('wizard_version') as 'v1' | 'v2' | null
  },
  get ctaCopy() {
    return posthog.getFeatureFlag('cta_copy_variant') as 'whatsapp' | 'proposal' | null
  },
  get showTrustBadge() {
    return posthog.getFeatureFlag('show_trust_badge') as boolean | null
  },
  get evCalculator() {
    return posthog.getFeatureFlag('ev_calculator_enabled') as boolean | null
  },
  get landingLayout() {
    return posthog.getFeatureFlag('landing_layout') as 'default' | 'compact' | 'visual' | null
  },
  isFlagEnabled(flag: string) {
    return !!posthog.isFeatureEnabled(flag)
  },
}

// ── Exports ──────────────────────────────────────────────────────────
export { posthog, PostHogProvider }
export default posthog

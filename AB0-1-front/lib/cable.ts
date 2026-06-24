import { createConsumer, Cable } from '@rails/actioncable'
import { getApiOrigin } from './api-config'
import { getRealtimeAuthToken } from './realtime-auth'

type DashboardMessage = {
  type: string
  source?: string
  company_id: number
  tracked_at: string
  meta?: Record<string, any>
  counters?: {
    events_count?: number
    quote_clicks?: number
    whatsapp_clicks?: number
    reviews_count?: number
    average_rating?: number
    rating_count?: number
  }
}

let consumer: Cable | null = null
const PROD_API_ORIGIN = 'https://api.avaliasolar.com.br'

function isLocalHostUrl(url: string): boolean {
  return /(^|:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
}

function shouldForcePublicApiOrigin(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV !== 'production') return false
  return !['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function sanitizeOrigin(origin: string): string {
  const trimmed = (origin || '').trim()
  if (!trimmed) return ''
  if (shouldForcePublicApiOrigin() && isLocalHostUrl(trimmed)) {
    return PROD_API_ORIGIN
  }
  return trimmed
}

function ensureCablePath(url: string): string {
  const normalized = url.replace(/\/+$/, '')
  if (normalized.endsWith('/cable')) return normalized
  return `${normalized}/cable`
}

function toWsOrigin(origin: string): string {
  if (!origin) return ''
  if (origin.startsWith('wss://') || origin.startsWith('ws://')) return origin
  if (origin.startsWith('https://')) return origin.replace('https://', 'wss://')
  if (origin.startsWith('http://')) return origin.replace('http://', 'ws://')
  return `wss://${origin.replace(/^\/+/, '')}`
}

function appendQueryParam(url: string, key: string, value: string | null) {
  if (!value) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

export function resolveCableUrl(): string {
  const envUrl = sanitizeOrigin(process.env.NEXT_PUBLIC_CABLE_URL || '')
  const token = getRealtimeAuthToken()
  if (envUrl) return appendQueryParam(ensureCablePath(envUrl), 'token', token)

  const apiOrigin = sanitizeOrigin(getApiOrigin())
  if (apiOrigin) return appendQueryParam(ensureCablePath(toWsOrigin(apiOrigin)), 'token', token)

  if (process.env.NODE_ENV === 'production') {
    return appendQueryParam(ensureCablePath(toWsOrigin(PROD_API_ORIGIN)), 'token', token)
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return appendQueryParam(ensureCablePath(toWsOrigin(window.location.origin)), 'token', token)
  }

  return appendQueryParam('ws://localhost:3001/cable', 'token', token)
}

function isRealtimeEnabled(): boolean {
  const realtimeFlag = process.env.NEXT_PUBLIC_ENABLE_REALTIME_DASHBOARD
  if (realtimeFlag === 'true') return true
  if (realtimeFlag === 'false') return false

  if (typeof window === 'undefined') return false

  // Keep local development zero-config, but require explicit opt-in in production.
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

export function getConsumer() {
  if (!isRealtimeEnabled()) return null
  if (consumer) return consumer
  const url = resolveCableUrl()
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[ActionCable] Using URL', url)
  }
  consumer = createConsumer(url)
  return consumer
}

export function subscribeCompanyDashboard(
  companyId: string | number,
  onMessage: (msg: DashboardMessage) => void,
  onStatus?: (status: 'connected' | 'disconnected') => void
) {
  const c = getConsumer()
  if (!c) {
    onStatus?.('disconnected')
    return {
      unsubscribe: () => {},
    }
  }

  const subscription = c.subscriptions.create(
    { channel: 'CompanyDashboardChannel', company_id: Number(companyId) },
    {
      connected() {
        onStatus?.('connected')
      },
      disconnected() {
        onStatus?.('disconnected')
      },
      received(data: any) {
        onMessage(data as DashboardMessage)
      },
    }
  )
  return {
    unsubscribe: () => c.subscriptions.remove(subscription),
  }
}

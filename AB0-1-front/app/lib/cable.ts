import { createConsumer, Cable } from '@rails/actioncable'
import { getApiOrigin } from '@/lib/api-config'

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

function resolveCableUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_CABLE_URL?.trim()
  if (envUrl) return ensureCablePath(envUrl)

  const apiOrigin = getApiOrigin()
  if (apiOrigin) return ensureCablePath(toWsOrigin(apiOrigin))

  if (typeof window !== 'undefined' && window.location?.origin) {
    return ensureCablePath(toWsOrigin(window.location.origin))
  }

  return 'ws://localhost:3001/cable'
}

export function getConsumer() {
  if (consumer) return consumer
  const url = resolveCableUrl()
  consumer = createConsumer(url)
  return consumer
}

export function subscribeCompanyDashboard(
  companyId: number,
  onMessage: (msg: DashboardMessage) => void,
  onStatus?: (status: 'connected' | 'disconnected') => void
) {
  const c = getConsumer()
  const subscription = c.subscriptions.create(
    { channel: 'CompanyDashboardChannel', company_id: companyId },
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

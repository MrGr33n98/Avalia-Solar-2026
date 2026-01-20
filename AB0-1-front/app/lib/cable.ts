import { createConsumer, Cable } from '@rails/actioncable'

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

export function getConsumer() {
  if (consumer) return consumer
  const url = process.env.NEXT_PUBLIC_CABLE_URL || 'ws://localhost:3001/cable'
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

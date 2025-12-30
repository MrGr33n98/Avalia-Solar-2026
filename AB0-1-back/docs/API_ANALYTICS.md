# API de Analytics em Tempo Real

## Endpoints REST
- `GET /api/v1/dashboard/stats` – métricas resumidas do dashboard
- `GET /api/v1/dashboard/export` – exporta CSV
  - Params: `company_id`, `kind=events|daily_stats`, `from`, `to`
- `GET /api/v1/companies/:id/analytics/historical` – histórico existente

## Export Dedicado
- `GET /api/v1/dashboard_exports/events?company_id=:id&from=:from&to=:to`
- `GET /api/v1/dashboard_exports/daily_stats?company_id=:id&from=:from&to=:to`

## WebSocket (ActionCable)
- Canal: `CompanyDashboardChannel`
- Stream: `company:#{company_id}:dashboard`
- Mensagem:
```json
{
  "type": "quote_click",
  "source": "company_card",
  "company_id": 123,
  "tracked_at": "2025-12-30T12:00:00Z",
  "meta": { "utm_source": "organic" },
  "counters": {
    "events_count": 10,
    "quote_clicks": 4,
    "whatsapp_clicks": 3,
    "reviews_count": 2,
    "average_rating": 4.6,
    "rating_count": 8
  }
}
```

## Frontend (Next.js)
- Cliente: `@rails/actioncable`
- Uso:
```ts
import { subscribeCompanyDashboard } from '@/app/lib/cable'

const sub = subscribeCompanyDashboard(companyId, (msg) => {
  // atualizar estado do dashboard
})

// sub.unsubscribe() para sair
```

## Observabilidade
- Yabeda counters: `ab0_analytics_events_total{event_type}`
- Job diário: `AnalyticsDailyAggregationJob` agrega dia anterior

## Segurança
- Autorização via `DashboardPolicy` e `ReviewPolicy`
- Sanitização de `metadata` (chaves permitidas)

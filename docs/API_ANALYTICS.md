# API — Analytics (v1)

Este documento descreve o contrato de tracking, histórico e realtime do dashboard.

## Autenticação
- Header: `Authorization: Bearer <JWT>`

---

## POST `/api/v1/analytics/track`
Persiste um evento e atualiza agregados (CompanyDailyStat) e counters quentes (companies.*_count). Também faz broadcast via ActionCable.

### Body
```json
{
  "company_id": 123,
  "event_type": "profile_view",
  "metadata": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer",
    "referrer": "https://google.com",
    "path": "/companies/123"
  }
}
```

### Event types suportados (principais)
- `profile_view`
- `cta_click`
- `whatsapp_click`
- `lead_created`
- `review_created`

Aliases aceitos (mapeados no controller):
- `view` → `profile_view`
- `click` → `cta_click`
- `lead` → `lead_created`
- `review` → `review_created`

### Response
```json
{ "status": "success" }
```

---

## GET `/api/v1/companies/:id/analytics/historical?days=30`
Retorna série diária baseada em `company_daily_stats`.

### Response
```json
{
  "data": [
    { "date": "2025-12-01", "views": 10, "clicks": 2, "leads": 1, "conversion": 10.0 }
  ]
}
```

---

## GET `/api/v1/companies/:id/analytics/traffic?days=30`
Origem por `utm_source` (preferencial) ou heurística por `referrer`.

### Response
```json
{
  "sources": [
    { "source": "google", "visits": 120, "percentage": 55.2, "conversion_rate": 3.4 }
  ]
}
```

---

## Realtime — ActionCable
### WS URL
- `ws://<API_ORIGIN>/cable?token=<JWT>` (dev)
- `wss://<API_ORIGIN>/cable?token=<JWT>` (prod)

### Subscribe
Channel: `CompanyDashboardChannel`
Identifier:
```json
{ "channel": "CompanyDashboardChannel", "company_id": 123 }
```

### Mensagens
Exemplo:
```json
{
  "type": "analytics_event",
  "event_type": "profile_view",
  "tracked_at": "2025-12-30T03:00:00Z",
  "company_id": 123
}
```

---

## Observabilidade
Métricas Prometheus em `/metrics`:
- `ab0_analytics_events_total{event_type="..."}`
- `ab0_company_views_total{company_id="..."}`

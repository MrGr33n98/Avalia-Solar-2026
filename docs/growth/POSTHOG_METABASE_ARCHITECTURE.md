# AvaliaSolar — PostHog + Metabase + Nutshell Architecture

> **PostHog como Product Analytics · Metabase como BI · Nutshell como CRM · n8n como Orquestrador**
> Date: 2026-04-15 · Status: Implementation Ready

---

## 🏗️ Arquitetura Final

```
┌──────────────────────────────────────────────────────────────────────┐
│                      AVALIASOLAR GROWTH STACK                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND (Next.js)                         │    │
│  │  • PostHog JS (auto-capture + custom events)                 │    │
│  │  • Session replay (com masking LGPD)                         │    │
│  │  • Feature flags (A/B testing)                               │    │
│  │  • Funnels: wizard, calculadora EV, review flow              │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
│                         │                                            │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    POSTHOG (Product Analytics)                │    │
│  │                                                                │    │
│  │  📊 Eventos: pageview, roi_expand, wizard_*, whatsapp_click   │    │
│  │  🎬 Session replay: wizard, calculadora, dashboard            │    │
│  │  🚩 Feature flags: wizard_v2, cta_copy, trust_badge           │    │
│  │  👥 Cohorts: por cidade, vertical, comportamento              │    │
│  │  📈 Funnels: conversion rates por step                        │    │
│  │                                                                │    │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │    │
│  │  │ Webhook → n8n   │  │ Export Pipeline → PostgreSQL     │   │    │
│  │  │ (triggers)      │  │ (materialized views → Metabase)  │   │    │
│  │  └────────┬────────┘  └──────────────┬───────────────────┘   │    │
│  └───────────┼──────────────────────────┼───────────────────────┘    │
│              │                          │                             │
│              ▼                          ▼                             │
│  ┌───────────────────────┐  ┌──────────────────────────┐            │
│  │  n8n (Orquestrador)   │  │  Metabase (BI/Reporting) │            │
│  │                        │  │                           │            │
│  │  WF-026: PostHog Hook │  │  Dashboards:              │            │
│  │  WF-031: Intent Detect│  │  • Growth Command         │            │
│  │  WF-023: Lead Engine  │  │  • Content Performance    │            │
│  │  WF-030: WhatsApp     │  │  • Funnel Analysis        │            │
│  │  WF-025: Demand Notify│  │  • City Performance       │            │
│  │  WF-018: News Coll    │  │  • Channel ROI            │            │
│  │  WF-020: Content AI   │  │  • Lead Quality           │            │
│  │  WF-008: Daily Digest │  │                           │            │
│  │  WF-004: Follow-Up    │  │  (lê PostgreSQL views)    │            │
│  │  WF-006: Stalled      │  │                           │            │
│  │  WF-014: Churn        │  │                           │            │
│  └────────┬──────────────┘  └──────────────▲───────────┘            │
│           │                                │                         │
│           ▼                                │                         │
│  ┌───────────────────────┐                 │                         │
│  │  Nutshell CRM         │                 │                         │
│  │  (JSON-RPC API)       │                 │                         │
│  │                        │                 │                         │
│  │  • Contacts (leads)   │                 │                         │
│  │  • Leads (deals)      │                 │                         │
│  │  • Activities         │                 │                         │
│  │  • Tasks              │                 │                         │
│  │  • Custom Fields      │                 │                         │
│  └────────┬──────────────┘                 │                         │
│           │                                │                         │
│           ▼                                │                         │
│  ┌───────────────────────┐                 │                         │
│  │  PostgreSQL (Rails)   │◄────────────────┘                         │
│  │                        │                                          │
│  │  • Companies          │  ← Metabase lê daqui                     │
│  │  • Reviews            │  ← n8n escreve aqui                      │
│  │  • analytics_events   │  ← PostHog export → aqui                 │
│  │  • intent_signals     │  ← n8n calcula aqui                      │
│  │  • news_articles      │  ← n8n escreve aqui                      │
│  │  • content            │  ← n8n escreve aqui                      │
│  │  • whatsapp_messages  │  ← n8n escreve aqui                      │
│  │  • demand_notif       │  ← n8n escreve aqui                      │
│  │  • growth_insights    │  ← n8n escreve aqui                      │
│  │  • daily_summaries    │  ← n8n escreve aqui                      │
│  │                        │                                          │
│  └───────────────────────┘                                          │
│                                                                       │
│  CANAIS DE SAÍDA:                                                     │
│  • WhatsApp (Evolution API) ← WF-030                                 │
│  • LinkedIn, Instagram, X ← WF-021                                   │
│  • Slack (alerts, digests)                                           │
│  • Telegram (briefs, alerts)                                         │
│                                                                       │
│  AI: OpenAI (GPT-4o para conteúdo, GPT-4o-mini para classificação)   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados Principal

```
1. USUÁRIO NAVEGA NO SITE
   ↓
   PostHog auto-capture: pageview, click, scroll
   PostHog custom events: roi_expand, wizard_start, wizard_complete
   PostHog identify: lead_id, city, vertical (após wizard)
   PostHog session replay: grava sessão do wizard

2. POSTHOG PROCESSA
   ↓
   Funnel: wizard_start (100%) → roi_expand (65%) → wizard_complete (42%) → lead_created (28%)
   Cohort: "Usuários de Florianópolis que expandiram ROI mas não completaram"
   Feature flag: wizard_v2 para 50% dos usuários

3. POSTHOG → n8n (Webhook para triggers)
   ↓
   Evento: wizard_complete com city=Florianópolis
   → n8n WF-023: Cria lead no Nutshell
   → n8n WF-031: Atualiza intent score
   → Se intent ≥ 50: WF-025 → WhatsApp + Slack

4. POSTHOG → PostgreSQL (Export Pipeline)
   ↓
   Eventos agregados → materialized views → Metabase lê

5. METABASE (BI)
   ↓
   Dashboards consolidados:
   • Growth Command (visão geral)
   • Funnel Analysis (conversão por step)
   • City Performance (ranking por cidade)
   • Content ROI (qual conteúdo gera leads)
   • Channel Performance (LinkedIn vs Instagram vs X)

6. NUTSHELL (CRM)
   ↓
   Lead criado → Activities → Tasks → Deals
   n8n lê Nutshell para: follow-up, stalled deals, daily digest
```

---

## 🔧 PostHog Config

### Events Schema

```javascript
// lib/posthog.js (Next.js)
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  session_recording: {
    maskAllInputs: true,
    maskInputOptions: {
      password: true,
      email: true,
      phone: true,
      number: true,
    },
  },
  autocapture: {
    dom_event_allowlist: ['click', 'change', 'submit'],
    element_attribute_allowlist: ['data-posthog-event', 'data-posthog-value'],
  },
  capture_pageview: true,
  loaded: (ph) => {
    // Feature flags loaded
    ph.onFeatureFlags(() => {
      const wizardVersion = ph.getFeatureFlag('wizard_version')
      if (wizardVersion === 'v2') {
        // Load v2 wizard
      }
    })
  }
})

export default posthog
```

### Custom Events

```javascript
// components/wizard/WizardStep.jsx
function handleROICalculate(data) {
  posthog.capture('roi_expand', {
    city: data.city,
    state: data.state,
    energy_bill: data.monthlyBill,
    estimated_savings: data.estimatedSavings,
    payback_years: data.paybackYears,
    vertical: 'solar',
  })
}

function handleWizardComplete(data) {
  posthog.capture('wizard_complete', {
    city: data.city,
    state: data.state,
    energy_bill: data.monthlyBill,
    vertical: data.vertical,
    category: data.category,
    steps_completed: data.stepsCompleted,
    time_spent_seconds: data.timeSpent,
    utm_source: data.utmSource,
    utm_campaign: data.utmCampaign,
  })

  // Identify user after lead creation
  if (data.leadId) {
    posthog.identify(String(data.leadId), {
      email: data.email,
      city: data.city,
      state: data.state,
      vertical: data.vertical,
      energy_bill: data.monthlyBill,
    })

    // Group by city
    posthog.group('city', data.city, {
      name: data.city,
      state: data.state,
      vertical: data.vertical,
    })

    // Group by vertical
    posthog.group('vertical', data.vertical, {
      name: data.vertical === 'solar' ? 'Energia Solar' : 'Mobilidade Elétrica',
    })
  }
}

function handleWhatsAppClick(data) {
  posthog.capture('whatsapp_click', {
    city: data.city,
    lead_id: data.leadId,
    company_id: data.companyId,
    intent_score: data.intentScore,
  })
}

function handleEVCalcComplete(data) {
  posthog.capture('ev_calc_complete', {
    city: data.city,
    vehicle_type: data.vehicleType,
    daily_km: data.dailyKm,
    current_fuel_cost: data.currentFuelCost,
    ev_charging_cost: data.evChargingCost,
    monthly_savings: data.monthlySavings,
  })
}
```

### Rails Server-Side Events

```ruby
# lib/posthog_client.rb
require 'posthog-ruby'

class PosthogClient
  def self.client
    @client ||= PostHog::Client.new(
      api_key: ENV['POSTHOG_API_KEY'],
      host: ENV['POSTHOG_HOST'] || 'https://app.posthog.com'
    )
  end

  def self.capture(distinct_id:, event:, properties: {})
    client.capture(
      distinct_id: distinct_id,
      event: event,
      properties: properties
    )
  end

  def self.identify(lead_id:, email:, city:, state:, vertical:)
    client.identify(
      distinct_id: lead_id.to_s,
      properties: {
        email: email,
        city: city,
        state: state,
        vertical: vertical,
      }
    )
  end
end

# app/controllers/api/v1/leads_controller.rb
def create
  @lead = Lead.new(lead_params)
  if @lead.save
    # Server-side event
    PosthogClient.capture(
      distinct_id: session[:posthog_distinct_id] || @lead.id.to_s,
      event: 'lead_created',
      properties: {
        lead_id: @lead.id,
        city: @lead.city,
        state: @lead.state,
        vertical: @lead.product_vertical,
        category: @lead.category,
        energy_bill: @lead.energy_bill,
        utm_source: @lead.utm_source,
        utm_campaign: @lead.utm_campaign,
      }
    )
    render json: @lead, status: :created
  end
end
```

---

## 📋 PostHog Webhook → n8n

### Configuração no PostHog

Settings → Webhooks → Add webhook:

```
URL: https://n8n.avaliasolar.com.br/webhook/posthog-event
Headers:
  Authorization: Bearer SEU_WEBHOOK_SECRET
  Content-Type: application/json

Events to send:
  ☑ wizard_complete
  ☑ roi_expand
  ☑ whatsapp_click
  ☑ lead_created
  ☑ ev_calc_complete
  ☑ review_submitted
```

### n8n Webhook Handler (WF-026)

O WF-026 recebe o webhook do PostHog, valida, e dispara os workflows downstream.

---

## 📊 Metabase Dashboards

### Dashboard 1: Growth Command

```sql
-- daily_growth view (para Metabase)
CREATE OR REPLACE VIEW v_daily_growth AS
SELECT
  DATE(ae.created_at) as date,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand') as roi_expands,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start') as wizard_starts,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as wizard_completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'whatsapp_click') as whatsapp_clicks,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads_created,
  -- Funnel rates
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start'), 0) * 100, 1
  ) as roi_expand_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand'), 0) * 100, 1
  ) as wizard_complete_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete'), 0) * 100, 1
  ) as lead_creation_rate
FROM analytics_events ae
WHERE ae.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(ae.created_at)
ORDER BY date DESC;
```

### Dashboard 2: City Performance

```sql
CREATE OR REPLACE VIEW v_city_performance AS
SELECT
  ae.city,
  ae.state,
  ae.vertical,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  AVG(i.intent_score) as avg_intent_score,
  COUNT(DISTINCT i.session_id) FILTER (WHERE i.intent_level IN ('boiling', 'immediate', 'declared')) as high_intent_users
FROM analytics_events ae
LEFT JOIN intent_signals i ON i.session_id = ae.user_session_id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.city, ae.state, ae.vertical
ORDER BY leads DESC;
```

### Dashboard 3: Content ROI

```sql
CREATE OR REPLACE VIEW v_content_roi AS
SELECT
  ae.utm_campaign,
  ae.utm_source,
  ae.utm_medium,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  na.title as related_news,
  na.relevance_score
FROM analytics_events ae
LEFT JOIN news_articles na ON na.url = ae.referrer
WHERE ae.utm_campaign IS NOT NULL
  AND ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.utm_campaign, ae.utm_source, ae.utm_medium, na.title, na.relevance_score
ORDER BY leads DESC;
```

### Dashboard 4: Funnel Analysis

```sql
CREATE OR REPLACE VIEW v_funnel_analysis AS
WITH daily_funnel AS (
  SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_name = 'wizard_start') as step1_starts,
    COUNT(*) FILTER (WHERE event_name = 'roi_expand') as step2_expand,
    COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as step3_complete,
    COUNT(*) FILTER (WHERE event_name = 'lead_created') as step4_lead
  FROM analytics_events
  WHERE event_name IN ('wizard_start', 'roi_expand', 'wizard_complete', 'lead_created')
    AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY DATE(created_at)
)
SELECT
  date,
  step1_starts,
  step2_expand,
  step3_complete,
  step4_lead,
  ROUND(step2_expand::numeric / NULLIF(step1_starts, 0) * 100, 1) as step1_to_2_pct,
  ROUND(step3_complete::numeric / NULLIF(step2_expand, 0) * 100, 1) as step2_to_3_pct,
  ROUND(step4_lead::numeric / NULLIF(step3_complete, 0) * 100, 1) as step3_to_4_pct,
  ROUND(step4_lead::numeric / NULLIF(step1_starts, 0) * 100, 1) as overall_conversion_pct
FROM daily_funnel
ORDER BY date DESC;
```

### Dashboard 5: Channel Performance

```sql
CREATE OR REPLACE VIEW v_channel_performance AS
SELECT
  ae.utm_source as channel,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  COUNT(DISTINCT wm.id) as whatsapp_messages_sent,
  COUNT(DISTINCT i.session_id) FILTER (WHERE i.intent_level IN ('boiling', 'immediate', 'declared')) as high_intent_users
FROM analytics_events ae
LEFT JOIN whatsapp_messages wm ON wm.lead_id::text = ae.user_session_id
LEFT JOIN intent_signals i ON i.session_id = ae.user_session_id
WHERE ae.utm_source IS NOT NULL
  AND ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.utm_source
ORDER BY leads DESC;
```

---

## 🚀 Implementação Imediata (Hoje)

### Passo 1: PostHog Config (10 min)

```bash
# 1. Verificar PostHog JS no site
grep -r "posthog" AB0-1-front/app/layout.tsx

# 2. Se não existir, adicionar:
npm install posthog-js posthog-node
```

### Passo 2: DB Migrations (5 min)

```bash
cd AB0-1-back
rails generate migration CreateGrowthAnalyticsTables
```

### Passo 3: n8n Workflows (importar em ordem)

1. WF-026 (PostHog Webhook Handler)
2. WF-031 (Intent Detector)
3. WF-023 (Lead Engine → Nutshell)
4. WF-030 (WhatsApp Distributor)
5. WF-025 (Demand Notifier)
6. WF-018 (News Collector)
7. WF-008 (Daily Digest → Nutshell)

### Passo 4: Nutshell Custom Fields (5 min)

Criar 17 custom fields (ver NUTSHELL_INTEGRATION_GUIDE.md)

### Passo 5: Metabase Setup (15 min)

1. Conectar Metabase ao PostgreSQL (read-only user)
2. Criar as 5 views SQL
3. Criar 5 dashboards

### Passo 6: Nutshell API + n8n Credentials (10 min)

Configurar 7 credenciais no n8n

---

## 📋 PostHog Webhook Payload (exemplo)

```json
{
  "distinct_id": "user_abc123",
  "event": "wizard_complete",
  "properties": {
    "$current_url": "https://www.avaliasolar.com.br/wizard",
    "$city": "Florianópolis",
    "$region": "Santa Catarina",
    "$country_name": "Brazil",
    "city": "Florianópolis",
    "state": "SC",
    "energy_bill": 500,
    "vertical": "solar",
    "category": "residencial",
    "utm_source": "linkedin",
    "utm_campaign": "trust_scoreboard_fln",
    "time_spent_seconds": 120,
    "steps_completed": 5
  },
  "timestamp": "2026-04-15T14:30:00Z"
}
```

---

*Documento criado em 2026-04-15. Para a equipe de Growth Engineering do AvaliaSolar.*

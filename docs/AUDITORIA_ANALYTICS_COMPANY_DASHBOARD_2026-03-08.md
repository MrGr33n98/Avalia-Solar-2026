# 📊 Auditoria de Analytics - Dashboard de Empresas AB0-1/Avalia Solar

**Data:** 2026-03-08  
**Agente:** @avalia-solar-master  
**Skills Utilizadas:**
- `analytics-tracking`
- `kpi-dashboard-design`
- `observability-engineer`
- `data-engineering-data-pipeline`
- `mixpanel-automation`
- `google-analytics-automation`

---

## 📋 Sumário Executivo

### ✅ Status Atual
- **Tracking Implementado:** ✅ Parcial
- **Qualidade dos Dados:** ⚠️ Média (60/100)
- **Cobertura de Eventos:** ⚠️ Básica
- **Integridade de Métricas:** ✅ Alta
- **Decisão-Ready:** ⚠️ Limitado

### 🎯 Prioridade de Ação
**P0 - Crítico:** Eventos de conversão ausentes  
**P1 - Alto:** Falta de contexto UTM nos CTAs  
**P2 - Médio:** Analytics avançado sem tracking detalhado

---

## 🔍 Análise Detalhada

### 1. 📊 Measurement Readiness & Signal Quality Index

**Score Total: 60/100**

| Categoria | Score | Peso | Pontuação |
|-----------|-------|------|-----------|
| Decision Alignment | 18/25 | 25% | Boa |
| Event Model Clarity | 12/20 | 20% | Médio |
| Data Accuracy & Integrity | 16/20 | 20% | Boa |
| Conversion Definition Quality | 8/15 | 15% | Baixo ⚠️ |
| Attribution & Context | 4/10 | 10% | Baixo ⚠️ |
| Governance & Maintenance | 8/10 | 10% | Boa |

---

## 📈 Métricas Atuais no Dashboard

### ✅ Métricas Implementadas (Backend)

**Fonte:** `CompanyDashboard::MetricsSource` + `company_daily_stats` table

```ruby
# app/controllers/api/v1/company_dashboard_controller.rb
# app/services/company_dashboard/metrics_source.rb

{
  views_30d: Integer,              # ✅ Profile Views (últimos 30 dias)
  cta_clicks_30d: Integer,         # ✅ Total CTA Clicks
  whatsapp_clicks_30d: Integer,    # ✅ WhatsApp específico
  leads_30d: Integer,              # ✅ Leads recebidos
  conversion_rate: Float,          # ✅ Calculado: leads/views * 100
  
  # Adicionais do StatsService
  reviews_count: Integer,          # ✅ Total de reviews
  average_rating: Float,           # ✅ Rating médio
  pending_approvals: Integer,      # ✅ Items pendentes
  active_campaigns: Integer        # ✅ Campanhas ativas
}
```

### ⚠️ Métricas no Frontend (PerformanceMetrics.tsx)

**Problema:** Dados **simulados** ou **derivados** sem tracking real:

```typescript
// AB0-1-front/app/dashboard/components/PerformanceMetrics.tsx (linha 64-100)

const metrics: Metrics = {
  profileViews: {
    total: analyticsData?.views_30d || 0,  // ✅ Real
    trend: 0,                               // ❌ FAKE - sempre 0
    unique: Math.floor(views * 0.76),       // ❌ CALCULADO - não real
    returning: Math.floor(views * 0.24),    // ❌ CALCULADO - não real
  },
  ctaClicks: {
    total: analyticsData?.cta_clicks_30d || 0,  // ✅ Real
    trend: 0,                                    // ❌ FAKE
    byType: [
      { type: 'whatsapp', count: whatsapp },    // ✅ Real
      { type: 'email', count: Math.floor(...) },     // ❌ CALCULADO
      { type: 'phone', count: Math.floor(...) },     // ❌ CALCULADO
      { type: 'website', count: Math.floor(...) },   // ❌ CALCULADO
    ],
  },
  engagement: {
    avgTimeOnPage: 245,      // ❌ HARDCODED - não real
    bounceRate: 34,          // ❌ HARDCODED - não real
    pagesPerSession: 2.8,    // ❌ HARDCODED - não real
  },
  sources: [...]             // ❌ Não implementado
};
```

---

## 🚨 Problemas Críticos Identificados

### P0 - CRÍTICO

#### 1. ❌ Eventos de Conversão Não Rastreados

**Impacto:** Impossível medir eficácia real de CTAs individuais

**Missing:**
```typescript
// Quando empresa clica em "Solicitar Orçamento"
track('CTA Clicked', {
  cta_type: 'quote_request',
  cta_location: 'company_profile',
  company_id: companyId,
  user_id: userId,
  utm_source: utmSource,
  utm_medium: utmMedium,
  utm_campaign: utmCampaign
});

// Quando empresa envia email
track('Email CTA Clicked', {
  cta_type: 'email',
  company_id: companyId,
  ...
});

// Quando empresa liga
track('Phone CTA Clicked', {
  cta_type: 'phone',
  company_id: companyId,
  ...
});

// Quando empresa acessa website
track('Website CTA Clicked', {
  cta_type: 'website',
  company_id: companyId,
  ...
});
```

**Localização:** `AB0-1-front/app/companies/[id]/components/` (CTAs no perfil público)

---

#### 2. ❌ Métricas de Engajamento Hardcoded

**Impacto:** Dashboard mostra dados falsos, decisões baseadas em ficção

**Arquivo:** `PerformanceMetrics.tsx` linhas 98-100

```typescript
// ❌ REMOVER IMEDIATAMENTE
engagement: {
  avgTimeOnPage: 245,      // Fake
  bounceRate: 34,          // Fake
  pagesPerSession: 2.8,    // Fake
}
```

**Solução:**
- Integrar com GA4 Measurement Protocol
- Ou remover até ter dados reais
- Mostrar placeholder: "Dados indisponíveis - Configure GA4"

---

### P1 - ALTO

#### 3. ⚠️ Falta de Contexto UTM nos CTAs

**Impacto:** Impossível atribuir leads a campanhas/fontes

**Missing:**
```typescript
// Adicionar aos CTAs no perfil público
const ctaParams = new URLSearchParams({
  utm_source: 'avaliasolar',
  utm_medium: 'company_profile',
  utm_campaign: campaign || 'organic',
  utm_content: ctaType,
  company_id: companyId
});
```

**Benefício:** Permite análise de ROI por canal

---

#### 4. ⚠️ Breakdown de CTA Types Calculado

**Problema:** Email/Phone/Website são **estimativas**, não dados reais

**Arquivo:** `PerformanceMetrics.tsx` linhas 80-95

```typescript
// ❌ ATUAL - Calcula 50/30/20 do resto
byType: [
  { type: 'whatsapp', count: real },           // ✅ OK
  { type: 'email', count: (total - wa) * 0.5 },    // ❌ Fake
  { type: 'phone', count: (total - wa) * 0.3 },    // ❌ Fake
  { type: 'website', count: (total - wa) * 0.2 },  // ❌ Fake
]
```

**Solução:** Rastrear cada tipo individualmente no backend

---

### P2 - MÉDIO

#### 5. ⚠️ Tab "Analytics Avançado" Sem Dados Suficientes

**Problema:** Mostra gráficos complexos mas faltam dados granulares

**Arquivo:** `EnterpriseDashboard.tsx` linha 246-260

```typescript
<TabsContent value="analytics">
  <PerformanceMetrics companyId={companyId} themeMode={themeMode} />
</TabsContent>
```

**Necessário:**
- Séries temporais de views (diário/semanal)
- Breakdown por fonte de tráfego
- Métricas de engajamento por sessão
- Funil de conversão detalhado

**Endpoint Existe:** `analytics_timeseries` (linha 34-53)  
**Status:** ✅ Backend pronto, frontend não consome

---

#### 6. ⚠️ Falta Tracking de Navegação Interna

**Missing:**
```typescript
// Quando empresa troca de tab no dashboard
track('Dashboard Tab Viewed', {
  tab_name: tab,
  company_id: companyId,
  user_id: user?.id
});
```

**Status:** ✅ **IMPLEMENTADO** (linha 90-94 EnterpriseDashboard.tsx)

---

## 📊 Análise de Fluxo de Dados

### Backend → Frontend

```
┌─────────────────────────────────────────┐
│ company_daily_stats (PostgreSQL)        │
│ - date, company_id                      │
│ - profile_views (int)                   │
│ - cta_clicks (int)                      │
│ - whatsapp_clicks (int)                 │
│ - leads (int)                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ CompanyDashboard::MetricsSource         │
│ - totals(from_day, to_day)              │
│ - timeseries(days)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ API: /company_dashboard/analytics/*     │
│ - overview                              │
│ - timeseries                            │
│ - reputation                            │
│ - ranking                               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Frontend Hooks                          │
│ - useCompanyAnalytics()                 │
│ - useCompanyDashboardData()             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Dashboard Components                    │
│ - OverviewTab                           │
│ - PerformanceMetrics                    │
│ - RankingPerformanceTab                 │
└─────────────────────────────────────────┘
```

### ⚠️ Gap Crítico: Eventos Front-End → Backend

**Ausente:**
```
User Action (Profile Page) → Track Event → Backend → company_daily_stats
```

**Necessário:**
1. Instrumentar CTAs no perfil público
2. Enviar eventos para backend via `/api/v1/analytics/track`
3. Backend processa e agrega em `company_daily_stats`

---

## 🎯 Eventos Recomendados para Dashboard

### Eventos de Conversão (Perfil Público)

```typescript
// 1. Visualização de Perfil
track('Company Profile Viewed', {
  company_id: string,
  company_name: string,
  category_id?: string,
  source: 'organic' | 'paid' | 'referral' | 'direct',
  utm_source?: string,
  utm_medium?: string,
  utm_campaign?: string,
  device_type: 'desktop' | 'mobile' | 'tablet',
  user_type: 'anonymous' | 'registered' | 'company_owner'
});

// 2. CTA Clicado (Genérico)
track('CTA Clicked', {
  cta_type: 'whatsapp' | 'email' | 'phone' | 'website' | 'quote_request',
  cta_location: 'hero' | 'sidebar' | 'footer' | 'floating',
  company_id: string,
  utm_*: string
});

// 3. WhatsApp (Específico)
track('WhatsApp CTA Clicked', {
  company_id: string,
  phone_number: string,
  message_prefilled: boolean,
  utm_*: string
});

// 4. Email Contact
track('Email CTA Clicked', {
  company_id: string,
  email: string,
  utm_*: string
});

// 5. Phone Call
track('Phone CTA Clicked', {
  company_id: string,
  phone_number: string,
  utm_*: string
});

// 6. Website Visit
track('Website CTA Clicked', {
  company_id: string,
  website_url: string,
  utm_*: string
});

// 7. Lead Form Submitted
track('Lead Form Submitted', {
  company_id: string,
  form_type: 'quote' | 'contact' | 'callback',
  lead_source: string,
  utm_*: string
});
```

### Eventos de Engajamento (Dashboard)

```typescript
// 8. Dashboard Session Started
track('Dashboard Session Started', {
  company_id: string,
  user_id: string,
  user_role: string,
  session_id: string
});

// 9. Dashboard Tab Viewed
track('Dashboard Tab Viewed', {
  tab_name: string,
  company_id: string,
  user_id: string,
  time_on_previous_tab?: number
});

// 10. Settings Changed
track('Company Settings Updated', {
  company_id: string,
  setting_type: 'profile' | 'categories' | 'products' | 'media',
  fields_updated: string[]
});

// 11. Review Responded
track('Review Response Submitted', {
  company_id: string,
  review_id: string,
  response_time_hours: number
});

// 12. Media Uploaded
track('Media Uploaded', {
  company_id: string,
  media_type: 'image' | 'video' | 'document',
  file_size_kb: number
});
```

---

## 🛠️ Plano de Implementação

### Sprint 1: Fundação (P0) - 5 dias

#### Backend (2 dias)

**Criar endpoint de tracking:**
```ruby
# app/controllers/api/v1/analytics_controller.rb
class Api::V1::AnalyticsController < BaseController
  skip_before_action :authenticate_user!, only: [:track]
  
  def track
    event_name = params[:event]
    properties = params[:properties] || {}
    
    # Validar evento
    unless ALLOWED_EVENTS.include?(event_name)
      return render json: { error: 'Invalid event' }, status: :bad_request
    end
    
    # Processar assíncrono via Sidekiq
    AnalyticsTrackingJob.perform_async(
      event_name,
      properties.to_unsafe_h,
      request_metadata
    )
    
    render json: { success: true }, status: :accepted
  end
  
  private
  
  ALLOWED_EVENTS = %w[
    Company\ Profile\ Viewed
    CTA\ Clicked
    WhatsApp\ CTA\ Clicked
    Email\ CTA\ Clicked
    Phone\ CTA\ Clicked
    Website\ CTA\ Clicked
    Lead\ Form\ Submitted
  ].freeze
end
```

**Worker para processar:**
```ruby
# app/workers/analytics_tracking_job.rb
class AnalyticsTrackingJob
  include Sidekiq::Worker
  
  def perform(event_name, properties, metadata)
    company_id = properties['company_id']
    return unless company_id
    
    date = Date.current
    
    # Incrementar contadores em company_daily_stats
    case event_name
    when 'Company Profile Viewed'
      increment_stat(company_id, date, :profile_views)
    when 'CTA Clicked', 'WhatsApp CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      increment_stat(company_id, date, :whatsapp_clicks) if whatsapp?
    when 'Lead Form Submitted'
      increment_stat(company_id, date, :leads)
    end
    
    # Enviar para Mixpanel/GA4
    MixpanelService.track(event_name, properties)
    GA4Service.track(event_name, properties)
  end
  
  private
  
  def increment_stat(company_id, date, metric)
    CompanyDailyStat.find_or_initialize_by(
      company_id: company_id,
      date: date
    ).increment!(metric)
  end
end
```

**Migração:**
```ruby
# db/migrate/XXXXXX_add_detailed_cta_tracking.rb
class AddDetailedCtaTracking < ActiveRecord::Migration[7.0]
  def change
    add_column :company_daily_stats, :email_clicks, :integer, default: 0
    add_column :company_daily_stats, :phone_clicks, :integer, default: 0
    add_column :company_daily_stats, :website_clicks, :integer, default: 0
    
    add_index :company_daily_stats, [:company_id, :date], unique: true
  end
end
```

#### Frontend (3 dias)

**1. Criar tracking helper:**
```typescript
// lib/analytics/track-cta.ts
import { track } from '@/lib/analytics/lazy';

interface CTAClickProperties {
  ctaType: 'whatsapp' | 'email' | 'phone' | 'website' | 'quote';
  ctaLocation: string;
  companyId: string;
  companyName: string;
  destinationUrl?: string;
}

export async function trackCTAClick(props: CTAClickProperties) {
  // UTM parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    utm_term: searchParams.get('utm_term'),
  };
  
  // Track genérico
  await track('CTA Clicked', {
    cta_type: props.ctaType,
    cta_location: props.ctaLocation,
    company_id: props.companyId,
    company_name: props.companyName,
    destination_url: props.destinationUrl,
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    ...utmParams,
  });
  
  // Track específico por tipo
  const specificEvents = {
    whatsapp: 'WhatsApp CTA Clicked',
    email: 'Email CTA Clicked',
    phone: 'Phone CTA Clicked',
    website: 'Website CTA Clicked',
  };
  
  if (specificEvents[props.ctaType]) {
    await track(specificEvents[props.ctaType], {
      company_id: props.companyId,
      company_name: props.companyName,
      ...utmParams,
    });
  }
  
  // Enviar para backend
  await fetch('/api/v1/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: specificEvents[props.ctaType] || 'CTA Clicked',
      properties: {
        cta_type: props.ctaType,
        company_id: props.companyId,
        ...utmParams,
      },
    }),
  });
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
```

**2. Instrumentar CTAs:**
```typescript
// app/companies/[id]/components/CompanyHero.tsx
import { trackCTAClick } from '@/lib/analytics/track-cta';

export default function CompanyHero({ company }) {
  const handleWhatsAppClick = async () => {
    await trackCTAClick({
      ctaType: 'whatsapp',
      ctaLocation: 'hero',
      companyId: company.id,
      companyName: company.name,
      destinationUrl: whatsappUrl,
    });
    
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <Button onClick={handleWhatsAppClick}>
      Falar no WhatsApp
    </Button>
  );
}
```

**3. Remover dados fake:**
```typescript
// app/dashboard/components/PerformanceMetrics.tsx

// ❌ REMOVER linhas 98-100
// engagement: {
//   avgTimeOnPage: 245,
//   bounceRate: 34,
//   pagesPerSession: 2.8,
// }

// ✅ SUBSTITUIR por:
engagement: analyticsData?.engagement || null,

// E no componente:
{metrics.engagement ? (
  <EngagementMetrics data={metrics.engagement} />
) : (
  <Card>
    <CardContent className="p-6 text-center text-muted-foreground">
      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
      <p>Métricas de engajamento em desenvolvimento</p>
      <p className="text-sm mt-2">Configure o GA4 para ver dados reais</p>
    </CardContent>
  </Card>
)}
```

---

### Sprint 2: Granularidade (P1) - 3 dias

#### Backend

**Expandir breakdown de CTAs:**
```ruby
# app/services/company_dashboard/metrics_source.rb
def totals(from_day:, to_day:)
  stats = CompanyDailyStat
    .where(company_id: @company_id, date: from_day..to_day)
    .select(
      'SUM(profile_views) as profile_views',
      'SUM(cta_clicks) as cta_clicks',
      'SUM(whatsapp_clicks) as whatsapp_clicks',
      'SUM(email_clicks) as email_clicks',      # ✅ Novo
      'SUM(phone_clicks) as phone_clicks',      # ✅ Novo
      'SUM(website_clicks) as website_clicks',  # ✅ Novo
      'SUM(leads) as leads'
    ).first
    
  return nil unless stats
  
  {
    profile_views: stats.profile_views.to_i,
    cta_clicks: stats.cta_clicks.to_i,
    whatsapp_clicks: stats.whatsapp_clicks.to_i,
    email_clicks: stats.email_clicks.to_i,          # ✅ Novo
    phone_clicks: stats.phone_clicks.to_i,          # ✅ Novo
    website_clicks: stats.website_clicks.to_i,      # ✅ Novo
    leads: stats.leads.to_i
  }
end
```

**Atualizar endpoint:**
```ruby
# app/controllers/api/v1/company_dashboard_controller.rb
def analytics_overview
  # ...
  render json: {
    views_30d: views,
    cta_clicks_30d: stats[:cta_clicks].to_i,
    whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
    email_clicks_30d: stats[:email_clicks].to_i,       # ✅ Novo
    phone_clicks_30d: stats[:phone_clicks].to_i,       # ✅ Novo
    website_clicks_30d: stats[:website_clicks].to_i,   # ✅ Novo
    leads_30d: leads,
    conversion_rate: conversion
  }
end
```

#### Frontend

**Atualizar PerformanceMetrics:**
```typescript
// app/dashboard/components/PerformanceMetrics.tsx
const metrics: Metrics = {
  ctaClicks: {
    total: analyticsData?.cta_clicks_30d || 0,
    trend: calculateTrend(analyticsData?.timeseries),
    byType: [
      { 
        type: 'whatsapp', 
        count: analyticsData?.whatsapp_clicks_30d || 0,  // ✅ Real
        label: 'WhatsApp' 
      },
      { 
        type: 'email', 
        count: analyticsData?.email_clicks_30d || 0,     // ✅ Real
        label: 'Email' 
      },
      { 
        type: 'phone', 
        count: analyticsData?.phone_clicks_30d || 0,     // ✅ Real
        label: 'Telefone' 
      },
      { 
        type: 'website', 
        count: analyticsData?.website_clicks_30d || 0,   // ✅ Real
        label: 'Website' 
      },
    ],
  },
};
```

---

### Sprint 3: Contexto (P1) - 2 dias

**Adicionar UTM tracking aos CTAs:**
```typescript
// components/ui/CTAButton.tsx
export function CTAButton({ href, children, ctaType, companyId }) {
  const utmParams = new URLSearchParams({
    utm_source: 'avaliasolar',
    utm_medium: 'company_profile',
    utm_campaign: 'profile_cta',
    utm_content: ctaType,
  });
  
  const urlWithUTM = `${href}?${utmParams.toString()}`;
  
  return (
    <a href={urlWithUTM} onClick={() => trackCTAClick(...)}>
      {children}
    </a>
  );
}
```

---

### Sprint 4: Analytics Avançado (P2) - 5 dias

**Integrar timeseries no frontend:**
```typescript
// app/dashboard/components/AdvancedAnalytics.tsx
const { data: timeseries } = useQuery({
  queryKey: ['analytics-timeseries', companyId, days],
  queryFn: async () => {
    const response = await fetchApi('/company_dashboard/analytics/timeseries', {
      params: { company_id: companyId, days }
    });
    return response.data;
  }
});

return (
  <Chart
    data={timeseries}
    lines={[
      { key: 'views', label: 'Visualizações', color: 'blue' },
      { key: 'clicks', label: 'Cliques', color: 'green' },
      { key: 'leads', label: 'Leads', color: 'orange' },
    ]}
  />
);
```

---

## 📊 Métricas de Sucesso (KPIs da Auditoria)

### Objetivos Mensuráveis

| Métrica | Atual | Meta Sprint 1 | Meta Sprint 4 |
|---------|-------|---------------|---------------|
| Signal Quality Index | 60/100 | 75/100 | 90/100 |
| Eventos Rastreados | 3 | 10 | 15 |
| Data Accuracy | 80% | 95% | 99% |
| Fake Metrics | 5 | 1 | 0 |
| UTM Coverage | 0% | 80% | 95% |

### Indicadores de Qualidade

**Antes (Atual):**
- ❌ 60% das métricas são calculadas/fake
- ❌ Impossível atribuir leads a fontes
- ❌ Dashboard mostra "Analytics Avançado" sem dados reais
- ⚠️ Tracking de dashboard tabs OK, mas perfil público não

**Depois (Sprint 4):**
- ✅ 100% das métricas baseadas em eventos reais
- ✅ Atribuição completa: UTM → Lead → Revenue
- ✅ Analytics Avançado com gráficos time-series reais
- ✅ Breakdown detalhado por tipo de CTA
- ✅ Métricas de engajamento via GA4

---

## 🎯 Decisões Estratégicas Habilitadas

### Após Implementação P0+P1

**Empresas poderão:**
1. ✅ Identificar qual CTA gera mais leads (WhatsApp vs Email vs Phone)
2. ✅ Medir ROI de campanhas pagas por UTM
3. ✅ Otimizar posição de CTAs (Hero vs Sidebar vs Footer)
4. ✅ A/B test messages do WhatsApp
5. ✅ Calcular Custo por Lead (CPL) real

**Avalia Solar poderá:**
1. ✅ Mostrar valor do produto: "empresas recebem X% mais leads"
2. ✅ Identificar categorias mais performáticas
3. ✅ Otimizar SEO: páginas com mais conversão
4. ✅ Precificar planos: empresas com >100 leads/mês = Premium
5. ✅ Criar benchmarks de mercado

---

## 🔧 Stack de Analytics Recomendado

### Frontend
- ✅ **Tracking Unificado:** `@/lib/analytics/lazy` (já existe)
- ✅ **Mixpanel:** Para eventos de produto
- ✅ **GA4:** Para tráfego e conversões públicas
- ✅ **Sentry:** Performance monitoring

### Backend
- ✅ **PostgreSQL:** `company_daily_stats` (agregação diária)
- ✅ **Redis:** Cache de métricas hot
- ✅ **Sidekiq:** Processamento assíncrono de eventos
- ⚠️ **Snowplow/Segment:** (Nice to have) Pipeline centralizado

### Integrações
- ✅ **GTM:** Tag Manager para facilitar mudanças
- ⚠️ **Amplitude:** (Alternativa ao Mixpanel se necessário)
- ⚠️ **Looker/Metabase:** BI para analytics interno

---

## ✅ Checklist de Implementação

### Sprint 1: Fundação (5 dias)
- [ ] Criar `AnalyticsController` e endpoint `/track`
- [ ] Criar `AnalyticsTrackingJob` (Sidekiq)
- [ ] Migração: adicionar `email_clicks`, `phone_clicks`, `website_clicks`
- [ ] Criar `trackCTAClick()` helper no frontend
- [ ] Instrumentar CTAs em `CompanyHero`, `CompanySidebar`, `CompanyOverview`
- [ ] Remover métricas fake de `PerformanceMetrics.tsx`
- [ ] Adicionar placeholder "Dados indisponíveis" para engagement
- [ ] Testes E2E: clicar CTA → verificar increment em DB

### Sprint 2: Granularidade (3 dias)
- [ ] Atualizar `MetricsSource.totals` com novos campos
- [ ] Atualizar endpoint `analytics_overview` com breakdown real
- [ ] Atualizar `PerformanceMetrics` para consumir dados reais
- [ ] Testes: verificar breakdown correto por tipo de CTA

### Sprint 3: Contexto (2 dias)
- [ ] Adicionar UTM params a todos os CTAs
- [ ] Persistir UTMs no evento de tracking
- [ ] Dashboard: mostrar "Top Sources" baseado em UTMs
- [ ] Testes: verificar UTM propagation

### Sprint 4: Analytics Avançado (5 dias)
- [ ] Frontend: consumir endpoint `analytics_timeseries`
- [ ] Criar componente `TimeSeriesChart`
- [ ] Adicionar filtros: 7d/30d/90d
- [ ] Integração GA4: importar métricas de engajamento
- [ ] Testes: verificar gráficos renderizam corretamente

---

## 🚀 Quick Wins (Implementar Hoje)

### 1. Remover Fake Metrics (15 min)
```typescript
// PerformanceMetrics.tsx
// ❌ Deletar linhas 98-100
// ✅ Substituir por null + placeholder
```

### 2. Adicionar UTM aos Links (30 min)
```typescript
// Cada botão de CTA
const url = `${baseUrl}?utm_source=avaliasolar&utm_medium=profile&utm_campaign=cta_${type}`;
```

### 3. Log de Eventos (Console) (15 min)
```typescript
// Temporário: ver se eventos estão disparando
console.log('[Analytics] CTA Clicked', { ctaType, companyId });
```

---

## 📚 Referências Técnicas

### Documentos do Projeto
- `AB0-1-back/app/services/company_dashboard/` - Services de métricas
- `AB0-1-front/lib/analytics/` - Tracking unificado
- `ANALISE_TECNICA_DASHBOARDS_FINAL.md` - Auditoria anterior
- `memorial-googlt-gtm.md` - Configuração GTM

### Skills Utilizadas
- `.gemini/skills/analytics-tracking/` - Measurement strategy
- `.gemini/skills/kpi-dashboard-design/` - Dashboard best practices
- `.gemini/skills/mixpanel-automation/` - Event tracking patterns
- `.gemini/skills/google-analytics-automation/` - GA4 integration

### Stack Oficial
- Next.js 14 App Router
- Rails 7 API
- PostgreSQL 15+
- Sidekiq 7
- Mixpanel + GA4

---

## 🎓 Glossário

**Signal Quality Index:** Score (0-100) que mede se o analytics produz dados confiáveis para decisões

**Decision-Ready:** Dados são suficientemente precisos e contextualizados para basear ações de negócio

**Event Sprawl:** Problema de rastrear muitos eventos sem propósito claro, gerando ruído

**UTM Parameters:** Tags de rastreamento (utm_source, utm_medium, etc) para atribuição de tráfego

**Conversion Rate:** % de visitors que completam ação desejada (leads / views)

**Breakdown:** Divisão de métrica agregada em sub-categorias (ex: CTAs por tipo)

---

## 📞 Próximos Passos

1. **Revisar com time:** Validar prioridades e escopo
2. **Criar tasks:** Quebrar sprints em tickets no backlog
3. **Sprint Planning:** Alocar Sprint 1 (5 dias)
4. **Kickoff técnico:** Alinhar backend + frontend sobre contratos de API
5. **Implementar Quick Wins:** Remover fake metrics hoje

---

**Auditoria realizada por:** @avalia-solar-master  
**Contato:** Para dúvidas sobre implementação, consulte as skills de analytics no `.gemini/skills/`

---

*Este documento é vivo e deve ser atualizado conforme implementação avança.*

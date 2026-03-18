# ANALYTICS DOSSIER — Avalia Solar
## Inventário Completo de Eventos, Variáveis e Insights

**Gerado em:** 2026-03-18
**Stack:** PostHog · Google Tag Manager (GTM-5RV76ZKR) · GA4 · Backend Rails
**Fonte:** Análise estática de `lib/analytics/` (21 arquivos, ~4.300 linhas)

---

## ÍNDICE

1. [Arquitetura do Sistema](#1-arquitetura-do-sistema)
2. [Variáveis Globais (Matrix VAR)](#2-variáveis-globais-matrix-var)
3. [Catálogo de Eventos — Por Destino](#3-catálogo-de-eventos--por-destino)
4. [Funil de Demanda — Eventos Principais](#4-funil-de-demanda--eventos-principais)
5. [Sinais de Intenção — 40+ Intent Signals](#5-sinais-de-intenção--40-intent-signals)
6. [Mapeamento GTM → GA4](#6-mapeamento-gtm--ga4)
7. [Mapeamento Canônico → GTM](#7-mapeamento-canônico--gtm)
8. [Identificação de Usuário](#8-identificação-de-usuário)
9. [Sistema de Consentimento (LGPD)](#9-sistema-de-consentimento-lgpd)
10. [Feature Flags](#10-feature-flags)
11. [Insights Extraíveis por Plataforma](#11-insights-extraíveis-por-plataforma)
12. [Onde Cada Evento Está no Código](#12-onde-cada-evento-está-no-código)

---

## 1. ARQUITETURA DO SISTEMA

```
[Componente React]
       │
       ▼
   track('nome_evento', { propriedades })
       │
       ├─── [1] PostHog          → Dashboard PostHog (produto, sessões, funis, A/B)
       │        posthog.capture()
       │
       ├─── [2] GTM dataLayer    → GA4 / Meta Pixel / Google Ads (mídia paga, conversões)
       │        window.dataLayer.push()
       │
       └─── [3] Backend Rails    → Banco de dados interno (BI, relatórios, alertas)
                POST /api/v1/analytics/track
```

### Regras de Roteamento

| Condição | Comportamento |
|----------|---------------|
| Sem consentimento LGPD | Evento **bloqueado** — nenhum destino recebe |
| `options.sendTo.posthog = false` | Evento vai **só para GTM + Backend** |
| Sem `company_id` + evento não-global | Evento **não vai para o Backend** |
| Eventos globais (`page_view`, `search`) | Vão para Backend **mesmo sem company_id** |
| Deduplicação (5s TTL) | Evento idêntico ignorado silenciosamente |
| Backend rate limit (`400ms mín.`) | Evento descartado se enviado muito rápido |
| Offline | Evento **enfileirado** via `sendJsonApiMutationWithOfflineQueue` |

---

## 2. VARIÁVEIS GLOBAIS (Matrix VAR)

Estas variáveis são **automaticamente adicionadas a TODOS os eventos** pela função `getAnalyticsContext()`.

| Código | Nome da Variável | Tipo | Descrição | Exemplo |
|--------|-----------------|------|-----------|---------|
| VAR-001 | `page_url` | string | URL completa atual | `https://avaliasolar.com.br/companies/123` |
| VAR-002 | `pathname` | string | Caminho da URL | `/companies/solar-sp` |
| VAR-003 | `source` | string | Origem do tráfego (lógica automática) | `organic`, `direct`, `social`, `referral`, `utm_source` |
| VAR-004 | `original_event` | string | Nome canônico do evento (para GTM triggers) | `wizard_started` |
| VAR-005 | `event_id` | string | UUID único do evento (deduplicação) | `evt_a1b2c3d4` |
| VAR-006 | `session_id` | string | ID da sessão atual | `sess_xyz123` |
| VAR-007 | `company_id` | string | ID da empresa em contexto | `"372"` |
| VAR-008 | `company_name` | string | Nome da empresa em contexto | `"Solar SP"` |
| VAR-009 | `category_id` | string | ID da categoria em contexto | `"5"` |
| VAR-010 | `search_term` | string | Termo buscado | `"energia solar sp"` |
| VAR-011 | `results_count` | number | Qtd de resultados da busca | `12` |
| VAR-012 | `cta_type` | string | Tipo de CTA clicado | `whatsapp`, `phone`, `quote` |
| VAR-013 | `cta_location` | string | Localização do CTA na página | `hero`, `sticky`, `card` |
| VAR-014 | `item_id` | string | Alias GA4 de company_id | `"372"` |
| VAR-015 | `item_name` | string | Alias GA4 de company_name | `"Solar SP"` |
| VAR-016 | `item_category` | string | Nome da categoria (GA4 style) | `"Instalação Residencial"` |
| VAR-017 | `environment` | string | Ambiente de execução | `production`, `development` |
| VAR-018 | `app_version` | string | Versão do app (`NEXT_PUBLIC_APP_VERSION`) | `"1.0.0"` |
| VAR-019 | `gtm_timestamp` | number | Unix timestamp do evento | `1710734400000` |
| — | `platform` | string | Sempre `"web"` | `"web"` |
| — | `is_logged_in` | boolean | Usuário autenticado? | `true` |
| — | `user_id` | string | ID do usuário (se logado) | `"usr_456"` |
| — | `referrer` | string | URL da página anterior | `https://google.com` |
| — | `utm_source` | string | Parâmetro UTM source | `google`, `facebook` |
| — | `utm_medium` | string | Parâmetro UTM medium | `cpc`, `email` |
| — | `utm_campaign` | string | Parâmetro UTM campaign | `black-friday-2026` |
| — | `utm_content` | string | Parâmetro UTM content | `banner_topo` |
| — | `utm_term` | string | Parâmetro UTM term | `"energia solar"` |
| — | `gclid` | string | Google Click ID (Google Ads) | `CjwKC...` |
| — | `fbclid` | string | Facebook Click ID (Meta Ads) | `IwAR...` |
| — | `msclkid` | string | Microsoft Click ID (Bing Ads) | `abc123` |

### Campos do Payload Backend (`POST /api/v1/analytics/track`)

```json
{
  "event_id": "uuid-v4",
  "event_type": "wizard_started",
  "company_id": "372",
  "tracked_at": "2026-03-18T10:30:00.000Z",
  "metadata": {
    "session_id": "sess_xyz",
    "source": "organic",
    "utm_source": "google",
    "utm_medium": "cpc",
    "attribution": { "first_touch": {...}, "last_touch": {...} },
    "path": "/companies/solar-sp",
    "landing_path": "/",
    "referrer_host": "google.com",
    "...todas as propriedades do evento..."
  }
}
```

---

## 3. CATÁLOGO DE EVENTOS — POR DESTINO

### Legenda
- ✅ = Sempre enviado para este destino
- 🔄 = Enviado mas com nome diferente (veja mapeamentos)
- ❌ = Não enviado
- ⚠️ = Condicional

| Evento Canônico | PostHog | GTM/GA4 | Backend Rails | Categoria |
|----------------|---------|---------|---------------|-----------|
| `page_view` | ✅ | ✅ | ✅ (global) | Navegação |
| `landing_viewed` | ✅ | ✅ | ✅ | Topo do funil |
| `category_selected` | ✅ | 🔄 `select_content` | ✅ | Navegação |
| `company_profile_viewed` | ✅ | ✅ | ✅ | Consideração |
| `company_cta_clicked` | ✅ | ✅ | ✅ | Conversão |
| `whatsapp_click` | ✅ | 🔄 `contact` | ✅ | Conversão |
| `phone_click` | ✅ | ✅ | ✅ | Conversão |
| `wizard_started` | ✅ | 🔄 `begin_checkout` | ✅ | Conversão |
| `wizard_contact_submitted` | ✅ | ✅ | ✅ | Conversão |
| `wizard_step_completed` | ✅ | 🔄 `checkout_progress` | ✅ | Conversão |
| `wizard_success` | ✅ | 🔄 `wizard_success` | ✅ | Conversão |
| `otp_verified` | ✅ | ✅ | ✅ | Auth |
| `lead_created` | ✅ | ✅ | ✅ | **Meta-conversão** |
| `lead_dispatched` | ✅ | ✅ | ✅ | **Meta-conversão** |
| `search_performed` | ✅ | 🔄 `search` | ✅ (global) | Descoberta |
| `search_no_results` | ✅ | ✅ | ✅ (global) | Descoberta |
| `faq_interaction` | ✅ | ✅ | ✅ | Engajamento |
| `dashboard_viewed` | ✅ | ✅ | ✅ | Retenção |
| `user_returned` | ✅ | ✅ | ✅ | Retenção |
| `checkout_started` | ✅ | ✅ | ✅ | Monetização |
| `plan_upgraded` | ✅ | ✅ | ✅ | Monetização |
| `churn_intent` | ✅ | ✅ | ✅ | Retenção |
| `company_card_click` | ✅ | 🔄 `select_item` | ✅ | Descoberta |
| `company_card_impression` | ✅ | 🔄 `view_item_list` | ✅ | Descoberta |
| `intent_signal` | ✅ | ✅ | ✅ | Intenção |
| `identity_bridge_opened` | ✅ | ❌ | ❌ | Auth |
| `identity_bridge_closed` | ✅ | ❌ | ❌ | Auth |
| `identity_bridge_conversion` | ✅ | ❌ | ❌ | Auth |
| `home_hero_experiment_exposed` | ✅ | ✅ | ✅ | A/B Test |

---

## 4. FUNIL DE DEMANDA — EVENTOS PRINCIPAIS

```
Visitante                                              Lead Criado
    │                                                       │
    ▼                                                       ▼
[landing_viewed]──▶[category_selected]──▶[company_profile_viewed]──▶[company_cta_clicked]
                                                                           │
                                    ┌──────────────────────────────────────┤
                                    ▼                                       ▼
                               [whatsapp_click]                    [wizard_started]
                               [phone_click]                              │
                                                               [wizard_step_completed] ×N
                                                                          │
                                                               [wizard_contact_submitted]
                                                                          │
                                                                   [otp_verified]
                                                                          │
                                                                  [wizard_success]
                                                                  [lead_created]
                                                                  [lead_dispatched]
```

### Detalhamento de cada evento do funil

---

#### `landing_viewed`
```typescript
track('landing_viewed', {
  content_type: 'homepage',       // sempre "homepage"
  // + todas as VAR-001..019
})
```
**Insight:** Volume de tráfego na home. Base do funil.

---

#### `category_selected`
```typescript
track('category_selected', {
  category_id: "5",               // ID da categoria
  category_slug: "instalacao-residencial",
  // props adicionais da página
})
```
**Insight:** Quais categorias têm mais demanda. Prioridade de SEO e UX.

---

#### `company_profile_viewed`
```typescript
track('company_profile_viewed', {
  company_id: "372",
  company_name: "Solar SP",
  plan_tier: "pro",               // "free" | "pro" | "enterprise"
})
```
**Insight:** Empresas mais visitadas. Medir se plano afeta visibilidade.

---

#### `company_cta_clicked` ← **Evento de conversão principal**
```typescript
track('company_cta_clicked', {
  company_id: "372",
  cta_type: "whatsapp",          // "whatsapp" | "phone" | "quote" | "email"
  company_name: "Solar SP",
  content_type: "company_contact",
  placement: "sticky",           // "hero" | "sticky" | "card" | "sidebar"
})
```
**Insight:** Taxa de conversão por empresa, tipo de CTA, posição na página.

---

#### `whatsapp_click` / `phone_click`
```typescript
track('whatsapp_click', {
  company_id: "372",
  company_name: "Solar SP",
  contact_type: "whatsapp",      // "whatsapp" | "phone"
})
```
**Insight:** Canal de contato preferido. Presença de WhatsApp vs telefone.

---

#### `wizard_started`
```typescript
track('wizard_started', {
  wizard_id: "lead-wizard",
  entry_point: "home-hero-primary",  // Origem do clique
  category_id: "5",
})
```
**GTM:** → `begin_checkout`
**Insight:** Taxa de início do wizard por ponto de entrada.

---

#### `wizard_step_completed` (N passos)
```typescript
track('wizard_step_completed', {
  wizard_id: "lead-wizard",
  step_index: 0,                  // 0-based
  step_name: "location",
  // dados do passo
})
```
**GTM:** → `checkout_progress`
**Insight:** Drop-off por passo. Onde os usuários abandonam o wizard.

---

#### `wizard_contact_submitted`
```typescript
track('wizard_contact_submitted', {
  lead_id: "lead_abc123",
  category_id: "5",
})
```
**Insight:** Usuários que chegaram até o campo de contato.

---

#### `otp_verified`
```typescript
track('otp_verified', {
  user_id: "usr_456",
  auth_method: "sms",             // "sms" | "whatsapp"
})
```
**Insight:** Taxa de verificação do OTP. Identifica abandono no SMS.

---

#### `wizard_success` / `lead_created` ← **Meta-conversão**
```typescript
track('lead_created', {
  lead_id: "lead_abc123",
  company_id: "372",
  value: 25000,                   // Valor da conta de energia (R$)
  currency: "BRL",
  category: "instalacao-residencial",
  city: "São Paulo",
})
```
**GTM:** → `purchase` (via GA4 mapping)
**Insight:** Volume de leads gerados. Revenue proxy. Taxa de conversão geral.

---

#### `lead_dispatched`
```typescript
track('lead_dispatched', {
  lead_id: "lead_abc123",
  recipient_id: "372",            // empresa que recebeu o lead
})
```
**Insight:** Empresas que mais recebem leads. Distribuição de demanda.

---

## 5. SINAIS DE INTENÇÃO — 40+ Intent Signals

Todos enviados como `track('intent_signal', { signal_type, signal_category, ...payload })`.

### Payload base de todos os intent signals:
```typescript
{
  company_id: string,
  user_id?: string,
  anonymous_id?: string,
  session_id?: string,
  signal_type: IntentSignalType,
  signal_category: IntentSignalCategory,
  element_selector?: string,      // CSS selector do elemento
  element_type?: string,          // tipo do elemento
  page_path?: string,
  referrer_host?: string,
  duration_ms?: number,           // tempo gasto no sinal
  metadata?: Record<string, any>, // dados específicos do sinal
  tracked_at?: string,
}
```

---

### TIER 1 — Sinais de Compra Iminente (Score Alto)

| Signal Type | Categoria | O que mede | Metadata Específica |
|-------------|-----------|------------|---------------------|
| `bill_value_entered` | `financial_intent` | Usuário digitou valor da conta de energia | `{ value: number, currency: "BRL" }` |
| `financing_multiple_simulations` | `financial_intent` | Fez 2+ simulações de financiamento | `{ simulation_count: number }` |
| `contact_info_reveal` | `contact_intent` | Clicou para ver telefone/WhatsApp | `{ contact_type: "phone"|"whatsapp" }` |
| `quote_abandonment` | `financial_intent` | Iniciou wizard e saiu sem concluir | `{ last_step: string, time_spent_ms: number }` |
| `return_visit_to_company` | `research_intent` | Retornou ao perfil da empresa | `{ visit_count: number, days_since_first: number }` |
| `whatsapp_copy` | `contact_intent` | Copiou número de WhatsApp | `{ company_id: string }` |
| `quote_wizard_step` | `financial_intent` | Avançou passo no wizard de cotação | `{ step_index: number, step_name: string }` |
| `quote_submission` | `financial_intent` | Enviou formulário de cotação | `{ lead_id: string }` |

---

### TIER 2 — Pesquisa Séria (Score Médio-Alto)

| Signal Type | Categoria | O que mede | Metadata Específica |
|-------------|-----------|------------|---------------------|
| `comparison_third_added` | `research_intent` | Adicionou 3ª empresa para comparar | `{ companies: string[] }` |
| `negative_review_deep_read` | `research_intent` | Leu avaliação negativa por >30s | `{ review_id: string, rating: number, duration_ms: number }` |
| `certification_hover` | `research_intent` | Inspecionou certificados/selos | `{ certification_type: string }` |
| `payback_period_interaction` | `financial_intent` | Interagiu com calculadora de payback/ROI | `{ simulated_value: number }` |
| `photo_gallery_5plus` | `research_intent` | Visualizou 5+ fotos de um projeto | `{ photo_count: number, company_id: string }` |
| `time_on_company_5min` | `research_intent` | Ficou 5+ minutos na página da empresa | `{ duration_ms: number }` |
| `geo_filter_repeated` | `research_intent` | Filtrou por localização 2+ vezes | `{ filter_count: number, location: string }` |
| `tab_switching_pattern` | `research_intent` | Alternando entre abas de empresa | `{ tab_count: number }` |

---

### TIER 3 — Intenção Emergente (Score Médio)

| Signal Type | Categoria | O que mede | Metadata Específica |
|-------------|-----------|------------|---------------------|
| `roi_calculator_opened` | `financial_intent` | Abriu calculadora de ROI/economia | `{ entry_point: string }` |
| `search_refinement_chain` | `research_intent` | Fez 3+ buscas refinando resultado | `{ searches: string[], count: number }` |
| `category_return` | `research_intent` | Voltou para a mesma categoria | `{ return_count: number, category_slug: string }` |
| `exit_intent` | `micro_interaction` | Mouse saiu para fechar a aba | `{ page_path: string, time_on_page_ms: number }` |
| `scroll_depth_80pct` | `micro_interaction` | Rolou 80% da página da empresa | `{ depth_pct: 80, page_path: string }` |
| `share_intent` | `contact_intent` | Copiou URL da empresa | `{ company_id: string }` |

---

### TIER 4 — Micro-comportamento (Score Baixo, Volume Alto)

| Signal Type | Categoria | O que mede | Metadata Específica |
|-------------|-----------|------------|---------------------|
| `hover_intent` | `micro_interaction` | Hover prolongado em elemento | `{ element_type: string, duration_ms: number }` |
| `copy_clipboard` | `micro_interaction` | Copiou qualquer texto da página | `{ content_type: string }` |
| `form_hesitation` | `micro_interaction` | Parou de digitar em formulário | `{ field_name: string, pause_ms: number }` |
| `scroll_pause` | `micro_interaction` | Pausou rolagem (lendo conteúdo) | `{ scroll_pct: number, duration_ms: number }` |
| `tooltip_interaction` | `micro_interaction` | Expandiu tooltip/popover | `{ tooltip_id: string }` |
| `phone_hover` | `contact_intent` | Hover sobre número de telefone | `{ duration_ms: number }` |
| `whatsapp_hover` | `contact_intent` | Hover sobre botão WhatsApp | `{ duration_ms: number }` |
| `pricing_interaction` | `financial_intent` | Interagiu com tabela de preços | `{ plan_name: string }` |
| `document_download` | `research_intent` | Baixou documento/PDF | `{ document_type: string }` |
| `mobile_contact_tap` | `contact_intent` | Tap em contato no mobile | `{ contact_type: string }` |
| `idle_then_return` | `micro_interaction` | Voltou após ficar idle >2min | `{ idle_ms: number }` |
| `social_proof_section_dwell` | `research_intent` | Leu seção de avaliações/depoimentos | `{ duration_ms: number, review_count: number }` |
| `faq_specific_read` | `research_intent` | Abriu FAQ específico | `{ faq_question: string, duration_ms: number }` |
| `review_read` | `research_intent` | Leu pelo menos uma avaliação | `{ review_id: string }` |
| `review_deep_read` | `research_intent` | Leu avaliação por >15s | `{ review_id: string, duration_ms: number }` |
| `comparison_view` | `research_intent` | Abriu comparativo entre empresas | `{ company_ids: string[] }` |
| `comparison_usage` | `research_intent` | Usou recurso de comparação | `{ action: string }` |
| `calculator_usage` | `financial_intent` | Usou calculadora de economia | `{ bill_value: number }` |

---

### BLOG — Engajamento Editorial

| Signal Type | Categoria | O que mede |
|-------------|-----------|------------|
| `blog_exit_intent` | `blog_engagement` | Mouse saiu do artigo |
| `blog_share_intent` | `blog_engagement` | Copiou URL do artigo |
| `blog_newsletter_intent` | `blog_engagement` | Hover/foco no campo de newsletter |
| `blog_cta_click` | `blog_engagement` | Clicou em CTA dentro do artigo |
| `blog_toc_click` | `blog_engagement` | Clicou no índice do artigo |
| `blog_category_filter` | `blog_engagement` | Filtrou artigos por categoria |
| `blog_search_performed` | `blog_engagement` | Buscou no blog |
| `blog_related_post_click` | `blog_engagement` | Clicou em artigo relacionado |
| `blog_idle_return` | `blog_engagement` | Voltou ao artigo após idle |

---

## 6. MAPEAMENTO GTM → GA4

Quando um evento cai no `dataLayer`, o container GTM deve ter triggers que o capturam e disparam tags GA4. Esta é a tabela de mapeamento definida em `lib/analytics/gtag.ts`:

| Evento Canônico (PostHog) | Evento GTM (dataLayer) | Evento GA4 (Recomendado) | Notas |
|--------------------------|----------------------|--------------------------|-------|
| `page_view` | `page_view` | `page_view` | Manual (send_page_view: false) |
| `search_performed` | `search` | `search` | `search_term` disponível |
| `search_submitted` | `search` | `search` | — |
| `search_no_results` | `search` | `search` | `has_results: false` |
| `location_selected` | `location_selected` | `select_content` | — |
| `category_selected` | `category_selected` | `select_content` | — |
| `company_card_impression` | `company_card_impression` | `view_item_list` | `item_id`, `item_name` |
| `company_card_click` | `select_item` | `select_item` | `item_id`, `item_name` |
| `cta_click` | `cta_click` | `select_content` | — |
| `whatsapp_click` | `contact` | `contact` | — |
| `contact_click` | `contact_click` | `contact` | — |
| `lead_submitted` | `lead_submitted` | `generate_lead` | — |
| `lead_verified` | `lead_verified` | `purchase` | — |
| `lead_created` | `lead_created` | `generate_lead` | ← **Principal conversão** |
| `wizard_started` | `begin_checkout` | `begin_checkout` | ← Para Google Ads |
| `wizard_step_completed` | `checkout_progress` | `checkout_progress` | `checkout_step` |
| `wizard_step_viewed` | `wizard_step_viewed` | `view_item_list` | — |
| `wizard_submitted` | `wizard_submitted` | `purchase` | ← Para ROAS |
| `wizard_success` | `wizard_success` | `wizard_success` | (TRG-009) |
| `company_cta_impression` | `company_cta_impression` | `view_promotion` | — |
| `company_share_click` | `company_share_click` | `share` | — |
| `company_comparison_toggle` | `company_comparison_toggle` | `select_content` | — |
| `scroll_depth_reached` | `scroll_depth_reached` | `optimize_experience` | — |
| `begin_checkout` | `begin_checkout` | `begin_checkout` | — |
| `checkout_started` | `checkout_started` | `begin_checkout` | Monetização SaaS |
| `plan_upgraded` | `plan_upgraded` | `purchase` | Monetização SaaS |

### Parâmetros GA4 Auto-Mapeados

```typescript
// Quando o evento tem estas propriedades, elas são traduzidas para nomenclatura GA4:
properties.company_id    → params.item_id
properties.company_name  → params.item_name
properties.category_id   → params.item_category
properties.search_term   → params.search_term
properties.cta_type      → params.content_type
properties.placement     → params.creative_slot
properties.step_index    → params.checkout_step  (+1 para ser 1-based)
properties.template_key  → params.item_list_name
```

---

## 7. MAPEAMENTO CANÔNICO → GTM

Tabela resumida dos eventos que têm nome diferente no GTM (de `lib/analytics/index.ts`):

| Nome no PostHog | Nome no GTM dataLayer |
|----------------|----------------------|
| `search_performance` | `search` |
| `search_submitted` | `search` |
| `company_card_click` | `select_item` |
| `whatsapp_click` | `contact` |
| `wizard_started` | `begin_checkout` |
| `wizard_step_completed` | `checkout_progress` |
| `wizard_success` | `wizard_success` |
| **Todos os outros** | **mesmo nome** |

> **Importante para o GTM:** O campo `original_event` está **sempre presente** em todos os eventos do dataLayer. Use-o como variável no GTM se precisar do nome canônico para triggers mais específicos.

---

## 8. IDENTIFICAÇÃO DE USUÁRIO

### Fluxo de Identidade

```
Visitante Anônimo
  ├── anonymous_id: gerado e persistido em localStorage ("as_anonymous_id" ou "ajs_anonymous_id")
  └── session_id: gerado por sessão

Após login/OTP
  ├── identify(userId, traits) → PostHog.identify()
  ├── alias(newId) → PostHog.alias() — vincula anonymous_id ao userId
  └── Backend: POST /identity/stitch (vincula histórico anônimo)
```

### `identify(userId, traits)` — Propriedades de Usuário

```typescript
identify('usr_456', {
  // user_id (string)
  // plan_tier: 'free' | 'premium' | 'enterprise'
  // user_type: 'user' | 'company_admin' | 'admin'
  // company_id: string
  // Qualquer trait relevante (SEM PII — email, phone são bloqueados)
})
```

### PII Removido Automaticamente (antes de qualquer envio)
`email`, `phone`, `name`, `first_name`, `last_name`, `address`, `zipcode`, `cnpj`, `cpf`, `password`, `address_full`, `full_address`

---

## 9. SISTEMA DE CONSENTIMENTO (LGPD)

### Storage Key: `avaliasolar_consent` (localStorage)

```json
{
  "analytics": true,    // PostHog + Backend
  "marketing": true,    // GTM: ad_storage, ad_user_data, ad_personalization
  "necessary": true     // Sempre true (funcional)
}
```

### Comportamento por categoria de consentimento

| Consentimento | PostHog | GTM Analytics | GTM Ads/Pixel | Backend |
|---------------|---------|---------------|---------------|---------|
| Tudo negado | ❌ | ❌ | ❌ | ❌ |
| Só `analytics: true` | ✅ | ✅ `analytics_storage: granted` | ❌ | ✅ |
| Só `marketing: true` | ❌ | ❌ | ✅ `ad_storage: granted` | ❌ |
| Tudo aceito | ✅ | ✅ | ✅ | ✅ |

### GTM Consent Mode (Consent Mode v2)
Os seguintes sinais são enviados para o GTM:
- `ad_storage`: `granted` se `consent.marketing`
- `analytics_storage`: `granted` se `consent.analytics`
- `ad_user_data`: `granted` se `consent.marketing`
- `ad_personalization`: `granted` se `consent.marketing`

### Mudança de consentimento em tempo real
A função `onConsentChange()` escuta mudanças e atualiza o GTM e a atribuição UTM dinamicamente sem recarregar a página.

---

## 10. FEATURE FLAGS

Flags verificadas em runtime a partir de `company.feature_access` (via PostHog ou API):

| Flag | Onde verificada | O que controla |
|------|-----------------|---------------|
| `custom_ctas` | `CompanyDetailClient.tsx`, `CompanyCard.tsx` | Botões CTA customizados no perfil |
| `faq_block` | `CompanyDetailClient.tsx` | Seção de FAQ no perfil |
| `media_gallery` | `CompanyDetailClient.tsx` | Galeria de fotos/vídeos |
| `social_proof` | `CompanyDetailClient.tsx` | Seção de depoimentos/provas sociais |
| `show_alternatives` | `CompanyDetailClient.tsx` | Lista de empresas concorrentes |
| `show_competitor_banners` | `CompanyDetailClient.tsx` | Banners de concorrentes |
| `financing_simulation` | `CompanyDetailClient.tsx` | Calculadora de financiamento |

> **Nota:** Feature flags são verificadas via `isFeatureEnabled(company.feature_access, 'flag_name')` — baseadas em dados da API, não diretamente do PostHog Feature Flags SDK. O PostHog é usado para A/B testing do Hero (experimento `home_hero_v1`).

### A/B Test Ativo: `home_hero_v1`

```typescript
// Variantes:
'control'  → Hero com barra de busca (LandingHeroSearch)
'variant'  → Hero com CTA direto ("Ver empresas na minha região") + trust metrics
```

Evento disparado na exposição:
```typescript
track('home_hero_experiment_exposed', {
  experiment_id: 'home_hero_v1',
  hero_variant: 'control' | 'variant',
  source: 'landing_hero',
})
```

---

## 11. INSIGHTS EXTRAÍVEIS POR PLATAFORMA

### PostHog — Produto & Comportamento

| Insight | Como extrair | Evento(s) |
|---------|-------------|-----------|
| Taxa de conversão funil completo | Funil: `landing_viewed` → `wizard_started` → `lead_created` | Todos do funil |
| Drop-off por passo do wizard | Funil por `wizard_step_completed.step_index` | `wizard_step_completed` |
| Empresas com mais visualizações | Agrupar `company_profile_viewed` por `company_id` | `company_profile_viewed` |
| Empresas com mais leads | Agrupar `lead_created` por `company_id` | `lead_created` |
| CTA mais eficaz | Comparar `company_cta_clicked.cta_type` por taxa de lead | `company_cta_clicked` |
| WhatsApp vs Phone | Comparar `whatsapp_click` vs `phone_click` | Ambos |
| Usuários com alta intenção de compra | Segmentar por sinais Tier 1 (`intent_signal.signal_type`) | `intent_signal` |
| Análise A/B Hero | Comparar `lead_created` entre variantes `control` vs `variant` | `home_hero_experiment_exposed` + `lead_created` |
| Sessões com abandono de quiz | Funil: `wizard_started` sem `wizard_success` subsequente | Ambos |
| Tempo médio até conversão | Diff timestamp `landing_viewed` → `lead_created` por `session_id` | Ambos |
| Categorias mais buscadas | Agrupar `search_performed.search_term` | `search_performed` |
| Zero results por busca | Lista de `search_no_results.search_term` | `search_no_results` |
| Usuários que voltam | `user_returned.days_since_last_visit` histograma | `user_returned` |
| FAQ mais consultado | Agrupar `faq_interaction.faq_question` | `faq_interaction` |
| Score de intenção por empresa | Somar sinais Tier 1-4 por `company_id` por sessão | `intent_signal` |
| Churn iminente | Usuários com `churn_intent` sem `plan_upgraded` | Ambos |

### GTM / GA4 — Mídia Paga & Atribuição

| Insight | Evento GA4 | Configuração necessária no GTM |
|---------|-----------|-------------------------------|
| ROAS de campanhas | `purchase` (`wizard_submitted`) | Tag de conversão Google Ads |
| CPL (Custo por Lead) | `generate_lead` (`lead_created`) | Tag de conversão Google Ads |
| Funil de e-commerce | `begin_checkout`, `checkout_progress`, `purchase` | Tag GA4 com itens |
| Audiências de remarketing | `view_item_list`, `select_item` | Audience GTM |
| Lookalike Audiences Meta | `generate_lead` via Pixel | Tag Meta Pixel |
| Atribuição multi-touch | `gclid`, `fbclid` presentes em todos os eventos | Dimensão customizada GA4 |

### Backend Rails — BI & Operacional

| Insight | Tabela/Query sugerida | Evento |
|---------|----------------------|--------|
| Leads por empresa (ranking) | GROUP BY company_id, COUNT(lead_id) | `lead_created` |
| Leads por categoria | GROUP BY category | `lead_created` |
| Leads por cidade | GROUP BY city | `lead_created` |
| Horário de pico | GROUP BY HOUR(tracked_at) | Todos |
| UTM que gera mais leads | GROUP BY utm_source, utm_medium | `lead_created` |
| Taxa de validação OTP | `otp_verified` / `wizard_contact_submitted` | Ambos |
| Leads por plano da empresa | JOIN companies ON company_id, GROUP BY plan_tier | `lead_created` |
| Empresas com alta intenção sem lead | Sinais Tier 1 sem `lead_created` na mesma sessão | `intent_signal` |

---

## 12. ONDE CADA EVENTO ESTÁ NO CÓDIGO

| Arquivo | Eventos / Funções |
|---------|------------------|
| `lib/analytics/consolidated.ts` | `trackLandingViewed`, `trackCategorySelected`, `trackCompanyProfileViewed`, `trackCompanyCtaClicked`, `trackWizardStart`, `trackWizardContactSubmitted`, `trackOtpVerified`, `trackLeadSuccess`, `trackLeadDispatched`, `trackPageView`, `trackContactClick`, `trackSearchPerformance`, `trackFaqEngagement`, `trackDashboardViewed`, `trackUserReturned`, `trackCheckoutStarted`, `trackPlanUpgraded`, `trackChurnIntent` |
| `lib/analytics/index.ts` | `track()`, `page()`, `identify()`, `alias()`, `reset()`, `setUserProperties()`, `updateContext()`, `getAnalyticsContext()` |
| `lib/analytics/hooks/useIntentTracking.ts` | Hook `useIntentTracking()` — todos os 40+ sinais |
| `lib/analytics/track-cta.ts` | `trackCTAClick()`, `trackContactClick()` com mapeamento automático |
| `lib/analytics/micro-interactions.ts` | `trackFormHesitation()`, `trackHoverIntent()`, `trackScrollPause()` |
| `lib/analytics/identity-stitch.ts` | `stitchIdentity()`, `trackSession()` |
| `lib/analytics/gtag.ts` | `initializeGTag()`, `gtagEvent()`, `gtagPageView()`, `mapToGA4Event()` |
| `lib/analytics/consent.ts` | `hasAnalyticsConsent()`, `onConsentChange()`, `updateConsent()` |
| `lib/analytics/utm.ts` | `updateAttribution()`, `getCurrentUTMs()`, `getAttribution()` |
| `lib/analytics/dedupe.ts` | `shouldTrackEvent()`, `generateEventId()` |
| `components/PostHogProvider.tsx` | Inicialização do SDK, consent mode, session recording |
| `components/GoogleTagManager.tsx` | Consent Mode v2, GTM loader |
| `components/home/HomePageTracking.tsx` | `usePageTracking` para a Home |
| `components/ui/IdentityBridgeModal.tsx` | `identity_bridge_opened/closed/conversion` |
| `components/ClipboardTracker.tsx` | `copy_clipboard` |
| `components/WebVitalsReporter.tsx` | Core Web Vitals → PostHog |
| `hooks/usePageTracking.ts` | Hook genérico de page view para qualquer página |
| `app/companies/[id]/CompanyDetailClient.tsx` | `company_profile_viewed`, feature flags |
| `app/companies/[id]/components/CompanyHero.tsx` | `company_profile_viewed`, CTAs |
| `src/modules/leadWizard/hooks/useLeadWizard.ts` | Todos os eventos do wizard |
| `app/dashboard/hooks/useProducts.ts` | Eventos de produto (dashboard) |

---

## RESUMO RÁPIDO — Cheat Sheet

```
PostHog  → Dados de PRODUTO: funis, sessões, heatmaps, A/B tests, intent signals
GTM/GA4  → Dados de MÍDIA PAGA: ROAS, CPL, audiências, remarketing
Backend  → Dados de NEGÓCIO: leads, conversões, BI interno, alertas

Todo evento → PostHog + GTM + Backend (se tiver company_id ou for global)
Sem consentimento → ZERO dados coletados

Intent Signals → 40 sinais em 4 tiers de intenção de compra
Deduplicação → 5s TTL (eventos repetidos ignorados)
Backend rate limit → 400ms entre chamadas
PII Bloqueado → email, phone, name, cpf, cnpj, address
```

---

*Documento gerado por análise estática. Atualizar sempre que novos eventos forem adicionados ao codebase.*

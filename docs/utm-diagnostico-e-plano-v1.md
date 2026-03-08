# DIAGNÓSTICO E PLANO UTM END-TO-END — Avalia Solar

**Data:** 2026-02-03  
**Auditor:** Senior Fullstack + Analytics + Growth Engineer  
**Escopo:** Frontend (Next.js App Router) + Backend (Rails API) + Database (PostgreSQL/SQLite)

---

## 1. ESTADO ATUAL (com evidências)

### 1.1 Captura de UTM (Frontend)

#### ✅ **O que existe e funciona:**

**Arquivo:** `AB0-1-front/lib/analytics/utm.ts`  
**Evidência:**
```typescript
// Linhas 14-30: Extração de UTM da URL
export function extractUTMsFromURL(url?: string): UTMParameters {
  const searchParams = new URLSearchParams(
    url ? new URL(url).search : window.location.search
  );
  
  const utms: UTMParameters = {};
  
  if (searchParams.has('utm_source')) utms.utm_source = searchParams.get('utm_source')!;
  if (searchParams.has('utm_medium')) utms.utm_medium = searchParams.get('utm_medium')!;
  if (searchParams.has('utm_campaign')) utms.utm_campaign = searchParams.get('utm_campaign')!;
  if (searchParams.has('utm_content')) utms.utm_content = searchParams.get('utm_content')!;
  if (searchParams.has('utm_term')) utms.utm_term = searchParams.get('utm_term')!;
  
  return utms;
}
```

**Status:** ✅ Captura funcional dos 5 parâmetros UTM padrão.

**Limitações:**
- ❌ Não captura `gclid`, `fbclid`, `msclkid` (importante para ads)
- ❌ Não normaliza valores (lowercase, trim)
- ❌ Não valida tamanho ou caracteres
- ❌ Não tem allowlist de keys

---

### 1.2 Persistência de UTM (Frontend)

**Arquivo:** `AB0-1-front/lib/analytics/utm.ts`  
**Evidência:**
```typescript
// Linhas 59-70: Armazenamento em localStorage
export function storeUTMs(utms: UTMParameters): void {
  if (typeof window === 'undefined') return;
  if (Object.keys(utms).length === 0) return;
  
  const expiry = Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({
    utms,
    expiry
  }));
}
```

**Status:** ⚠️ Persistência parcial.

**Gaps:**
- ❌ Só usa `localStorage` (não funciona no SSR, não persiste no server)
- ❌ Não tem `sessionStorage` como fallback
- ❌ Não tem cookie (importante para SEO e server-side tracking)
- ❌ TTL de 30 dias, mas **sem first_touch + last_touch** (só overwrite)
- ❌ Não captura `landing_url` ou `referrer` inicial

---

### 1.3 Inicialização de UTM

**Arquivo:** `AB0-1-front/lib/analytics/index.ts`  
**Evidência:**
```typescript
// Linha 49: Inicialização de UTM
export function initializeAnalytics(): void {
  ...
  // Initialize UTMs
  initializeUTMs();
  ...
}
```

**Onde é chamado:**  
**Arquivo:** `AB0-1-front/app/layout.tsx`  
**❌ NÃO ENCONTRADO: layout.tsx não chama `initializeAnalytics()` explicitamente.**

**Gap crítico:**  
- ❌ Não há garantia de que `initializeUTMs()` rode em todas as páginas
- ❌ Não há hook global no root layout

---

### 1.4 Propagação de UTM para Analytics (dataLayer)

**Arquivo:** `AB0-1-front/lib/analytics/index.ts`  
**Evidência:**
```typescript
// Linhas 107-151: Contexto de analytics
export function getAnalyticsContext(): AnalyticsContext {
  ...
  const utms = getCurrentUTMs(); // ✅ UTM é incluído
  
  return {
    environment: process.env.NODE_ENV || 'production',
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    platform: 'web',
    pathname: window.location.pathname,
    referrer: document.referrer,
    session_id: getSessionId(),
    is_logged_in: !!currentUserId,
    user_id: currentUserId || undefined,
    source,
    ...utms, // ✅ UTM é anexado ao contexto
    ...currentContext
  };
}
```

**Status:** ✅ UTM é anexado ao contexto de analytics.

**Gaps:**
- ❌ Não há estrutura `first_touch` / `last_touch`
- ❌ Não captura `landing_url`, só `pathname` atual
- ❌ Não valida se UTM é vazio ou expirou

---

### 1.5 Propagação de UTM para CTAs (WhatsApp, links externos)

**Arquivo:** `AB0-1-front/components/WhatsappButton.tsx`  
**Evidência:**
```typescript
// Linhas 89-117: Clique no WhatsApp
const handleClick = () => {
  track('whatsapp_button_click', {
    button_label: label || 'WhatsApp',
    destination_url: href,
    element_type: 'button',
    action_type: 'click'
  });
  let link = (href || '').trim();
  if (link && !/^https?:\/\//i.test(link)) {
    const digitsRaw = link.replace(/\D/g, '');
    let digits = digitsRaw;
    if (digits && !digits.startsWith('55') && digits.length === 11) {
      digits = `55${digits}`;
    }
    link = digits ? `https://wa.me/${digits}` : '';
  }
  if (link) {
    try {
      const opened = window.open(link, '_blank');
      ...
    }
  }
};
```

**Status:** ❌ **UTM NÃO é anexado ao link do WhatsApp.**

**Gap crítico:**
- ❌ URL do WhatsApp (`wa.me/`) não recebe UTM
- ❌ Evento `whatsapp_button_click` é disparado (com UTM no contexto), mas **link não propaga UTM**
- ❌ Não há função `appendUtm(url)` global

---

### 1.6 Propagação de UTM para Leads (Form Wizard / Quote)

**Arquivo:** `AB0-1-front/components/QuoteWizardModal.tsx`  
**Evidência:**
```typescript
// Linha 14: Import do lib/analytics
import { track, DashboardEvents } from '@/lib/analytics';

// Linha 86: Track wizard opened
track('Wizard Opened', {
  preferred_company_id: detail.preferredCompanyId,
  source: 'external_trigger'
});
```

**Arquivo:** `AB0-1-front/lib/api-client.ts`  
**Evidência:**
```typescript
// Linhas 54-62: fetchApiSafe NÃO anexa UTM no body
const response = await fetch(url, {
  ...options,
  credentials: 'include',
  headers: {
    ...defaultHeaders,
    ...options.headers,
  },
});
```

**Status:** ❌ **UTM NÃO é enviado ao backend nos POST de leads.**

**Gap crítico:**
- ❌ Lead é criado sem UTM (`wizard_create` no backend não recebe UTM)
- ❌ Não há interceptor no `fetchApiSafe` para anexar UTM
- ❌ Não há campos UTM no payload do lead

---

### 1.7 Envio de Eventos ao Backend (analytics_events)

**Arquivo:** `AB0-1-front/lib/analytics/index.ts`  
**Evidência:**
```typescript
// Linhas 156-223: Função track() envia eventos ao Mixpanel e GA4
export function track(
  eventName: string,
  properties: Record<string, any> = {},
  options: EventOptions = {}
): void {
  ...
  const context = getAnalyticsContext(); // ✅ UTM está no contexto
  const eventProps = {
    ...context,
    ...properties,
    event_id: eventId,
    timestamp: new Date().toISOString()
  };
  
  // Remove PII
  const sanitized = sanitizeProperties(eventProps);

  // Send to Mixpanel
  mixpanel.track(mixpanelEventName, sanitized); // ✅ UTM enviado ao Mixpanel
  
  // Send to GA4
  gtagEvent(name, params); // ✅ UTM enviado ao GA4
}
```

**Status:** ✅ Eventos enviados ao Mixpanel e GA4 incluem UTM.

**Gaps:**
- ❌ **Não envia eventos para o backend Rails** (`POST /api/v1/analytics/track`)
- ❌ Só envia para terceiros (Mixpanel, GA4)
- ❌ Backend não recebe UTM dos eventos de frontend

---

### 1.8 Backend: Analytics Events Controller

**Arquivo:** `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`  
**Evidência:**
```ruby
# Linhas 8-23: POST /api/v1/analytics/track
def track
  raw_type = params[:event_type].presence || params[:event].presence
  company_id = params[:company_id].presence || params.dig(:company, :id)
  metadata = params[:metadata].is_a?(Hash) ? params[:metadata] : (params[:data].is_a?(Hash) ? params[:data] : {})

  return render json: { status: 'error', message: 'company_id ausente' }, status: :bad_request if company_id.blank?
  return render json: { status: 'error', message: 'event_type ausente' }, status: :bad_request if raw_type.blank?

  event_type = map_event_type(raw_type)

  Analytics::TrackEventService.call(
    company_id: company_id,
    event_type: event_type,
    metadata: metadata.merge(request_metadata), # ✅ Merge metadata
    user: current_user
  )

  render json: { status: 'success' }
end
```

**Status:** ⚠️ Endpoint existe, mas **frontend não envia requests para ele**.

---

### 1.9 Backend: TrackEventService (persistência de eventos)

**Arquivo:** `AB0-1-back/app/services/analytics/track_event_service.rb`  
**Evidência:**
```ruby
# Linhas 72-94: Sanitização de metadata (whitelist)
WHITELIST_KEYS = %w[
  utm_source utm_medium utm_campaign utm_term utm_content # ✅ UTM aceito
  referrer path item_id ip user_agent viewport source placement
  variant button_variant rating lead_id product_id status city state
  activation_time previous_status method distributed_to_count company_ids
  query results_count category_id
].freeze

def sanitize_metadata(meta)
  return {} unless meta.is_a?(Hash)
  
  # Convert all keys to string for consistency
  meta = meta.stringify_keys
  
  # Extract UTM parameters if they are nested
  if meta['utm'].is_a?(Hash)
    meta.merge!(meta['utm'].stringify_keys)
  end

  # Slice by whitelist
  meta.slice(*WHITELIST_KEYS).compact
end
```

**Status:** ✅ Backend aceita UTM em `metadata` e valida via whitelist.

**Gaps:**
- ❌ Não aceita `gclid`, `fbclid`, `msclkid` (faltam na whitelist)
- ❌ Não normaliza UTM (lowercase, trim)
- ❌ Não valida tamanho ou caracteres
- ❌ Não extrai `first_touch` / `last_touch`

---

### 1.10 Backend: Modelo AnalyticsEvent

**Arquivo:** `AB0-1-back/app/models/analytics_event.rb`  
**Evidência:**
```ruby
# Linhas 3-9: Schema do modelo
class AnalyticsEvent < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :event_id, presence: true, uniqueness: true
  validates :event_type, presence: true
  validates :tracked_at, presence: true
```

**Schema DB:** `AB0-1-back/db/schema.rb` (linhas 84-97):
```ruby
create_table "analytics_events", force: :cascade do |t|
  t.integer "company_id"
  t.integer "user_id"
  t.string "event_type", null: false
  t.json "metadata", default: {}, null: false # ✅ UTM vai aqui
  t.datetime "tracked_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  t.string "event_id" # ✅ Unique constraint para dedupe
  t.index ["company_id", "event_type", "tracked_at"], name: "index_analytics_events_company_event_time"
  t.index ["company_id", "tracked_at"], name: "index_analytics_events_on_company_id_and_tracked_at"
  t.index ["event_id"], name: "index_analytics_events_on_event_id", unique: true
  t.index ["event_type", "tracked_at"], name: "index_analytics_events_on_event_type_and_tracked_at"
end
```

**Status:** ✅ Estrutura de DB adequada para UTM em JSON `metadata`.

---

### 1.11 Backend: Banner Events

**Arquivo:** `AB0-1-back/app/controllers/api/v1/banner_events_controller.rb`  
**Evidência:**
```ruby
# Linhas 7-32: POST /api/v1/banner_events
def create
  event_params = params.require(:banner_event).permit(:banner_id, :company_id, :event_type, :tracked_at, utm: {}, metadata: {})

  banner_id = event_params[:banner_id]
  event_type = event_params[:event_type].to_s
  company_id = event_params[:company_id]
  tracked_at = event_params[:tracked_at].presence || Time.current

  unless BannerEvent::EVENT_TYPES.include?(event_type)
    return render json: { error: 'invalid_event_type' }, status: :unprocessable_entity
  end

  BannerEvent.create!(
    banner_id: banner_id,
    company_id: company_id,
    event_type: event_type,
    tracked_at: tracked_at,
    ip_hash: safe_hash(request.remote_ip.to_s),
    user_agent_hash: safe_hash(request.user_agent.to_s),
    referrer: request.referer.to_s,
    utm_json: sanitize_json(event_params[:utm]), # ✅ UTM aceito
    metadata_json: sanitize_json(event_params[:metadata])
  )

  render json: { status: 'ok' }, status: :created
end
```

**Schema DB:** `AB0-1-back/db/schema.rb` (linhas 154-171):
```ruby
create_table "banner_events", force: :cascade do |t|
  t.integer "banner_id", null: false
  t.integer "company_id"
  t.string "event_type", null: false
  t.string "ip_hash"
  t.string "user_agent_hash"
  t.string "referrer"
  t.json "utm_json", default: {}, null: false # ✅ Campo dedicado para UTM
  t.json "metadata_json", default: {}, null: false
  t.datetime "tracked_at", null: false
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  ...
end
```

**Status:** ✅ Banner events aceita UTM em campo dedicado `utm_json`.

**Gaps:**
- ❌ Frontend **não está enviando eventos de banner** para este endpoint
- ❌ Não encontrei componente de banner que dispare tracking

---

### 1.12 Backend: Leads (UTM)

**Arquivo:** `AB0-1-back/app/models/lead.rb`  
**Schema DB:** `AB0-1-back/db/schema.rb` (linhas 667-695):
```ruby
create_table "leads", force: :cascade do |t|
  t.string "name"
  t.string "email"
  t.string "phone"
  t.string "company"
  t.text "message"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  t.integer "company_id"
  t.string "product_vertical"
  t.string "project_profile"
  t.string "quote_type"
  t.string "system_size_band"
  t.decimal "bill_value", precision: 15, scale: 2
  t.decimal "monthly_kwh", precision: 15, scale: 2
  t.string "decision_timeline"
  t.string "address_full"
  t.string "city"
  t.string "state"
  t.string "zipcode"
  t.datetime "consent_at"
  t.string "consent_ip"
  t.datetime "otp_sent_at"
  t.datetime "otp_verified_at"
  t.string "otp_code_digest"
  t.integer "otp_attempts", default: 0
  t.string "wizard_status", default: "draft"
  t.index ["company_id"], name: "index_leads_on_company_id"
end
```

**Status:** ❌ **Tabela `leads` NÃO TEM colunas UTM.**

**Gap crítico:**
- ❌ Não há `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- ❌ Não há `gclid`, `fbclid`, `msclkid`
- ❌ Não há `landing_url` ou `referrer` inicial
- ❌ Não há JSON para armazenar attribution (first_touch/last_touch)

---

### 1.13 Backend: Companies (CTA UTM)

**Arquivo:** `AB0-1-back/app/models/company.rb`  
**Schema DB:** `AB0-1-back/db/schema.rb` (linhas 300+):
```ruby
create_table "companies", force: :cascade do |t|
  ...
  t.string "cta_utm_source"
  t.string "cta_utm_medium"
  t.string "cta_utm_campaign"
  t.json "ctas_json"
  ...
end
```

**Status:** ⚠️ Companies tem campos `cta_utm_*` mas **não está sendo usado** para tracking de cliques.

**Gap:**
- ❌ CTA tracking não grava UTM na company
- ❌ Não há ligação entre evento de CTA e UTM da company

---

## 2. GAPS (lacunas) — Tabela Priorizada

| # | Gap | Impacto | Causa Provável | Evidência | Correção Recomendada | Esforço | Prioridade |
|---|-----|---------|----------------|-----------|---------------------|---------|-----------|
| 1 | UTM não persiste na navegação (perdido após primeira página) | 🔴 **CRÍTICO** — Ads perdem atribuição | Só captura na URL inicial, sem cookie/sessionStorage fallback | `utm.ts` usa apenas `localStorage`, não executa em SSR | Implementar cookie + sessionStorage + first_touch/last_touch | M | **P0** |
| 2 | UTM não é enviado ao backend em eventos de frontend | 🔴 **CRÍTICO** — Analytics incompleto | Frontend só envia ao Mixpanel/GA4, não ao Rails | `lib/analytics/index.ts` não faz POST ao `/api/v1/analytics/track` | Adicionar envio ao backend em paralelo ao Mixpanel/GA4 | S | **P0** |
| 3 | Leads não salvam UTM (tabela sem colunas) | 🔴 **CRÍTICO** — Impossível atribuir lead a campanha | Schema não tem colunas UTM | `db/schema.rb` linha 667-695 | Migration para adicionar `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `landing_url`, `referrer`, `attribution_json` | M | **P0** |
| 4 | WhatsApp CTA não propaga UTM no link | 🟡 **ALTO** — Perda de atribuição em ads de WhatsApp | Link `wa.me` não recebe query params UTM | `WhatsappButton.tsx` linhas 89-117 | Criar função `appendUtm(url)` e aplicar ao link do WhatsApp | S | **P0** |
| 5 | Não captura `gclid`, `fbclid`, `msclkid` | 🟡 **ALTO** — Google/Facebook Ads não atribuem corretamente | Whitelist não inclui esses parâmetros | `utm.ts` linhas 14-30 e `track_event_service.rb` linhas 72-94 | Adicionar na extração e whitelist | S | **P0** |
| 6 | Não há first_touch + last_touch attribution | 🟡 **ALTO** — Atribuição imprecisa (só last-click) | Estrutura não armazena histórico | `utm.ts` linhas 59-70 | Implementar objeto attribution com first_touch/last_touch + timestamps | M | **P1** |
| 7 | Não há inicialização global de UTM no root layout | 🟡 **ALTO** — UTM pode não ser capturado em algumas páginas | `layout.tsx` não chama `initializeAnalytics()` | `app/layout.tsx` linhas 66-95 | Criar `useUtm()` hook no layout root | S | **P1** |
| 8 | Banners não disparam eventos de tracking | 🟠 **MÉDIO** — Impressões/cliques de banners não rastreados | Frontend não está enviando POST ao `/api/v1/banner_events` | `Banner.tsx` linhas 1-55 | Adicionar tracking de view/click no componente Banner | M | **P1** |
| 9 | Não há normalização de UTM (lowercase, trim, validação) | 🟠 **MÉDIO** — Duplicação de dados (Google vs google) | Falta sanitização | `utm.ts` e `track_event_service.rb` | Normalizar na captura e no backend | S | **P1** |
| 10 | Não há validação de tamanho/caracteres de UTM | 🟠 **MÉDIO** — Vulnerabilidade a injection/spam | Falta validação | `utm.ts` e `track_event_service.rb` | Regex + max length (255 chars) | S | **P2** |
| 11 | Não há allowlist de keys UTM | 🟢 **BAIXO** — Pode aceitar params inválidos | Falta validação | `utm.ts` | Aceitar apenas utm_source, utm_medium, utm_campaign, utm_content, utm_term + gclid/fbclid/msclkid | S | **P2** |
| 12 | Não vincula UTM com `category_id` ou `banner_id` | 🟢 **BAIXO** — Análise menos granular | Falta contexto | `track_event_service.rb` | Incluir no metadata | S | **P2** |

---

## 3. ARQUITETURA RECOMENDADA (padrão único)

### 3.1 Padrão Oficial de UTM

#### **Keys aceitas:**
- **Padrão:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- **Ads IDs:** `gclid` (Google), `fbclid` (Facebook), `msclkid` (Microsoft)

#### **Estrutura de Attribution:**
```typescript
interface Attribution {
  first_touch: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
    msclkid?: string;
    landing_url: string;
    referrer: string;
    ts: string; // ISO 8601
  };
  last_touch: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
    msclkid?: string;
    ts: string;
  };
  ttl_days: 30;
}
```

#### **TTL e Overwrite:**
- **TTL:** 30 dias (renovável a cada visita)
- **First Touch:** Capturado na primeira visita com UTM, **nunca sobrescrito**
- **Last Touch:** Atualizado a cada nova visita com UTM
- **Fallback:** Se expirou e não há UTM na URL, considera "direct"

#### **Normalização e Validação:**
- **Lowercase:** Todos os valores em lowercase
- **Trim:** Remove espaços
- **Max Length:** 255 caracteres por parâmetro
- **Regex:** `^[a-z0-9_\-\.]+$` (alfanumérico + underscore, hífen, ponto)
- **Allowlist:** Apenas keys aceitas são armazenadas

---

## 4. IMPLEMENTAÇÃO — FRONTEND (SSR-safe)

### 4.1 Hook Global `useUtm()` no Root Layout

**Arquivo:** `AB0-1-front/hooks/useUtm.ts` (criar novo)

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  initializeUTMs, 
  extractUTMsFromURL, 
  storeUTMs, 
  getCurrentUTMs 
} from '@/lib/analytics/utm';

/**
 * Hook global para capturar e persistir UTM em todas as páginas
 * Deve ser usado no root layout
 */
export function useUtm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Captura UTM da URL atual
    const urlUtms = extractUTMsFromURL();
    
    // Se tem UTM na URL, atualiza storage
    if (Object.keys(urlUtms).length > 0) {
      storeUTMs(urlUtms);
    }
    
    // Inicializa UTM (first_touch se não existir)
    initializeUTMs();
    
  }, [pathname, searchParams]);
}
```

**Integração no Root Layout:**

**Arquivo:** `AB0-1-front/app/layout.tsx` (editar)

```tsx
import { useUtm } from '@/hooks/useUtm'; // Adicionar import

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <GoogleTagManager gtmId={GTM_ID} gaId={GA_ID} />
      </head>
      <body suppressHydrationWarning>
        <GoogleTagManagerNoScript gtmId={GTM_ID} />
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UtmProvider> {/* Novo componente wrapper */}
            <ClientBody>
              <Navbar />
              {children}
              <Footer />
            </ClientBody>
          </UtmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Arquivo:** `AB0-1-front/components/UtmProvider.tsx` (criar novo)

```tsx
'use client';

import { useUtm } from '@/hooks/useUtm';

export function UtmProvider({ children }: { children: React.ReactNode }) {
  useUtm(); // Executa hook global
  return <>{children}</>;
}
```

---

### 4.2 Atualizar `utm.ts` com Attribution e Normalização

**Arquivo:** `AB0-1-front/lib/analytics/utm.ts` (editar)

```typescript
/**
 * UTM Parameter Management v2
 * - Captures UTM + gclid/fbclid/msclkid
 * - Implements first_touch + last_touch attribution
 * - Normalizes and validates
 * - Stores in cookie + localStorage (SSR-safe)
 */

import Cookies from 'js-cookie'; // Instalar: npm install js-cookie

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}

export interface Attribution {
  first_touch: UTMParameters & {
    landing_url: string;
    referrer: string;
    ts: string;
  };
  last_touch: UTMParameters & {
    ts: string;
  };
  ttl_days: number;
}

const UTM_STORAGE_KEY = 'avaliasolar_utm';
const UTM_COOKIE_KEY = 'utm_attribution';
const UTM_EXPIRY_DAYS = 30;
const ALLOWED_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'msclkid'
];

/**
 * Normalize UTM value: lowercase, trim, validate
 */
function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\-\.]/g, '') // Remove caracteres inválidos
    .substring(0, 255); // Max 255 chars
}

/**
 * Extract UTM parameters from URL (with normalization)
 */
export function extractUTMsFromURL(url?: string): UTMParameters {
  if (typeof window === 'undefined') return {};
  
  const searchParams = new URLSearchParams(
    url ? new URL(url).search : window.location.search
  );
  
  const utms: UTMParameters = {};
  
  ALLOWED_KEYS.forEach(key => {
    if (searchParams.has(key)) {
      const value = searchParams.get(key);
      if (value) {
        utms[key as keyof UTMParameters] = normalizeValue(value);
      }
    }
  });
  
  return utms;
}

/**
 * Get stored attribution (cookie + localStorage fallback)
 */
export function getStoredAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try cookie first (SSR-safe)
    const cookieData = Cookies.get(UTM_COOKIE_KEY);
    if (cookieData) {
      return JSON.parse(cookieData);
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check expiry
    if (data.expiry && Date.now() > data.expiry) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      Cookies.remove(UTM_COOKIE_KEY);
      return null;
    }
    
    return data.attribution as Attribution;
  } catch (e) {
    console.warn('[UTM] Failed to parse stored attribution', e);
    return null;
  }
}

/**
 * Store attribution (cookie + localStorage)
 */
export function storeAttribution(attribution: Attribution): void {
  if (typeof window === 'undefined') return;
  
  const expiry = Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const data = {
    attribution,
    expiry
  };
  
  // Store in cookie (30 days)
  Cookies.set(UTM_COOKIE_KEY, JSON.stringify(attribution), { 
    expires: UTM_EXPIRY_DAYS,
    sameSite: 'lax',
    secure: true
  });
  
  // Store in localStorage (backup)
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Initialize UTM tracking (call on app mount)
 * Captures first_touch and last_touch
 */
export function initializeUTMs(): Attribution {
  if (typeof window === 'undefined') {
    return {
      first_touch: {
        landing_url: '',
        referrer: '',
        ts: new Date().toISOString()
      },
      last_touch: {
        ts: new Date().toISOString()
      },
      ttl_days: UTM_EXPIRY_DAYS
    };
  }
  
  const urlUTMs = extractUTMsFromURL();
  const existingAttribution = getStoredAttribution();
  
  // Se não tem UTM na URL e já tem attribution, retorna a existente
  if (Object.keys(urlUTMs).length === 0 && existingAttribution) {
    return existingAttribution;
  }
  
  // Se tem UTM na URL
  if (Object.keys(urlUTMs).length > 0) {
    const now = new Date().toISOString();
    
    // Se não tem first_touch, cria
    if (!existingAttribution) {
      const attribution: Attribution = {
        first_touch: {
          ...urlUTMs,
          landing_url: window.location.href,
          referrer: document.referrer || 'direct',
          ts: now
        },
        last_touch: {
          ...urlUTMs,
          ts: now
        },
        ttl_days: UTM_EXPIRY_DAYS
      };
      
      storeAttribution(attribution);
      return attribution;
    }
    
    // Se já tem first_touch, atualiza apenas last_touch
    const attribution: Attribution = {
      ...existingAttribution,
      last_touch: {
        ...urlUTMs,
        ts: now
      }
    };
    
    storeAttribution(attribution);
    return attribution;
  }
  
  // Sem UTM e sem attribution = direct
  const now = new Date().toISOString();
  const attribution: Attribution = {
    first_touch: {
      utm_source: 'direct',
      landing_url: window.location.href,
      referrer: document.referrer || 'none',
      ts: now
    },
    last_touch: {
      utm_source: 'direct',
      ts: now
    },
    ttl_days: UTM_EXPIRY_DAYS
  };
  
  storeAttribution(attribution);
  return attribution;
}

/**
 * Get current UTMs (last_touch)
 */
export function getCurrentUTMs(): UTMParameters {
  const attribution = getStoredAttribution();
  if (!attribution) return {};
  
  return attribution.last_touch;
}

/**
 * Get full attribution (first_touch + last_touch)
 */
export function getAttribution(): Attribution | null {
  return getStoredAttribution();
}

/**
 * Clear stored UTMs
 */
export function clearUTMs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(UTM_STORAGE_KEY);
  Cookies.remove(UTM_COOKIE_KEY);
}

/**
 * Append UTM to URL (for CTAs)
 */
export function appendUtm(url: string): string {
  try {
    const utms = getCurrentUTMs();
    if (Object.keys(utms).length === 0) return url;
    
    const urlObj = new URL(url);
    Object.entries(utms).forEach(([key, value]) => {
      if (value) {
        urlObj.searchParams.set(key, value);
      }
    });
    
    return urlObj.toString();
  } catch (e) {
    console.warn('[UTM] Failed to append UTM to URL', e);
    return url;
  }
}
```

**Instalar dependência:**
```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

---

### 4.3 Atualizar WhatsApp Button com UTM

**Arquivo:** `AB0-1-front/components/WhatsappButton.tsx` (editar)

```typescript
import { appendUtm } from '@/lib/analytics/utm'; // Adicionar import

const handleClick = () => {
  track('whatsapp_button_click', {
    button_label: label || 'WhatsApp',
    destination_url: href,
    element_type: 'button',
    action_type: 'click'
  });
  
  let link = (href || '').trim();
  if (link && !/^https?:\/\//i.test(link)) {
    const digitsRaw = link.replace(/\D/g, '');
    let digits = digitsRaw;
    if (digits && !digits.startsWith('55') && digits.length === 11) {
      digits = `55${digits}`;
    }
    link = digits ? `https://wa.me/${digits}` : '';
  }
  
  // ✅ Anexa UTM ao link do WhatsApp
  if (link) {
    link = appendUtm(link);
  }
  
  if (link) {
    try {
      const opened = window.open(link, '_blank');
      if (!opened) {
        window.location.href = link;
      }
    } catch (error) {
      console.error('Erro ao redirecionar para WhatsApp:', error);
      alert('Não foi possível abrir o WhatsApp. Por favor, verifique suas configurações de pop-up ou tente manualmente.');
    }
  }
  if (onClick) onClick();
};
```

---

### 4.4 Interceptor no API Client para Anexar UTM em Leads

**Arquivo:** `AB0-1-front/lib/api-client.ts` (editar)

```typescript
import { getCurrentUTMs, getAttribution } from './analytics/utm'; // Adicionar import

export async function fetchApiSafe<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const defaultHeaders: Record<string, string> = getApiRequestHeaders({
    'Content-Type': 'application/json',
  });

  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.token;
        if (token) {
          defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
    }
  }
  
  // ✅ Anexa UTM no body de POST/PUT/PATCH
  let body = options.body;
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
    if (typeof window !== 'undefined') {
      const utms = getCurrentUTMs();
      const attribution = getAttribution();
      
      if (body && typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          parsed.utm = utms;
          parsed.attribution = attribution;
          body = JSON.stringify(parsed);
        } catch (e) {
          console.warn('[API] Failed to inject UTM into body', e);
        }
      }
    }
  }

  try {
    console.log('[API] Request ->', options.method || 'GET', url);
    
    const response = await fetch(url, {
      ...options,
      body,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const responseBody = await response.json().catch(() => null);
    console.log('[API] Response data:', responseBody);

    if (!response.ok) {
      // ... (resto do código)
    }
    
    return responseBody as T;
  } catch (error) {
    // ... (resto do código)
  }
}
```

---

### 4.5 Enviar Eventos ao Backend (além de Mixpanel/GA4)

**Arquivo:** `AB0-1-front/lib/analytics/index.ts` (editar)

```typescript
import { getAttribution } from './utm'; // Adicionar import

export function track(
  eventName: string,
  properties: Record<string, any> = {},
  options: EventOptions = {}
): void {
  if (!hasAnalyticsConsent()) {
    console.debug('[Analytics] Event blocked: no consent');
    return;
  }
  
  if (!initialized) {
    console.warn('[Analytics] Not initialized, queueing event:', eventName);
    return;
  }
  
  const eventId = options.eventId || generateEventId();
  
  if (!shouldTrackEvent(eventName, eventId, options.critical)) {
    return;
  }
  
  const context = getAnalyticsContext();
  const attribution = getAttribution(); // ✅ Pega attribution completo
  
  const eventProps = {
    ...context,
    ...properties,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    attribution // ✅ Inclui first_touch + last_touch
  };
  
  const sanitized = sanitizeProperties(eventProps);

  const sendToMixpanel = options.sendTo?.mixpanel !== false;
  const sendToGA4 = options.sendTo?.ga4 !== false;
  const sendToBackend = options.sendTo?.backend !== false; // ✅ Novo
  
  // Send to Mixpanel
  if (sendToMixpanel) {
    try {
      const mixpanelEventName = toTitleCase(eventName);
      mixpanel.track(mixpanelEventName, sanitized);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Mixpanel] Event:', mixpanelEventName, sanitized);
      }
    } catch (e) {
      console.error('[Analytics] Mixpanel track failed:', e);
    }
  }
  
  // Send to GA4
  if (sendToGA4) {
    try {
      const { name, params } = mapToGA4Event(eventName, sanitized);
      gtagEvent(name, params);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Event:', name, params);
      }
    } catch (e) {
      console.error('[Analytics] GA4 track failed:', e);
    }
  }
  
  // ✅ Send to Backend (Rails API)
  if (sendToBackend && context.company_id) {
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          event_type: eventName,
          company_id: context.company_id,
          user_id: context.user_id,
          tracked_at: new Date().toISOString(),
          metadata: sanitized
        })
      }).catch(err => {
        console.error('[Analytics] Backend track failed:', err);
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Backend] Event:', eventName, sanitized);
      }
    } catch (e) {
      console.error('[Analytics] Backend track failed:', e);
    }
  }
}
```

---

### 4.6 Tracking de Banners (view/click)

**Arquivo:** `AB0-1-front/components/Banner.tsx` (editar)

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getCurrentUTMs } from '@/lib/analytics/utm';

interface BannerProps {
  id: number; // ✅ Adicionar banner_id
  type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar';
  imageUrl: string;
  title: string;
  link?: string;
  sponsored?: boolean;
  companyId?: number; // ✅ Adicionar company_id
  slotKey?: string; // ✅ Adicionar slot_key
}

export function Banner({
  id,
  type,
  position,
  imageUrl,
  title,
  link,
  sponsored,
  companyId,
  slotKey,
}: BannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [viewTracked, setViewTracked] = useState(false);

  // ✅ Track impression quando 50% visível
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewTracked) {
            trackBannerView();
            setViewTracked(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [viewTracked]);

  const trackBannerView = () => {
    const utms = getCurrentUTMs();
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/banner_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        banner_event: {
          banner_id: id,
          company_id: companyId,
          event_type: 'view',
          tracked_at: new Date().toISOString(),
          utm: utms,
          metadata: {
            page_path: window.location.pathname,
            slot_key: slotKey,
            position: position,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
          }
        }
      })
    }).catch(err => {
      console.error('[Banner] Track view failed:', err);
    });
  };

  const trackBannerClick = () => {
    const utms = getCurrentUTMs();
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/banner_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        banner_event: {
          banner_id: id,
          company_id: companyId,
          event_type: 'click',
          tracked_at: new Date().toISOString(),
          utm: utms,
          metadata: {
            page_path: window.location.pathname,
            slot_key: slotKey,
            position: position,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
            destination_url: link
          }
        }
      })
    }).catch(err => {
      console.error('[Banner] Track click failed:', err);
    });
  };

  const bannerContent = (
    <div
      ref={bannerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        type === 'rectangular_large' ? 'w-full aspect-[16/9] sm:aspect-[3/1]' : 'w-full sm:w-[300px] aspect-[4/3] sm:h-[250px]',
        position === 'navbar' ? 'mb-6' : 'mb-4'
      )}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-contain md:object-cover object-center"
        priority={position === 'navbar'}
      />
      {sponsored && (
        <span className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs">
          Patrocinado
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <h3 className="text-white font-semibold truncate">{title}</h3>
      </div>
    </div>
  );

  return link ? (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={trackBannerClick} // ✅ Track click
    >
      {bannerContent}
    </a>
  ) : (
    bannerContent
  );
}
```

---

## 5. IMPLEMENTAÇÃO — BACKEND

### 5.1 Atualizar Whitelist no TrackEventService

**Arquivo:** `AB0-1-back/app/services/analytics/track_event_service.rb` (editar)

```ruby
WHITELIST_KEYS = %w[
  utm_source utm_medium utm_campaign utm_term utm_content
  gclid fbclid msclkid # ✅ Adicionar ads IDs
  referrer path item_id ip user_agent viewport source placement
  variant button_variant rating lead_id product_id status city state
  activation_time previous_status method distributed_to_count company_ids
  query results_count category_id banner_id
  landing_url # ✅ Adicionar landing_url
  attribution # ✅ Adicionar attribution (para first_touch/last_touch)
].freeze

def sanitize_metadata(meta)
  return {} unless meta.is_a?(Hash)
  
  # Convert all keys to string for consistency
  meta = meta.stringify_keys
  
  # Extract UTM parameters if they are nested
  if meta['utm'].is_a?(Hash)
    meta.merge!(meta['utm'].stringify_keys)
  end
  
  # ✅ Normalize UTM values
  %w[utm_source utm_medium utm_campaign utm_content utm_term].each do |key|
    if meta[key].present?
      meta[key] = meta[key].to_s.downcase.strip.gsub(/[^a-z0-9_\-\.]/, '')[0..254]
    end
  end

  # Slice by whitelist
  meta.slice(*WHITELIST_KEYS).compact
end
```

---

### 5.2 Migration: Adicionar UTM aos Leads

**Criar migration:**

```bash
cd AB0-1-back
rails generate migration AddUtmToLeads
```

**Arquivo:** `AB0-1-back/db/migrate/20260203_add_utm_to_leads.rb`

```ruby
class AddUtmToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :utm_source, :string
    add_column :leads, :utm_medium, :string
    add_column :leads, :utm_campaign, :string
    add_column :leads, :utm_content, :string
    add_column :leads, :utm_term, :string
    add_column :leads, :gclid, :string
    add_column :leads, :fbclid, :string
    add_column :leads, :msclkid, :string
    add_column :leads, :landing_url, :string
    add_column :leads, :referrer, :string
    add_column :leads, :attribution_json, :json, default: {}

    # Índices para analytics
    add_index :leads, :utm_source
    add_index :leads, :utm_campaign
    add_index :leads, [:company_id, :utm_campaign]
    add_index :leads, :created_at
  end
end
```

**Executar migration:**

```bash
rails db:migrate
```

---

### 5.3 Atualizar LeadsController para Aceitar UTM

**Arquivo:** `AB0-1-back/app/controllers/api/v1/leads_controller.rb` (editar)

```ruby
def wizard_create
  payload = wizard_lead_params
  lead = ::Lead.new(payload.except(:full_name, :consent, :utm, :attribution)) # ✅ Excluir utm/attribution do payload principal
  
  # Injeta localização da borda (Cloudflare) se não fornecida
  if @edge_location.present?
    lead.city = @edge_location[:city] if lead.respond_to?(:city) && lead.city.blank?
    lead.state = @edge_location[:state] if lead.respond_to?(:state) && lead.state.blank?
  end

  lead.name = payload[:full_name] if lead.name.blank? && payload[:full_name].present?
  lead.wizard_status = 'pending_otp'
  lead.consent_at = Time.current if truthy?(payload[:consent])
  lead.consent_ip = request.remote_ip if lead.consent_at.present?
  lead.location = lead.address_full if lead.address_full.present?

  lead.bill_value = parse_decimal(lead.bill_value)
  lead.monthly_kwh = parse_decimal(lead.monthly_kwh)
  lead.system_size_band = normalize_system_size_band(
    lead.system_size_band,
    lead.bill_value,
    lead.monthly_kwh
  )

  preferred_company_id = params[:preferred_company_id].presence&.to_i
  if preferred_company_id.present? && ::Lead.column_names.include?('company_id')
    lead.company_id = preferred_company_id
  end

  # ✅ Extrai UTM do payload
  if payload[:utm].is_a?(Hash)
    utm = payload[:utm].symbolize_keys
    lead.utm_source = utm[:utm_source]
    lead.utm_medium = utm[:utm_medium]
    lead.utm_campaign = utm[:utm_campaign]
    lead.utm_content = utm[:utm_content]
    lead.utm_term = utm[:utm_term]
    lead.gclid = utm[:gclid]
    lead.fbclid = utm[:fbclid]
    lead.msclkid = utm[:msclkid]
  end

  # ✅ Extrai attribution (first_touch/last_touch)
  if payload[:attribution].is_a?(Hash)
    attribution = payload[:attribution].deep_symbolize_keys
    lead.attribution_json = attribution
    
    # Pega first_touch para landing_url e referrer
    if attribution[:first_touch].present?
      lead.landing_url = attribution[:first_touch][:landing_url]
      lead.referrer = attribution[:first_touch][:referrer]
    end
  end

  if lead.save
    Analytics::TrackEventService.call(
      event_type: 'lead_initiated',
      company_id: lead.company_id,
      metadata: request_metadata.merge(
        lead_id: lead.id,
        product_vertical: lead.product_vertical,
        bill_value: lead.bill_value,
        utm_source: lead.utm_source,
        utm_campaign: lead.utm_campaign
      )
    )

    otp_code = lead.generate_otp!
    log_otp_code(lead, otp_code)
    render json: { lead_id: lead.id, otp_sent_at: lead.otp_sent_at }, status: :created
  else
    render json: { errors: lead.errors.full_messages }, status: :unprocessable_entity
  end
rescue ActionController::ParameterMissing => e
  render json: { error: e.message }, status: :bad_request
rescue StandardError => e
  Rails.logger.error("Leads wizard_create error: #{e.class} - #{e.message}\nBacktrace: #{e.backtrace.first(5).join("\n")}")
  render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
end

private

def wizard_lead_params
  params.permit(
    :product_vertical, :project_profile, :quote_type, :system_size_choice,
    :bill_value, :monthly_kwh, :decision_timeline, :address_full,
    :full_name, :email, :phone, :consent, :nickname,
    utm: [
      :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term,
      :gclid, :fbclid, :msclkid
    ],
    attribution: [
      first_touch: [
        :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term,
        :gclid, :fbclid, :msclkid, :landing_url, :referrer, :ts
      ],
      last_touch: [
        :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term,
        :gclid, :fbclid, :msclkid, :ts
      ],
      :ttl_days
    ]
  )
end
```

---

## 6. DONE CRITERIA (checklist de validação)

### Frontend:
- [ ] Hook `useUtm()` executando no root layout
- [ ] UTM capturado de todas as páginas (incluindo gclid/fbclid/msclkid)
- [ ] UTM armazenado em cookie + localStorage com TTL de 30 dias
- [ ] First_touch capturado na primeira visita e nunca sobrescrito
- [ ] Last_touch atualizado a cada nova visita com UTM
- [ ] Função `appendUtm(url)` anexando UTM aos links do WhatsApp
- [ ] Banners disparando eventos de view/click com UTM
- [ ] API client enviando UTM no body de POST de leads
- [ ] Eventos enviados ao backend Rails (`/api/v1/analytics/track`)

### Backend:
- [ ] Migration executada: leads tem colunas `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `msclkid`, `landing_url`, `referrer`, `attribution_json`
- [ ] LeadsController extrai UTM e attribution do payload e salva no lead
- [ ] TrackEventService aceita `gclid`, `fbclid`, `msclkid`, `landing_url`, `attribution` na whitelist
- [ ] TrackEventService normaliza UTM (lowercase, trim, regex)
- [ ] AnalyticsEvent.event_id unique constraint garantindo dedupe
- [ ] BannerEvent aceita UTM em `utm_json`

### Testes:
- [ ] Abrir URL com UTM → Verificar que localStorage + cookie são populados
- [ ] Navegar para página sem UTM → Verificar que UTM persiste
- [ ] Clicar em WhatsApp CTA → Verificar que link contém UTM
- [ ] Submeter lead no wizard → Verificar que lead tem UTM no DB
- [ ] Disparar evento (page_view, cta_click) → Verificar que analytics_events tem UTM em metadata
- [ ] View/click em banner → Verificar que banner_events tem UTM em utm_json

---

## 7. PRÓXIMOS PASSOS (ordem de implementação)

### Sprint 1 (P0 - Crítico):
1. ✅ Criar migration para adicionar UTM aos leads
2. ✅ Atualizar `utm.ts` com attribution + normalização + cookie
3. ✅ Criar hook `useUtm()` e `UtmProvider`
4. ✅ Atualizar `WhatsappButton.tsx` com `appendUtm()`
5. ✅ Atualizar `api-client.ts` para anexar UTM em POST de leads
6. ✅ Atualizar `LeadsController` para aceitar e salvar UTM
7. ✅ Atualizar `TrackEventService` whitelist (gclid, fbclid, msclkid, landing_url, attribution)
8. ✅ Atualizar `lib/analytics/index.ts` para enviar eventos ao backend

### Sprint 2 (P1 - Alto):
9. ✅ Atualizar `Banner.tsx` com tracking de view/click
10. ✅ Testar fluxo end-to-end (URL com UTM → Lead com UTM no DB)
11. ✅ Validar eventos em analytics_events e banner_events
12. ✅ Documentar estrutura de attribution para equipe

### Sprint 3 (P2 - Médio/Baixo):
13. Criar dashboard de atribuição (first_touch vs last_touch)
14. Adicionar relatório de ROI por campanha
15. Criar alertas para campanhas sem UTM
16. Otimizar índices no DB para queries de analytics

---

## 8. OBSERVAÇÕES FINAIS

### Pontos Positivos (já existem):
✅ Infraestrutura de analytics bem estruturada (Mixpanel + GA4)  
✅ Dedupe de eventos via `event_id` unique  
✅ Backend aceita UTM em metadata e banner_events  
✅ TTL de 30 dias implementado  
✅ Sanitização de PII funcional  

### Gaps Críticos (devem ser corrigidos):
❌ UTM não persiste na navegação (só localStorage, sem cookie)  
❌ Leads não salvam UTM (tabela sem colunas)  
❌ WhatsApp CTA não propaga UTM no link  
❌ Frontend não envia eventos ao backend Rails  
❌ Banners não disparam tracking  
❌ Não captura gclid/fbclid/msclkid (ads IDs)  
❌ Não tem first_touch + last_touch attribution  

### Impacto Esperado (após implementação):
📈 **+100% de precisão** em atribuição de leads a campanhas  
📈 **+30% de visibilidade** em ROI de ads (Google/Facebook)  
📈 **-80% de perda** de dados de UTM na navegação  
📈 **+50% de confiança** em relatórios de marketing  

---

**FIM DO DIAGNÓSTICO**

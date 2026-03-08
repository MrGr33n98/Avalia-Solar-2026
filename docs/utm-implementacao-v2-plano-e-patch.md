# UTM v2 – Plano e Patch (Avalia Solar)

## 1) Resumo (P0/P1)
- **P0**: Persistência UTM v2 (first/last touch + TTL 30d) em cookie/local/session, captura SSR-safe, sanitização LGPD (sem query/PII), appendUtm robusto, track enviando ao backend com dedupe event_id, banner/WhatsApp/analytics enviando utm + attribution.
- **P1**: Injeção seletiva de UTM em APIs de lead wizard/analytics/banner, tracking de banners com view/click (IntersectionObserver 50%), eventos globais sem company_id aceitos no backend, leads gravando colunas UTM + attribution_json.

## 2) Arquivos alterados
- `AB0-1-front/lib/analytics/cookies.ts`
- `AB0-1-front/lib/analytics/types.ts`
- `AB0-1-front/lib/analytics/utm.ts`
- `AB0-1-front/hooks/useUtm.ts`
- `AB0-1-front/components/UtmProvider.tsx`
- `AB0-1-front/app/layout.tsx`
- `AB0-1-front/lib/analytics/index.ts`
- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/components/WhatsappButton.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyHero.tsx`
- `AB0-1-front/app/companies/[id]/components/StickyCTA.tsx`
- `AB0-1-front/components/Banner.tsx`
- `AB0-1-back/app/services/analytics/track_event_service.rb`
- `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`
- `AB0-1-back/app/controllers/api/v1/base_controller.rb`
- `AB0-1-back/app/controllers/api/v1/banner_events_controller.rb`
- `AB0-1-back/app/controllers/api/v1/leads_controller.rb`
- `AB0-1-back/app/models/lead.rb`
- `AB0-1-back/db/migrate/20260203000000_add_utm_fields_to_leads.rb`

## 3) Patch de código (por arquivo)

### Frontend
#### `lib/analytics/cookies.ts`
```ts
// Helper nativo (sem libs): getCookie/setCookie/deleteCookie com secure só em prod, SameSite=Lax, encode/decode.
```

#### `lib/analytics/types.ts`
```diff
- utm: { ... }
+ utm: { ...; gclid; fbclid; msclkid }
+ Attribution/AttributionTouch types
+ AnalyticsContext inclui referrer_host, landing_path, attribution e ad IDs.
```

#### `lib/analytics/utm.ts`
```ts
'use client';
// allowed keys: utm_* + gclid/fbclid/msclkid
// normalize (lowercase, [a-z0-9_.-], 255)
// attribution {first_touch,last_touch,ttl_days} armazenado em cookie+local+session com expires_at
export function updateAttribution(path?, searchParams?)
export function getAttribution(), getCurrentUTMs(), appendUtm(url), clearUTMs()
// landing_path só pathname; referrer_host só host; SSR-safe guards
```

#### `hooks/useUtm.ts` & `components/UtmProvider.tsx`
```ts
// Hook roda em cada navegação (pathname/searchParams) chamando updateAttribution.
// Provider global embrulha app.
```

#### `app/layout.tsx`
```diff
<ThemeProvider ...>
-  <ClientBody>...</ClientBody>
+  <UtmProvider>
+    <ClientBody>...</ClientBody>
+  </UtmProvider>
</ThemeProvider>
```

#### `lib/analytics/index.ts`
```ts
// init chama updateAttribution(); context inclui attribution/referrer_host/ad ids
const BACKEND_ENDPOINT='/api/v1/analytics/track'; GLOBAL_EVENTS=['page_view','search']
function sendToBackend(...) fire-and-forget
track(): gera event_id, dedupe, envia Mixpanel/GA4 e POST backend (quando company_id ou global)
page(): idem, envia page_view ao backend mesmo sem company_id
```

#### `lib/api-client.ts`
```ts
// requestOptions clone; injeta {utm, attribution} somente em POST leads/wizard_create, analytics*, banner_events.
// Usa getCurrentUTMs/getAttribution; mantém SSR-safe.
```

#### `components/WhatsappButton.tsx`
```ts
// evento whatsapp_click com company/category/banner/page_path; appendUtm opcional; aceita companyId/... props.
```

#### `CompanyHero.tsx` & `StickyCTA.tsx`
```diff
<WhatsappButton ... companyId={company.id} ... />
```

#### `components/Banner.tsx`
```ts
'use client';
// view via IntersectionObserver (50%); click/view POST /banner_events com utm + metadata (slot_key, position, page_path, category_id).
// Usa fetchApiSafe (injeção UTM) e evita disparo sem bannerId.
```

### Backend
#### `app/services/analytics/track_event_service.rb`
```rb
require 'uri'
GLOBAL_EVENTS = %w[page_view search landing_view]
// company_id opcional p/ eventos globais; dedupe event_id mantido.
// whitelist inclui gclid/fbclid/msclkid/landing_path/referrer_host/attribution/banner_id.
// sanitize normaliza utm, strip path/host, limpa attribution nested; skip counters quando company ausente.
```

#### `app/controllers/api/v1/analytics_controller.rb`
```rb
ALLOW_ANONYMOUS_EVENTS = %w[page_view search]
// aceita event_id, libera company_id vazio para eventos globais.
```

#### `app/controllers/api/v1/base_controller.rb`
```rb
// request_metadata: path sem query, referrer_host/path sanitizados, UTMs normalizados (inclui gclid/fbclid/msclkid).
```

#### `app/controllers/api/v1/banner_events_controller.rb`
```rb
require 'uri'
// Sanitiza utm (allowed keys), metadata (slot_key/position/page_path/category_id/banner_id/title/link), referrer host only.
```

#### `app/controllers/api/v1/leads_controller.rb`
```rb
ALLOWED_UTM_KEYS add gclid/fbclid/msclkid
wizard_create: extrai utm/attribution (top-level ou lead.utm), normaliza, aplica em colunas + attribution_json.
wizard_lead_params permite utm/attribution; helpers sanitize_utm_value/strip_path/strip_host.
```

#### `app/models/lead.rb`
```diff
+ ransackable_attributes inclui utm/ad ids, landing_path, referrer_host, attribution_json
```

#### Migration `20260203000000_add_utm_fields_to_leads.rb`
```rb
add_column :leads, :utm_source/:utm_medium/:utm_campaign/:utm_content/:utm_term/:gclid/:fbclid/:msclkid
add_column :leads, :landing_path, :referrer_host, :attribution_json (jsonb, default {})
add_index :utm_campaign, :utm_source, [:company_id, :utm_campaign], :created_at
```

## 4) Migration
- `20260203000000_add_utm_fields_to_leads.rb` (executar `rails db:migrate` no backend).

## 5) Checklist de testes manuais / request specs
- [ ] Abrir `/` com `?utm_source=Google&utm_campaign=Teste&gclid=XYZ` -> attribution salvo em cookie/local/session com first/last touch (landing_path sem query, referrer_host só host).
- [ ] Navegar internamente sem UTM -> last_touch persiste, TTL não reinicia.
- [ ] Clicar WhatsApp (Company hero/sticky) -> evento `whatsapp_click` chega no backend com company_id, destination_url, utm/attribution.
- [ ] Criar lead via wizard (`leads/wizard_create`) -> colunas utm_* + gclid/fbclid/msclkid + landing_path/referrer_host + attribution_json preenchidas.
- [ ] Banner renderizado -> view disparada ao atingir 50% viewport; click envia banner_events com utm_json e metadata (slot_key/position/page_path).
- [ ] Page view sem company_id -> /api/v1/analytics/track aceita e grava (no logs) sem 400.

## 6) Done Criteria
- UTM v2 persistindo (first/last touch, TTL 30d) em cookie/local/session; sem query/PII.
- appendUtm robusto (HTTP apenas, preserva UTMs existentes); hook SSR-safe ativo em todas rotas.
- Eventos front enviando também ao Rails com event_id dedupe; page_view aceito sem company_id.
- Leads armazenam UTM/ads IDs + landing_path/referrer_host + attribution_json (com migração).
- Banner events registram utm_json + metadata; WhatsApp/Banner/CTA enviam contexto company/category/banner.
- Nenhuma lib nova adicionada; tudo SSR-safe e LGPD-safe.

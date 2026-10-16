# Relatório de Discovery e Baseline (PR 0 — READ-ONLY)

**Data:** 16 de Outubro de 2026  
**Feature:** `010-home-hero-premium-campaigns`  
**Escopo:** Auditoria estática e dinâmica em ambiente real (READ-ONLY) — nenhuma alteração de código ou banco de produção.

---

## 1. Resumo Executivo das Evidências Reais

A auditoria empírica comprovou **todas as hipóteses críticas de causa-raiz** levantadas no Spec Kit:

1. **A Causa-Raiz do Blur (RC-04 — COMPROVADA COM MEDIÇÃO DE BYTES E PIXELS):**
   - O criativo original enviado no Banner ID 10 possui **2171 × 724 pixels** (1.7 MB, PNG de alta fidelidade).
   - O modelo `Banner` do Rails aplica variante com base no catálogo `home_top` (`[1200, 160]`):
     `image.variant(resize_to_limit: [1200, 160])`
   - Como a imagem tem proporção ~3:1, a restrição de altura `160px` forçou a largura para **480px**!
   - A imagem gerada e servida pelo Rails para a produção é de **480 × 160 pixels** (143 KB).
   - O Next.js (`HomeHeroBanner.tsx`) renderiza esse asset dentro de um container desktop de até **1320 × 280 pixels** e requisita ao `/_next/image` uma versão de até `w=1920&q=75`.
   - **Conclusão:** Uma imagem de 480px é esticada em ~275% horizontalmente e ~175% verticalmente, resultando em perda drástica de nitidez.

2. **A Colisão Semântica de Título e Copy (RC-01 e RC-02 — COMPROVADAS):**
   - No ActiveAdmin, o campo exibido ao administrador é `f.input :title, label: 'Título do Banner (Interno)'`.
   - Na API (`Api::V1::BannersController`), `serialize_banners` serializa apenas `title` (interno). Não existem campos públicos de `headline`, `subtitle`, `cta_label`, `cta_href`.
   - Como o criativo incorporava texto na arte, o administrador inseriu `title = "."` para suprimir a headline na home.
   - O frontend renderiza `<h1>{bannerTitle}</h1>`, resultando em um ponto `.` flutuante com drop-shadow sobre a arte.

3. **Inexistência de Tracking de Viewability/Cliques no Hero (RC-07 — COMPROVADA):**
   - `HomeHeroBanner.tsx` utiliza um `<Link href={bannerLink}>` direto.
   - Não utiliza `BannerContainer`, não chama `analyticsApi.trackBannerEvent` e não passa pela rota `/api/v1/banner_clicks/:id`.
   - As impressões e cliques do hero não são contabilizados no sistema de ads.

---

## 2. Inventário de Tarefas do PR 0 (T001 a T007)

### T001 — Alinhamento de Git e Release em Produção
- **Branch local:** `main`
- **HEAD local:** `beab3feec7772bd75cb3992c554de0568076d94d`
- **Cabeçalho de Produção (`https://www.avaliasolar.com.br/`):**
  `x-release: beab3feec7772bd75cb3992c554de0568076d94d`
- **Status da Working Tree:** Limpa (`nothing to commit, working tree clean`).
- **Divergência:** 0 commits. O ambiente local está perfeitamente alinhado com o deploy ativo de produção.

### T002 — Mapeamento do Fluxo de Dados
```
ActiveAdmin (/admin/banners/:id/edit)
  │ (Campos: title interno, link, width, height, position, image)
  ▼
Banner (ActiveRecord)
  │ image.variant(resize_to_limit: [1200, 160]) via BannerPlacements::Catalog['home_top']
  ▼
API Controller (Api::V1::BannersController#index)
  │ Cache Redis 5min (banners/v2/:hash/:version)
  │ Serializer restrito (apenas id, title, link, position, image_url, etc.)
  ▼
Next.js Cache Layer (home-fallback-cache.ts)
  │ LayeredSWRCache TTL 5min + stale 24h
  ▼
Next.js Page SSR (app/page.tsx)
  │ unstable_cache 300s ('home-hero-banners-top', tags: ['home-data', 'banners'])
  ▼
Hero UI (HomeHeroBanner.tsx)
  │ Link direto envolvendo o card
  │ Alturas CSS fixas: 210px (<640), 240px (640-767), 280px (>=768)
  │ Subtítulos e CTAs codificados com IDs fictícios (9991, 9992, 9993)
```

### T003 — Inspeção de Schema e Migrations
- **Tabela `banners`:**
  - Colunas existentes: `id, title, image_url, link, active, created_at, updated_at, category_id, sponsored, banner_type, position, start_date, end_date, company_id, moderation_status, priority, slot_key, approved_by_admin_user_id, approved_at, rejected_reason, width, height, target_states, target_cities, alt_text, financial_institution_id, financing_option_id`.
  - **Colunas ausentes necessárias para o Hero Premium:** `headline`, `subtitle`, `cta_label`, `cta_href`, `cta_enabled`, `theme`, `cta_variant`, `hero_background_color`, `hero_text_color`, `cta_background_color`, `cta_text_color`, `overlay_variant`, `creative_mode`, `object_position_desktop_x/y`, `object_position_mobile_x/y`, `whole_banner_clickable`, `creative_version`.
  - **Anexos:** Atualmente apenas `has_one_attached :image`. Ausente `has_one_attached :image_mobile`.
- **Tabela `banner_audit_logs`:**
  - Existe no schema (`id, auditable_type, auditable_id, actor_type, actor_id, source, action, changes_json, metadata_json, reason, ip_address, created_at, updated_at`).
  - O controller do ActiveAdmin (`AB0-1-back/app/admin/banners.rb`) **não gera registros** em `BannerAuditLog` ao salvar ou editar banners.

### T004 — Medições de Arquivos e Mídia (Banner ID 10)
| Métrica | Blob Original (Upload) | Variante Rails Servida | Render Next.js no Desktop |
|---|---|---|---|
| **URL** | `/blobs/proxy/.../banner-avalia-solar-v2.png` | `/representations/proxy/.../banner-avalia-solar-v2.png` | `/_next/image?url=...&w=1920&q=75` |
| **Dimensões** | **2171 × 724 px** | **480 × 160 px** | Exibição em **1320 × 280 px** (CSS) |
| **Proporção** | 2.998 : 1 (~3:1) | 3.000 : 1 (3:1) | 4.714 : 1 (~19:4) |
| **Peso do Arquivo**| **1.7 MB** | **143 KB** | Re-encode AVIF/WebP (~80-120 KB) |
| **Content-Type** | `image/png` | `image/png` | `image/webp` ou `image/avif` |
| **Causa do Crop/Blur**| Arquivo original nítido | Limitado a `height: 160px` | Upscale de 480px para 1320px+ (DPR 2x = 2640px) |

### T005 — Análise de Layout e Viewports do Hero Atual
- Breakpoints de altura CSS em `HomeHeroBanner.tsx`:
  - Mobile (`< 640px`): `h-[210px]`
  - Tablet (`640px - 767px`): `h-[240px]`
  - Desktop (`>= 768px`): `h-[280px]`
- Max-width do contêiner: `max-w-[1320px] mx-auto px-4`.
- No commit `beab3fee`, o overlay escuro (`bg-gradient-to-r from-slate-950/90...`) foi removido e substituído por `drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]` no texto branco.

### T006 — Telemetria, Eventos e Deduplicação
- `BannerEventsController` suporta:
  - Eventos de `impression`, `view` e `click`.
  - Deduplicação via `event_key` (SHA256 de `banner_id:event_type:instance_id:position:slot_key`).
- `BannerClicksController` (`/api/v1/banner_clicks/:id`):
  - Injeta parâmetros UTM (`utm_source=avaliasolar_ads`, `utm_campaign=banner_:id`).
  - Redireciona com status 302 para `destination`.
- **Divergência detectada:** `HomeHeroBanner.tsx` ignora essa infraestrutura existente.

### T007 — Validação Comercial e Catálogo
- `BannerPlacements::Catalog`:
  - `home_top`: Catálogo legado comercial com dimensões `[1200, 160]`, preço/status `active`. Não deve ser alterado nem receber mutação destrutiva.
  - `home_hero`: Não existe atualmente no catálogo. Deve ser criado como novo placement com dimensões canônicas de autoria (`1920 × 420` desktop e `780 × 460` mobile).
- `BannerDeliveryQuery`:
  - `apply_frequency_cap` é um no-op (`scope`). Não há controle de frequência efetivo por visitante.
  - `apply_contract_eligibility`: Exige assinatura ativa de `banner_subscriptions` ou `banner_addon_subscriptions` para banners onde `sponsored = true` e `company_id` está preenchido. Banners institucionais com `sponsored = false` ou `company_id = nil` são veiculados livremente.

---

## 3. Próximos Passos (PR 1 em diante)
1. **PR 1 (Backend & Banco Aditivo):**
   - Migration aditiva de colunas (`headline`, `subtitle`, `cta_*`, `theme`, etc.) e anexo `image_mobile`.
   - Inclusão do slot `home_hero` no `BannerPlacements::Catalog`.
   - Serialização e testes unitários RSpec isolados.
2. **PR 2 (ActiveAdmin):**
   - Formulário com abas de Conteúdo, Mídia responsiva, Cores/Tokens e Prévia em iframe sem tracking.
   - Auditoria via `BannerAuditLog`.
3. **PR 3 (Frontend Hero Responsivo):**
   - Suporte ao slot `home_hero`.
   - `<picture>` responsivo (desktop x mobile).
   - Botão CTA independente e tipografia editável.
4. **PR 4 (Mídia & Qualidade):**
   - Resampling de variantes Rails sem limite restritivo de 160px para `home_hero`.
5. **PR 5 (Tracking & Monetização):**
   - Viewability e clique integrados ao `BannerContainer`/`banner_events`.

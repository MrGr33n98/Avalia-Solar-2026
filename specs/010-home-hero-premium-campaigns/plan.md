# Plano de Implementação — Hero Premium Gerenciável

**Feature:** `010-home-hero-premium-campaigns`  
**Estratégia:** Entregas progressivas em PRs isolados, com feature flags e sem risco a produção.

---

## 1. Gates de Qualidade e Liberação

- **Gate 0 — Discovery em Ambiente Real (READ-ONLY) [CONCLUÍDO]:**
  - Confirmação de release (`beab3fee`), medição empírica de imagens (2171px original -> 480px variante), validação de schema, rotas de tracking e ausência de campos públicos.
- **Gate 1 — Contrato e Catálogo [EM APROVAÇÃO]:**
  - Congelamento do contrato OpenAPI, inclusão do slot `home_hero` no catálogo sem alterar `home_top`.
- **Gate 2 — Backend Aditivo (PR 1):**
  - Migration aditiva, serializer atualizado, validações server-side de segurança (MIME, peso, URLs) e suite RSpec.
- **Gate 3 — ActiveAdmin e Prévia (PR 2):**
  - Formulário com segmentação de abas, campos de headline/CTA/cores/mídia mobile e pré-visualização segura em 3 breakpoints. Trilha de auditoria via `BannerAuditLog`.
- **Gate 4 — Frontend Hero Responsivo (PR 3 & PR 4):**
  - Suporte a `home_hero`, `<picture>` responsivo com art direction, tipografia editável, remoção de IDs fictícios 9991-9993 e variantes Rails de alta resolução.
- **Gate 5 — Telemetria e Monetização (PR 5):**
  - Integração com `BannerContainer`, rastreamento idôneo de viewability e clique com `delivery_id`, rotulagem "Patrocinado" e pacing.

---

## 2. Arquitetura do Sistema

```
ActiveAdmin (Auth / Editor / Auditoria)
  │ Cadastra: headline, CTA, tema, cores, imagem desktop e mobile
  ▼
Banner (Rails ActiveRecord + ActiveStorage / DO Spaces)
  ├─ BannerPlacements::Catalog (home_hero: 1920×420 px)
  ├─ BannerDeliveryQuery (elegibilidade, rotação determinística, targeting)
  ├─ banner_events / banner_clicks (telemetria e deduplicação)
  └─ BannerAuditLog (trilha de alterações)
  │
  ▼ [GET /api/v1/banners?position=home_hero]
Next.js Cache Layer (home-fallback-cache.ts)
  │ LayeredSWRCache (TTL 5min, stale 24h)
  ▼
Next.js SSR Page (app/page.tsx)
  │ unstable_cache (300s, tag: 'home-hero')
  ▼
HomeHeroBanner.tsx (UI Responsiva)
  ├─ Desktop: <= 280px CSS
  ├─ Tablet: <= 240px CSS
  ├─ Mobile: <= 210px CSS
  ├─ <picture> art-directed (Desktop x Mobile)
  ├─ Botão CTA acessível em <a> independente
  └─ Viewability via IntersectionObserver
```

---

## 3. Política de Mídia e Imagens

1. **Alturas CSS Fixas Inegociáveis:**
   - Mobile: `210px`
   - Tablet: `240px`
   - Desktop: `280px`
   - Largura máxima do container: `1320px`
2. **Resolução de Autoria:**
   - Desktop: `1920 × 420 px` (~4.57:1)
   - Mobile: `780 × 460 px` (~1.70:1)
3. **Pipeline de Variante Rails:**
   - Para o slot `home_hero`, o Rails gerará variante com `resize_to_limit: [1920, 600]`, eliminando a restrição de 160px que causava o borrão em banners com proporção ~3:1.
4. **Modos de Criativo:**
   - `photo_with_html`: Imagem fotográfica de fundo + Headline/Subtítulo/CTA em HTML semântico com contraste garantido.
   - `image_only`: Arte publicitária completa finalizada, suprimindo overlays de texto na UI e mantendo apenas o CTA e o link acessíveis.

---

## 4. Política de Cache e Rollback

- **SLA de Publicação:** Atualização em menos de 60 segundos após aprovação no ActiveAdmin, através de webhook de revalidação de tag (`revalidateTag('home-hero')`).
- **Plano de Rollback:**
  - Caso o novo hero apresente instabilidade, um feature flag `NEXT_PUBLIC_HOME_HERO_V2_ENABLED=false` reverte a home para o fallback institucional ou para a leitura do slot legado `home_top`.
  - Como a migration no Rails é 100% aditiva, ela não interfere nas operações das outras páginas.

# Inventário, Causas-Raiz e Análise de Lacunas

**Feature:** `010-home-hero-premium-campaigns`  
**Data da Auditoria:** 16 de Outubro de 2026  
**Status:** PR 0 Concluído (READ-ONLY)

---

## 1. Evidência Visual e Diagnóstico Empírico de Produção

As capturas do ActiveAdmin em `.../admin/banners/10/edit` e a inspeção direta da API e HTML de produção confirmaram as condições reais do sistema:
- O registro ID 10 exibe: campo `Título do Banner (Interno) = "."`, `alt_text = ""`, `link = "https://www.avaliasolar.com.br/pricing"`, upload de imagem `banner-avalia-solar-v2.png`, `banner_type = "rectangular_large"`, `position = "home_top"`, `width = 1200`, `height = 160`.
- Não existem campos no modelo nem no formulário para: copy público, subtítulo, label do CTA, URL do CTA, cor, tema, foco, arte mobile ou animação.
- A arte original enviada pelo administrador possui **2171 × 724 px** (1.7 MB), contendo elementos visuais e copy incorporada.
- O pipeline de variantes do Rails redimensionou o arquivo para **480 × 160 px** (143 KB) devido à restrição do catálogo legado `home_top` (`[1200, 160]`).
- O frontend Next.js amplia esse recurso de 480px em um contêiner de 1320px de largura e até 280px de altura, requisitando variante de 1920px ao `/_next/image`, gerando borrões severos.

---

## 2. Inventário Estático Confirmado por Caminho

| Superfície | Arquivo | Achado Confirmado |
|---|---|---|
| **Home SSR** | [`AB0-1-front/app/page.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/app/page.tsx) | `getCachedBanners('home_top')` com `unstable_cache` de 300s injetado via `HomeHeroBannerWrapper`. |
| **Hero UI** | [`AB0-1-front/components/home/HomeHeroBanner.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/components/home/HomeHeroBanner.tsx) | Alturas CSS 210/240/280 px; `object-cover object-center`; textos brancos com drop-shadow; botão amarelo `bg-amber-400`; 3 fallbacks IDs 9991–9993; autocarrossel de 6s; link envolvendo todo o banner. |
| **Fallback / Caches** | [`AB0-1-front/lib/server/home-fallback-cache.ts`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/lib/server/home-fallback-cache.ts) | `LayeredSWRCache` TTL 5min e stale 24h; `getCachedBanners` admite apenas posições legadas (`home_top`, etc.). |
| **API Pública** | [`AB0-1-back/app/controllers/api/v1/banners_controller.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/banners_controller.rb) | Endpoint `GET /api/v1/banners`, serialização seletiva, injeção de UTMs no link, `delivery_id`, cache Rails Redis 5min. Não retorna CTA, headline, nem mídia mobile. |
| **Seleção de Ads** | [`AB0-1-back/app/services/banners/banner_delivery_query.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/banners/banner_delivery_query.rb) | Filtra banners ativos e aprovados, targeting de estado/cidade/categoria, rotação determinística por hash. `apply_frequency_cap` retorna o escopo inalterado (no-op). |
| **Modelo Rails** | [`AB0-1-back/app/models/banner.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/models/banner.rb) | `has_one_attached :image`; `image_url` gera `resize_to_limit: [width, height]` quando variantes ativas; valida presença de dimensões; callbacks de invalidação de cache. |
| **Catálogo de Slots**| [`AB0-1-back/app/services/banner_placements/catalog.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/banner_placements/catalog.rb) | Define `home_top` com dimensões `[1200, 160]`; o slot `home_hero` não existe no catálogo. |
| **ActiveAdmin** | [`AB0-1-back/app/admin/banners.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/admin/banners.rb) | Formulário sem campos de copy pública, subtítulo, label de CTA, cores ou arte mobile. `title` é rotulado internamente. |
| **Auditoria** | [`AB0-1-back/app/models/banner_audit_log.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/models/banner_audit_log.rb) | Tabela e modelo existem, mas o ActiveAdmin não invoca logs na criação/edição. |
| **Telemetria** | [`AB0-1-back/app/controllers/api/v1/banner_events_controller.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/banner_events_controller.rb) | Ingestão deduplicada por `event_key`, contagem de view e click. O componente `HomeHeroBanner` atual não está integrado a essa telemetria. |

---

## 3. Causas-Raiz Confirmadas e Status

- **RC-01 — Semantic Collision (Title) [CONFIRMADA]:** O campo do ActiveAdmin é o título interno. No hero, o código faz `const bannerTitle = currentBanner.title || headline`. Para suprimir a sobreposição de texto em banners gráficos, administradores inserem `"."`, exibindo um ponto flutuante na tela.
- **RC-02 — Subtítulo e Botão Globais [CONFIRMADA]:** `currentSubtitle` e `currentCtaText` ramificam apenas por IDs fixos (`9992/9993`) ou utilizam fallbacks globais. Não há como definir copy ou botão personalizado por anúncio.
- **RC-03 — Contraste e Layout Imutáveis [CONFIRMADA]:** Anteriormente havia gradiente escuro fixo forçado; recentemente removido e trocado por drop-shadows. Falta suporte a tema claro/escuro e cores gerenciáveis.
- **RC-04 — Upscale Destrutivo após Variante [CONFIRMADA EMPIRICAMENTE]:** O criativo original de 2171×724 px é reduzido para 480×160 px pelo Rails (`resize_to_limit: [1200, 160]`) e subsequentemente esticado pelo Next.js em até 1320×280 px (e 1920 px via `_next/image`).
- **RC-05 — Art Direction Inexistente [CONFIRMADA]:** Uma única imagem é usada para desktop e smartphone, sofrendo corte agressivo centralizado via `object-cover`.
- **RC-06 — Ambiguidade Comercial entre home_top e home_hero [CONFIRMADA]:** `home_top` é um slot publicitário legado de 1200×160; o hero da home requer proporção mais nobre e semântica própria (`home_hero`).
- **RC-07 — Analytics do Hero não Integrados [CONFIRMADA]:** O hero não utiliza `BannerContainer`, viewability nem a rota de redirecionamento de cliques com UTM.
- **RC-08 — Caches Multicamada em Desalinhamento [CONFIRMADA]:** Cache Redis (5 min) + `LayeredSWRCache` (5 min/24h) + `unstable_cache` (300s). Edições no ActiveAdmin demoram para refletir na home pública.
- **RC-09 — frequency_cap sem Aplicação [CONFIRMADA]:** `apply_frequency_cap` retorna o escopo sem alterações no Rails.
- **RC-10 — Auditoria no ActiveAdmin não Implementada [CONFIRMADA]:** O controller de banners não cria registros em `BannerAuditLog`.
- **RC-11 — Validação de Arquivo Inexistente [CONFIRMADA]:** Valida apenas a presença do anexo; sem verificação de MIME types permitidos, peso máximo ou dimensões naturais.

---

## 4. Cadeia de Entrega e Origem de Perda de Qualidade

```
1. Admin Upload (2171 × 724 px PNG, 1.7 MB)
      ↓
2. ActiveStorage::Blob (Spaces/S3)
      ↓
3. Banner#image_url (Aplica variant resize_to_limit: [1200, 160] -> 480 × 160 px, 143 KB)
      ↓
4. Rails Storage Proxy URL
      ↓
5. API Rails (GET /api/v1/banners?position=home_top) -> Redis Cache 5min
      ↓
6. Next.js Fetch -> LayeredSWRCache (5min TTL / 24h stale)
      ↓
7. Next.js unstable_cache (300s TTL, tags: ['home-data', 'banners'])
      ↓
8. HomeHeroBanner.tsx (<Image fill sizes="..." />)
      ↓
9. Next.js _next/image (Requisita upscaling de 480px para w=1920&q=75)
      ↓
10. CSS Render (Container 1320 × 280 px com object-cover) -> Imagem borrada
```

---

## 5. Lacunas frente a Padrões de Marketplace

- Ausência de separação entre criativo gráfico (arte final) e criativo híbrido (foto + texto/botão HTML).
- Inexistência de ponto focal configurável (`object_position`).
- Falta de prévia responsiva no painel administrativo antes da publicação.
- Sem identificação explícita de "Publicidade / Patrocinado" no hero.
- Ausência de webhook assinado para invalidação atômica de cache ao publicar.

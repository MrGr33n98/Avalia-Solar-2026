# Auditoria Global de Performance Enterprise — Avalia Solar

> **Data**: 27 de Junho de 2026
> **Auditor**: Principal Engineer — Auditoria Automatizada via Codebase Analysis
> **Versão**: 1.0
> **Escopo**: Frontend (Next.js 14), Backend (Rails 7.0.8), PostgreSQL 14, Redis 7, OpenSearch 2.11, DigitalOcean Droplet

---

## 1. Resumo Executivo

O **Avalia Solar** é um marketplace de energia solar e mobilidade elétrica com uma base de código madura, composta por **Next.js 14 (App Router)** no frontend e **Rails 7.0.8 (API mode + ActiveAdmin)** no backend, rodando em uma **VM única na DigitalOcean** com Docker Compose.

### Estado Atual

A plataforma demonstra **maturidade intermediária** — acima da média de startups, mas ainda distante de padrão enterprise. Existem **fundamentos sólidos** (Sentry, Sidekiq, Redis, OpenSearch, rate limiting, CSP, HSTS, CI/CD com GitHub Actions), mas há **gargalos estruturais** que precisam ser endereçados antes de um crescimento significativo de tráfego.

### Principais Gargalos Identificados

1. **Imagens públicas massivas** — 6 PNGs entre 5–7MB cada no diretório `public/`, servidas sem CDN, sem WebP/AVIF.
2. **Puma single-mode** — Workers comentados; sem clustered mode em produção = concorrência limitada a threads de um único processo.
3. **Nginx sem gzip/brotli** — O proxy reverso (`infra/nginx/app.avaliasolar.com.br.conf`) não configura compressão, static file caching ou HTTP/2.
4. **Landing page 100% client-side** — `app/page.tsx` usa `'use client'`-heavy sections, reduzindo SEO e aumentando TTI.
5. **VM única para tudo** — Frontend, backend, PostgreSQL, Redis, OpenSearch e Sidekiq na mesma máquina = SPOF e contenção de recursos.

### Nota Geral Estimada: **5.8 / 10** — *Atenção*

---

## 2. Score Geral

| Área | Nota | Status |
|---|---|---|
| Frontend Performance | 5.5 | ⚠️ Atenção |
| Backend Performance | 6.5 | ⚠️ Atenção |
| Banco de Dados | 7.0 | ✅ Bom |
| Infraestrutura | 4.5 | 🔴 Crítico |
| Cache | 6.0 | ⚠️ Atenção |
| Imagens/Assets | 3.0 | 🔴 Crítico |
| SEO/Core Web Vitals | 5.5 | ⚠️ Atenção |
| Observabilidade | 7.0 | ✅ Bom |
| Mobile | 5.0 | ⚠️ Atenção |
| Escalabilidade | 4.0 | 🔴 Crítico |

---

## 3. Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────┐
│                    VM DigitalOcean (1 Droplet)                   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Next.js  │  │  Rails   │  │ Sidekiq  │  │  PostgreSQL   │   │
│  │  :3000   │  │  :3001   │  │ (worker) │  │   14 (:5432)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────────┐   │
│  │  Redis   │  │  OpenSearch   │  │      Nginx (proxy)     │   │
│  │ 7 (:6379)│  │ 2.11 (:9200)  │  │   api + www subdomains │   │
│  └──────────┘  └───────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Frontend**: Next.js 14.2.34, App Router, React 18, TypeScript 5.2, Tailwind CSS 3.3, Framer Motion, Recharts, Zustand, TanStack Query, @sentry/nextjs, PostHog, Apollo Client (GraphQL).

**Backend**: Rails 7.0.8, Ruby 3.2, Puma 5, Devise + JWT, ActiveAdmin 3.2, ActiveModelSerializers, pg_search, Sidekiq 7 + sidekiq-scheduler, Searchkick (OpenSearch), Stripe, MercadoPago, GraphQL 2.3, Sentry, Scout APM, Yabeda (Prometheus).

**Storage**: DigitalOcean Spaces (S3-compatible) via ActiveStorage.

**CI/CD**: GitHub Actions — build Docker images → push to GHCR → SSH deploy to VM → `docker compose up -d` → migrations.

---

## 4. Fluxo de Request Crítico

### Landing Page (`/`)

```
Usuário → Nginx (:80/443) → Next.js (:3000) → Client Component monta
→ fetch /api/v1/categories (proxy → Rails :3001 → PostgreSQL)
→ fetch /api/v1/companies?featured=true (proxy → Rails → PG)
→ fetch /api/v1/banners (proxy → Rails → PG)
→ Renderiza cards, carrosseis, hero
```

**Problema**: A maioria dos dados é carregada client-side. O HTML inicial tem pouco conteúdo indexável.

### Search (`/search`)

```
Usuário digita → debounce → fetch /api/v1/search?q=... (→ Rails → OpenSearch/pg_search)
→ Renderiza resultados no client
```

### Empresa (`/companies/[slug]`)

```
Next.js SSR/CSR → fetch /api/v1/companies/:slug → Rails → PG
(includes: categories, badges, reviews, review_aggregates, faqs, financing_options, media)
→ CompanySerializer (348 linhas, ~34 atributos + associações profundas)
```

**Risco**: Payload potencialmente grande com associações profundas.

### Dashboard (`/dashboard`)

```
Auth middleware → fetch /api/v1/company_dashboard/:company_id/overview
→ Rails → PG (analytics_events, company_daily_stats, leads, reviews)
```

### Chat (`/chat`)

```
Auth middleware → fetch /api/v1/conversations → Rails → PG
→ WebSocket/polling para mensagens em tempo real
→ fetch /api/v1/direct_messages → Rails → PG
```

---

## 5. Diagnóstico Frontend

### 5.1 Estrutura do Projeto

- **Framework**: Next.js 14.2.34 com **App Router** ✅
- **53 rotas** no `app/` directory
- **~143+ componentes** client-side (`'use client'`)
- **13 usos** de `next/dynamic` — razoável mas pode melhorar
- **Providers aninhados**: ThemeProvider → UtmProvider → Providers (QueryClientProvider, AuthProvider, ComparisonProvider, PostHogProvider, ChatWidget, QuoteWizardDialog, TooltipProvider, Toaster, Sonner)

### Achado: Excesso de Client Components em Páginas Públicas

- **Evidência**: `app/page.tsx` (landing), `app/search/page.tsx`, `app/products/page.tsx`, `app/categories/[slug]/CategoryPageClientV2.tsx` — todas usam `'use client'`
- **Impacto**: Todo o JavaScript precisa ser baixado, parseado e executado antes do conteúdo ser renderizado. Bots de busca recebem HTML vazio ou esqueletos.
- **Prioridade**: **P1 Alto**
- **Recomendação**: Converter páginas públicas para Server Components com dados obtidos via `fetch()` no servidor. Mover interatividade para componentes filhos client-side menores.

### 5.2 Bundle e Dependências

| Dependência | Peso Estimado (gzip) | Necessária em todas páginas? |
|---|---|---|
| framer-motion | ~80KB | ❌ Apenas pages com animação |
| recharts | ~150KB | ❌ Apenas dashboard |
| @apollo/client (v4) | ~50KB | ❌ Apenas GraphQL |
| leaflet + react-leaflet | ~40KB | ❌ Apenas search/map |
| posthog-js | ~30KB | ✅ Global (analytics) |
| date-fns | ~10KB | ✅ Diversas páginas |
| rxjs | ~30KB | ❌ REQUER VERIFICAÇÃO de uso justificado |

- `optimizePackageImports` configurado para lucide-react, date-fns, recharts, framer-motion, radix-ui ✅
- `@next/bundle-analyzer` disponível via `npm run analyze` ✅
- `rxjs` presente nas dependências — **REQUER VERIFICAÇÃO** se é realmente usado
- `better-auth` presente — **REQUER VERIFICAÇÃO** se duplica funcionalidade do Devise/JWT

**Prioridade**: **P2 Médio**

### 5.3 Imagens e Assets

#### Achado Crítico: PNGs Gigantes no Public Directory

| Arquivo | Tamanho | Uso |
|---|---|---|
| `instaladores-ev-avalia-solar.png` | **7.2 MB** | Ícone de categoria |
| `residencial-e-condominio-avalia-solar.png` | **7.2 MB** | Ícone de categoria |
| `instaladores-solar-avalia-solar.png` | **6.6 MB** | Ícone de categoria |
| `energia-solar-avalia-solar.png` | **6.5 MB** | Ícone de categoria |
| `rural-avaliasolar.png` | **6.5 MB** | Ícone de categoria |
| `carport-avalia-solar.png` | **5.2 MB** | Ícone de categoria |
| `texture-avalia-solar-v2.png` | **1.9 MB** | Background texture |
| `lp-avalia-solar-image.png` | **1.8 MB** | Hero image |
| `herro-banner-avalia-solar.png` | **1.9 MB** | Hero banner |
| `pricing-hero-mockup.png` | **2.5 MB** (x2 duplicado) | Pricing page |

**Peso total de PNGs > 500KB**: ~60+ MB

- **Impacto**: Cada visitante mobile pode baixar 7MB+ de PNGs em uma categoria. Em 4G médio (5 Mbps), isso leva ~11 segundos apenas para uma imagem.
- **Duplicação**: `pricing-hero-mockup.png` existe em `/public/` e em `/public/images/pricing/` — mesmo arquivo.
- **Formato**: Todos são PNG sem compressão. Nenhum WebP/AVIF servido para assets estáticos do `public/`.
- **next/image**: O componente `OptimizedImage` existe mas é usado em apenas ~5 componentes. A maioria das páginas usa imagens diretamente.

**Prioridade**: **P0 Crítico**

**Recomendação**:
1. Converter todos os PNGs para WebP (redução de 70-80%)
2. Remover duplicatas
3. Usar `next/image` com `priority` para LCP image
4. Servir via CDN (DigitalOcean CDN ou Cloudflare)

### 5.4 CSS / Performance Visual

- **globals.css**: 683 linhas, 18KB — tamanho aceitável
- **Textura de fundo** (`body::before`): carrega `texture-avalia-solar-v2.png` (1.9MB) em **TODA PÁGINA** via `position: fixed` com `transform: translateZ(0)`. A aceleração por hardware é positiva, mas o download de 1.9MB afeta o carregamento inicial.
- **Animações**: Framer Motion usado extensivamente. Não foram identificados `backdrop-blur` em excesso.
- **Tailwind purge**: Configurado corretamente via PostCSS ✅

**Prioridade**: **P1 Alto** (textura 1.9MB em body)

**Recomendação**: Comprimir `texture-avalia-solar-v2.png` para WebP (~200KB) ou usar CSS gradient/SVG pattern.

### 5.5 Fontes

- **Sistema de fontes**: `system-ui, sans-serif` via CSS custom property `--font-sans` ✅
- **Nenhuma fonte externa** (Google Fonts) carregada ✅
- **CLS de fonte**: Inexistente (usa system fonts) ✅

### 5.6 Core Web Vitals (Estimativa Teórica)

| Métrica | Estimativa | Status | Principal Causa |
|---|---|---|---|
| **LCP** | ~4-6s mobile | 🔴 Ruim | PNGs 5-7MB, client-side rendering |
| **INP** | ~150-300ms | ⚠️ Pode exceder | Hidratação pesada, Framer Motion |
| **CLS** | ~0.05-0.15 | ⚠️ Atenção | Imagens sem dimensões fixas em cards |
| **TTFB** | ~300-800ms | ⚠️ Depende | VM única, sem CDN |
| **FCP** | ~2-3s mobile | ⚠️ Atenção | Client-side rendering da landing |

**REQUER MEDIÇÃO EM PRODUÇÃO** com Lighthouse CI ou PageSpeed Insights.

### 5.7 Auditoria por Página

| Página | Renderização | Problemas | Quick Win |
|---|---|---|---|
| `/` (Landing) | CSR via client components | Hero image 1.8MB, JS pesado, dados client-side | SSR + next/image priority |
| `/search` | CSR | Leaflet bundle, debounce OK | Lazy load map |
| `/categories/[slug]` | CSR (CategoryPageClientV2) | Imagens de categoria 5-7MB | WebP + CDN |
| `/companies/[id]` | Misto (dynamic imports) | Payload do serializer grande | Pagination, split |
| `/products` | CSR | TypeScript errors no build | Corrigir tipos |
| `/dashboard` | CSR (autenticado) | Recharts bundle, 7+ fetch calls | Parallel fetch, suspense |
| `/blog` | **NÃO IDENTIFICADO NA AUDITORIA** | - | Verificar se existe |
| `/chat` | CSR (autenticado) | WebSocket/polling overhead | Verificar implementação |
| `/compare` | CSR | Múltiplas empresas carregadas | Lazy load |
| `/review-dashboard` | CSR (autenticado) | Navigation component, múltiplos tabs | Code split por tab |

### 5.8 Build/TypeScript

- **`ignoreBuildErrors: true`** no `next.config.mjs` — bugs de tipo passam silenciosamente para produção ⚠️
- **`eslint: { ignoreDuringBuilds: true }`** — lint warnings ignorados no build ⚠️
- **Prioridade**: **P2 Médio**
- **Recomendação**: Remover `ignoreBuildErrors` e corrigir erros de tipo progressivamente.

---

## 6. Diagnóstico Backend

### 6.1 Estrutura Rails

- **Versão**: Rails 7.0.8, Ruby 3.2
- **Modo**: API + ActiveAdmin (não é API-only, inclui sprockets, turbo-rails, stimulus)
- **59 controllers** em `api/v1/`
- **21 serializers** (ActiveModelSerializers)
- **28+ background jobs** (Sidekiq)
- **Gem `bullet`** instalada para detecção de N+1 ✅
- **Gem `lograge`** para logs estruturados ✅
- **Gem `sentry-rails`** para error tracking ✅
- **Gem `scout_apm`** para APM ✅
- **Gem `yabeda-*`** para métricas Prometheus ✅

### 6.2 Endpoints Críticos

| Endpoint | Controller | Tamanho | Risco |
|---|---|---|---|
| `/api/v1/companies` | `companies_controller.rb` | **41KB** | 🔴 Controller monolítico |
| `/api/v1/company_dashboard` | `company_dashboard_controller.rb` | **45KB** | 🔴 Controller monolítico |
| `/api/v1/categories` | `categories_controller.rb` | **21KB** | ⚠️ Grande |
| `/api/v1/auth` | `auth_controller.rb` | **21KB** | ⚠️ Grande |
| `/api/v1/leads` | `leads_controller.rb` | **22KB** | ⚠️ Grande |
| `/api/v1/search` | `search_controller.rb` | **12KB** | ⚠️ Médio |
| `/api/v1/products` | `products_controller.rb` | **15KB** | ⚠️ Médio |
| `/api/v1/conversations` | `conversations_controller.rb` | REQUER MEDIÇÃO | ⚠️ Chat |
| `/api/v1/direct_messages` | `direct_messages_controller.rb` | REQUER MEDIÇÃO | ⚠️ Chat |

### Achado: Controllers Monolíticos

- `companies_controller.rb` (41KB) e `company_dashboard_controller.rb` (45KB) concentram dezenas de actions.
- **Impacto**: Difícil de manter, testar e otimizar individualmente.
- **Prioridade**: **P2 Médio**
- **Recomendação**: Extrair para Service Objects e controllers especializados.

### 6.3 Serialização

**CompanySerializer** (348 linhas, 10KB):
- **34+ atributos** incluindo associações profundas: `categories`, `badges`, `media_urls`, `videos`, `faqs`, `financing_profile`, `financing_partners`, `financing_offers`, `review_aggregates`
- Cada campo como `financing_partners` pode disparar queries adicionais se a associação não estiver pré-carregada
- **Verificação de tabela** (`ReviewAggregate.table_exists?`) chamada por serialização — custoso

**Prioridade**: **P1 Alto**

**Recomendação**:
1. Criar serializers diferenciados: `CompanyListSerializer` (leve) vs `CompanyDetailSerializer` (completo)
2. Remover `table_exists?` — verificar uma vez no boot
3. Garantir `includes` em todos os controllers que usam o serializer

### 6.4 Cache Backend

Cache identificado em:
- `Banner.rb`, `BannerGlobal.rb`, `Category.rb`, `Company.rb` (model-level cache) ✅
- `CacheableActions` concern nos controllers ✅
- `Cacheable` e `QueryCacheable` concerns ✅
- `CacheInvalidator` concern para invalidação ✅
- Redis como cache store ✅

**Lacunas**:
- **NÃO IDENTIFICADO NA AUDITORIA** se o endpoint da landing (`/api/v1/categories`, `/api/v1/companies?featured=true`) tem cache HTTP (ETag/Last-Modified)
- **NÃO IDENTIFICADO NA AUDITORIA** se response caching via `stale?`/`fresh_when` está implementado nos controllers

**Prioridade**: **P1 Alto**

### 6.5 Puma Configuration

#### Achado Crítico: Puma em Single-Mode

- **Evidência**: `config/puma.rb` linha 33: `# workers ENV.fetch("WEB_CONCURRENCY") { 2 }` — **COMENTADO**
- `preload_app!` também comentado
- Roda com 10 threads em um único processo
- **Impacto**: Sem cluster mode, uma request lenta bloqueia um dos 10 slots de thread. Sem `preload_app!`, não há Copy-on-Write.
- **Prioridade**: **P0 Crítico**
- **Recomendação**: Descomentar workers (2-4 conforme RAM disponível) e habilitar `preload_app!`.

### 6.6 Background Jobs

Stack: **Sidekiq 7 + sidekiq-scheduler** ✅

Jobs identificados para:
- Ratings recalculation
- Analytics aggregation
- Email notifications (welcome, digest, review notifications)
- Cache cleanup
- Geocoding
- Identity stitching
- Intent score decay
- Search reindexing
- Billing (Stripe sync)
- Chat processing

**Ponto positivo**: Operações pesadas delegadas a background ✅

### 6.7 Uploads e Arquivos

- **ActiveStorage** com DigitalOcean Spaces (S3-compatible) ✅
- **Variantes de imagem**: REQUER VERIFICAÇÃO se thumbnails são geradas
- **CDN para uploads**: REQUER VERIFICAÇÃO se Spaces CDN está habilitado
- **Assets estáticos**: Servidos diretamente pelo Nginx/Next.js **sem CDN**

---

## 7. Diagnóstico Banco de Dados

### 7.1 Schema

- **132 tabelas** — complexidade significativa
- **PostgreSQL 14** com extensões: `pg_trgm`, `btree_gin`, `pgcrypto`, `unaccent` ✅
- **Full-text search** via `tsvector` index na tabela `companies` ✅
- **Particionamento** implementado em `platform_events` (por mês, de maio a dezembro 2026) ✅

### 7.2 Índices — Pontos Positivos

- `companies`: 35+ índices incluindo GIN para `niche_tags`, `services_offered`, `project_types`, composite para ranking, full-text search
- `categories`: índices em `seo_url` (unique), `companies_count`, `average_rating`
- `analytics_events`: 12+ índices compostos
- Counter caches em `companies` (`reviews_count`, `rating_count`, `leads_count`, `profile_views_count`) ✅

### 7.3 Índices — Riscos Detectados

**Índices duplicados**:
- `banners_categories`: dois índices idênticos (`idx_banners_categories_unique` e `index_banners_categories_unique`)
- `companies`: dois índices GIN em `services_offered` (`index_companies_on_services_offered` e `index_companies_on_services_offered_gin`)

**Prioridade**: **P3 Baixo** (performance, mas tamanho do índice)

### 7.4 Tabelas de Alto Crescimento

| Tabela | Risco de Crescimento | Particionada? |
|---|---|---|
| `platform_events` | 🔴 Muito Alto | ✅ Sim (mensal) |
| `analytics_events` | 🔴 Muito Alto | ❌ Não |
| `chat_messages` | ⚠️ Alto | ❌ Não |
| `buyer_intent_activities` | ⚠️ Alto | ❌ Não |
| `banner_events` | ⚠️ Alto | ❌ Não |
| `company_daily_stats` | ⚠️ Médio | ❌ Não |

**Prioridade**: **P2 Médio**

**Recomendação**: Implementar particionamento em `analytics_events` e `banner_events` quando atingirem 1M+ registros. Considerar política de retenção para `chat_messages`.

### 7.5 Contadores

Counter caches identificados em `companies`:
- `reviews_count` ✅
- `rating_count` ✅
- `leads_count` ✅
- `profile_views_count` ✅
- `companies_count` em `categories` ✅

**Ponto positivo**: Counter caches implementados para as contagens mais acessadas.

### 7.6 Busca

- **pg_search** gem instalada ✅
- **Searchkick** + **OpenSearch 2.11** configurados ✅
- Full-text search PostgreSQL via `tsvector` como fallback ✅
- `unaccent` extension para busca sem acentos ✅
- `pg_trgm` para busca por similaridade ✅

### 7.7 Conexões e Pool

- **Database pool**: Configurado em `config/database.yml` — REQUER VERIFICAÇÃO do valor em produção
- **Puma threads**: 10 (default) — pool deve ser >= threads * workers

---

## 8. Diagnóstico de Imagens e Assets

### Resumo

- **~60MB+** de PNGs no diretório `public/`
- **6 imagens** acima de 5MB (ícones de categoria)
- **2 imagens duplicadas** (pricing hero)
- **1 textura de 1.9MB** carregada em TODA página via CSS
- **CDN**: DigitalOcean Spaces para uploads via ActiveStorage, mas assets estáticos do `public/` servidos diretamente **sem CDN**
- **next/image**: Configurado com WebP/AVIF para imagens remotas ✅, mas PNGs locais no `public/` são servidos como PNG bruto
- **sharp**: Instalado para otimização server-side ✅
- **OptimizedImage**: Componente wrapper existe mas é usado em apenas ~5 componentes

**Prioridade**: **P0 Crítico**

### Recomendação Completa

1. **Conversão imediata**: Todos os PNGs > 500KB → WebP com qualidade 80 (redução 70-80%)
2. **Remover duplicatas**: `pricing-hero-mockup.png` em dois diretórios
3. **Textura de fundo**: Comprimir de 1.9MB para ~150KB via WebP ou SVG pattern
4. **CDN**: Configurar DigitalOcean CDN ou Cloudflare para `public/` assets
5. **next/image com priority**: Para imagens above-the-fold (hero)
6. **Desabilitar textura mobile**: `@media (max-width: 768px) { body::before { display: none; } }`

---

## 9. Diagnóstico de Cache

### Cache Existente

| Camada | Implementado? | Detalhes |
|---|---|---|
| Redis (Rails.cache) | ✅ Sim | Redis 7 com 512MB maxmemory, LRU eviction |
| Model-level cache | ✅ Sim | Concerns Cacheable, QueryCacheable |
| Controller cache | ✅ Parcial | CacheableActions concern |
| HTTP cache headers | ✅ Parcial | `Cache-Control` para `/`, `/_next/static`, `/images/` |
| Browser cache (static) | ✅ Sim | `max-age=31536000, immutable` para static assets |
| CDN cache | ❌ Não | Sem CDN configurada |
| TanStack Query (frontend) | ✅ Sim | Client-side data caching |
| ISR/SSG | ❌ Não | Páginas públicas não usam revalidation |

### Oportunidades Ausentes

1. **ISR para categorias e empresas**: Páginas de alto tráfego que mudam raramente — `revalidate: 3600`
2. **HTTP ETag/304**: Endpoints REST sem `stale?`/`fresh_when`
3. **Edge caching**: Sem CDN = cada request vai direto ao servidor
4. **Home cache warming**: Script `warm-home-cache.mjs` existe ✅ mas depende de postbuild

**Prioridade**: **P1 Alto**

---

## 10. Diagnóstico de Infraestrutura

### Achado Crítico: VM Única (SPOF)

**Evidência**: `docker-compose.yml` mostra 6 serviços na mesma máquina:
- PostgreSQL 14
- Redis 7 (512MB)
- OpenSearch 2.11 (512MB JVM heap)
- Rails/Puma (:3001)
- Sidekiq (worker)
- Next.js (:3000)

**Impacto**:
- Contenção de CPU/RAM entre 6 serviços
- OpenSearch sozinho consome 512MB+ RAM
- Sem redundância — queda do VM = downtime total
- Sem backups automatizados via Docker (volumes locais)

**Prioridade**: **P0 Crítico**

### Nginx

- **Sem gzip/brotli** configurado no vhost — **Evidência**: `infra/nginx/app.avaliasolar.com.br.conf`
- **Sem HTTP/2** configurado
- **Sem cache de static files** no nível do Nginx
- `proxy_buffering off` — desabilita buffering de responses grandes
- Apenas HTTP (:80) no arquivo de configuração — SSL via Certbot

**Prioridade**: **P1 Alto**

**Recomendação**: Adicionar `gzip on`, `gzip_types`, `gzip_min_length 256` e `http2` ao Nginx.

### CI/CD

- **GitHub Actions** com build/push para GHCR ✅
- **Concurrency control** (cancel-in-progress) ✅
- **Deploy via SSH** para VM com health checks ✅
- **Migrations automáticas** pós-deploy ✅
- **Seed de dados** para banco vazio ✅
- **Docker image prune** para liberar espaço ✅
- **Sem rollback automatizado** — deploy falho requer intervenção manual ⚠️
- **Sem testes no pipeline de deploy** — `enterprise-pr-pipeline.yml` existe mas não é gate para main ⚠️

**Prioridade**: **P2 Médio**

### Capacidade Atual

- **CPU**: REQUER VERIFICAÇÃO EM PRODUÇÃO
- **RAM**: REQUER VERIFICAÇÃO EM PRODUÇÃO (mínimo ~4GB necessários: PG ~1GB, OpenSearch 512MB, Redis 512MB, Rails ~512MB, Next.js ~512MB, Sidekiq ~256MB)
- **Disco**: REQUER VERIFICAÇÃO EM PRODUÇÃO
- **Backups**: REQUER VERIFICAÇÃO — não identificado backup automatizado

---

## 11. Diagnóstico de Observabilidade

### Stack Existente

| Ferramenta | Status | Cobertura |
|---|---|---|
| Sentry (frontend + backend + Sidekiq) | ✅ Instalado | Error tracking |
| Scout APM | ✅ Instalado | Backend APM |
| Yabeda + Prometheus | ✅ Instalado | Métricas Rails + Puma + Sidekiq |
| PostHog | ✅ Instalado | Product analytics, session replay |
| Lograge | ✅ Instalado | Structured logging |
| Web Vitals Reporter | ✅ Componente ativo | Frontend Core Web Vitals |
| Lighthouse CI | ✅ Configurado | Performance regression |
| Bullet (dev) | ✅ Instalado | N+1 query detection |

### Lacunas

- **Grafana/dashboard**: Yabeda emite métricas Prometheus, mas **NÃO IDENTIFICADO NA AUDITORIA** se há Grafana configurado para visualização
- **Uptime monitoring**: **NÃO IDENTIFICADO NA AUDITORIA** (recomenda-se UptimeRobot, Better Uptime ou similar)
- **Slow query logging**: PostgreSQL `log_min_duration_statement` **NÃO IDENTIFICADO NA AUDITORIA** — verificar em produção
- **Alertas**: **NÃO IDENTIFICADO NA AUDITORIA** se Sentry/Scout têm alertas configurados para Slack/email

**Nota**: A observabilidade é surpreendentemente boa para o tamanho do time. O stack cobre ~80% do necessário.

---

## 12. Diagnóstico SEO / Core Web Vitals

### SEO Técnico

| Item | Status | Evidência |
|---|---|---|
| Title/Meta Description | ✅ | `app/layout.tsx` com SITE.description |
| Open Graph | ✅ | Configurado com imagem 1200x630 |
| Twitter Cards | ✅ | summary_large_image |
| Canonical | ✅ | `metadataBase` com `alternates.canonical` |
| robots.txt | ✅ | `app/robots.ts` |
| sitemap.xml | ✅ | `app/sitemap.ts` (5.9KB, dinâmico) |
| JSON-LD | ✅ | `components/JsonLd.tsx` no root layout |
| hreflang | ✅ | `pt-BR` configurado |
| Schema.org | ✅ Parcial | JsonLd no root, **mas por empresa/produto?** |

### Riscos de SEO

1. **Landing page client-side**: Conteúdo principal carregado via `fetch()` client-side. Googlebot pode indexar, mas com menos eficiência que SSR.
2. **Categorias client-side**: `CategoryPageClientV2.tsx` usa `'use client'`. Empresas listadas são carregadas client-side.
3. **Filtros de busca**: Parâmetros de URL de filtro não são bloqueados no robots.txt — pode gerar conteúdo duplicado.

### AEO (Answer Engine Optimization)

- **FAQ**: Módulo de FAQs existe em empresas ✅
- **Reviews**: Reviews com ratings estruturados ✅
- **Schema.org por empresa**: REQUER VERIFICAÇÃO se cada página de empresa tem Schema específico
- **Páginas por cidade/categoria**: REQUER VERIFICAÇÃO

**Prioridade**: **P1 Alto** (para tráfego orgânico)

---

## 13. Diagnóstico Mobile

### Gargalos Identificados

1. **PNGs de categoria 5-7MB** — devastador em redes móveis (~11s por imagem em 4G)
2. **Textura body::before 1.9MB** — carregada em todas as páginas, incluindo mobile
3. **Framer Motion** — animações podem causar jank em dispositivos low-end
4. **Chat widget** — ajustado para `max-h-[58vh]` e posicionado acima da bottom nav ✅
5. **MobileBottomNav** — componente dedicado para navegação mobile ✅
6. **Bottom padding**: `body` tem `md:pb-0` para compensar nav ✅

### Recomendações Mobile

1. Servir imagens em resolução menor via `srcSet`/`sizes` de `next/image`
2. Desabilitar textura de fundo em mobile via `@media (max-width: 768px) { body::before { display: none; } }`
3. Reduzir animações Framer Motion em `prefers-reduced-motion`
4. Lazy load de componentes abaixo do fold

**Prioridade**: **P1 Alto**

---

## 14. Gargalos Prioritários

| Prioridade | Área | Problema | Impacto | Esforço | Recomendação |
|---|---|---|---|---|---|
| **P0** | Imagens | PNGs 5-7MB no public/ | LCP 10s+ mobile, bounce rate | 1 dia | Converter para WebP, remover duplicatas |
| **P0** | Infra | VM única = SPOF | Downtime total em falha | 2 semanas | Separar banco gerenciado (DO Managed PG) |
| **P0** | Backend | Puma single-mode | Concorrência limitada | 1 hora | Descomentar workers, habilitar preload_app! |
| **P1** | Frontend | Landing 100% CSR | SEO fraco, TTI alto | 3-5 dias | Migrar para Server Components |
| **P1** | Infra | Nginx sem gzip | Payloads 3-5x maiores | 30 min | Adicionar gzip/brotli ao Nginx |
| **P1** | CSS | Textura 1.9MB global | Mobile LCP degradado | 1 hora | Comprimir para WebP ~150KB |
| **P1** | Backend | CompanySerializer monolítico | Payloads grandes, N+1 potencial | 2 dias | Criar ListSerializer vs DetailSerializer |
| **P1** | Cache | Sem HTTP caching | Requests redundantes | 2 dias | Implementar ETag/304 endpoints públicos |
| **P2** | SEO | Categorias CSR | Indexação fraca | 3 dias | ISR com revalidate |
| **P2** | DB | analytics_events sem partição | Degradação com volume | 1 dia | Particionar por mês |
| **P2** | CI/CD | Sem testes no deploy | Risco de regressão | 1 dia | Gate deploy com testes |
| **P2** | Build | ignoreBuildErrors: true | Bugs de tipo em produção | 2 dias | Remover flag, corrigir erros |
| **P3** | DB | Índices duplicados | Tamanho do index | 30 min | Remover duplicatas |

---

## 15. Quick Wins (1-3 dias)

1. **Converter PNGs para WebP** — redução de ~50MB para ~10MB (~1 dia)
2. **Ativar Puma clustered mode** — descomentar 1 linha (~30 min)
3. **Adicionar gzip ao Nginx** — 5 linhas de configuração (~30 min)
4. **Comprimir textura de fundo** — de 1.9MB para ~150KB WebP (~1 hora)
5. **Remover imagens duplicadas** — pricing-hero-mockup.png (~15 min)
6. **Desabilitar textura mobile** — CSS media query (~15 min)
7. **Adicionar `priority` ao hero image** da landing — `next/image priority` (~30 min)
8. **Habilitar `prefers-reduced-motion`** — desabilitar Framer Motion para quem solicita (~1 hora)

---

## 16. Plano de 30 Dias

### Semana 1 — Quick Wins Imediatos

- [ ] Converter todos PNGs > 500KB para WebP
- [ ] Ativar Puma clustered mode (2-4 workers)
- [ ] Adicionar gzip/brotli ao Nginx
- [ ] Comprimir textura de fundo
- [ ] Remover duplicatas de imagens
- [ ] Medir Core Web Vitals em produção com PageSpeed Insights

### Semana 2 — Frontend Performance

- [ ] Migrar landing page para Server Components
- [ ] Implementar `next/image` com `priority` para imagens above-the-fold
- [ ] Criar CompanyListSerializer leve para listagens
- [ ] Adicionar HTTP caching (ETag) para `/api/v1/categories`
- [ ] Desabilitar textura em mobile

### Semana 3 — Backend & Cache

- [ ] Implementar ETag/304 para endpoints públicos de alto tráfego
- [ ] Implementar ISR para páginas de categoria (`revalidate: 3600`)
- [ ] Auditar N+1 queries com Bullet em staging
- [ ] Separar CompanySerializer → List vs Detail
- [ ] Adicionar gate de testes no pipeline de deploy

### Semana 4 — Infra & Observabilidade

- [ ] Configurar uptime monitoring (UptimeRobot/Better Uptime)
- [ ] Configurar alertas Sentry para Slack
- [ ] Verificar/configurar slow query logging no PostgreSQL
- [ ] Documentar runbook de rollback
- [ ] Iniciar planejamento de separação do banco de dados

---

## 17. Plano de 90 Dias

### Mês 1 (Dias 1-30)

Conforme Plano de 30 Dias acima.

### Mês 2 (Dias 31-60)

- [ ] **Separar PostgreSQL** para DigitalOcean Managed Database
- [ ] **Configurar CDN** (Cloudflare ou DigitalOcean CDN) para assets estáticos
- [ ] **Implementar ISR** em todas as páginas públicas (categorias, empresas, produtos)
- [ ] **Redis cluster** ou Managed Redis para alta disponibilidade
- [ ] **Grafana** para visualização de métricas Yabeda/Prometheus
- [ ] **Particionamento** de `analytics_events` e `banner_events`

### Mês 3 (Dias 61-90)

- [ ] **Separar frontend e backend** em VMs/containers independentes
- [ ] **Auto-scaling** via DigitalOcean App Platform ou Kubernetes
- [ ] **OpenSearch dedicado** (DigitalOcean Managed ou separado)
- [ ] **Cache por camada completo**: Edge (CDN) → Next.js ISR → Redis → PostgreSQL
- [ ] **Busca escalável**: OpenSearch com sinônimos, facets, geo-search
- [ ] **Load testing** com k6 ou Artillery para identificar bottlenecks reais
- [ ] **Remover ignoreBuildErrors** e corrigir erros TypeScript

---

## 18. Arquitetura Alvo Enterprise

```
                    ┌─────────────┐
                    │  Cloudflare  │ (CDN + DDoS + WAF)
                    │   / DO CDN   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐     ┌──────────▼──────────┐
     │   Next.js SSR   │     │    Rails API         │
     │   (2+ replicas) │     │   (Puma clustered)   │
     │   App Platform  │     │   (2+ replicas)      │
     └────────┬────────┘     └──────────┬───────────┘
              │                         │
              │              ┌──────────┴──────────┐
              │              │                     │
              │    ┌─────────▼─────────┐  ┌────────▼────────┐
              │    │  PostgreSQL       │  │    Redis         │
              │    │  (Managed, HA)    │  │  (Managed)       │
              │    │  Read replicas    │  │                  │
              │    └───────────────────┘  └─────────────────┘
              │
              │    ┌───────────────────┐  ┌─────────────────┐
              │    │   OpenSearch      │  │    Sidekiq       │
              │    │  (Dedicated)      │  │  (Separate VM)   │
              │    └───────────────────┘  └─────────────────┘
              │
     ┌────────▼────────┐
     │  DigitalOcean    │
     │  Spaces (S3)     │
     │  + CDN endpoint  │
     └─────────────────┘

Observabilidade:
├── Sentry (errors)
├── Scout APM (traces)
├── Grafana + Prometheus (dashboards)
├── PostHog (product analytics)
├── UptimeRobot (uptime)
└── PgHero (database dashboard)
```

---

## 19. Métricas Alvo

### Frontend

| Métrica | Atual (Estimado) | Meta |
|---|---|---|
| LCP | ~4-6s mobile | < 2.5s |
| INP | ~150-300ms | < 200ms |
| CLS | ~0.05-0.15 | < 0.1 |
| TTFB | ~300-800ms | < 500ms |
| JS Bundle (landing) | REQUER MEDIÇÃO | < 200KB gzip |

### Backend

| Métrica | Atual (Estimado) | Meta |
|---|---|---|
| p95 API (simples) | REQUER MEDIÇÃO | < 300ms |
| p95 Search | REQUER MEDIÇÃO | < 800ms |
| Erro 5xx | REQUER MEDIÇÃO | < 0.1% |
| Slow queries | REQUER MEDIÇÃO | Monitoradas |

### Banco

| Métrica | Atual | Meta |
|---|---|---|
| Queries críticas | REQUER MEDIÇÃO | < 100ms |
| N+1 crítico | Bullet instalado | Zero |
| Índices | 95% cobertura | 100% FK indexadas |

### Infraestrutura

| Métrica | Atual | Meta |
|---|---|---|
| Uptime | REQUER MEDIÇÃO | > 99.9% |
| Deploy com rollback | ❌ Manual | ✅ Automatizado |
| Backup validado | REQUER VERIFICAÇÃO | ✅ Diário com teste |

---

## 20. Riscos Técnicos

1. **VM única** — qualquer falha de hardware/rede = downtime total
2. **Imagens pesadas** — 60MB+ de PNGs = experiência mobile degradada
3. **Puma single-mode** — concorrência limitada sob carga
4. **Sem CDN** — cada request estático vai direto ao servidor
5. **analytics_events sem partição** — tabela de alto crescimento sem limite
6. **Sem rollback automatizado** — deploy falho requer SSH manual
7. **`ignoreBuildErrors: true` no TypeScript** — bugs de tipo passam silenciosamente para produção
8. **`eslint: { ignoreDuringBuilds: true }`** — lint warnings ignorados no build
9. **Dados mockados em desenvolvimento** — REQUER VERIFICAÇÃO se dados de produção refletem uso real
10. **OpenSearch na mesma VM** — 512MB JVM heap compete com PostgreSQL e Rails

---

## 21. Decisões Necessárias

1. A infraestrutura continuará em uma VM única? Quando migrar?
2. Orçamento mensal aceitável para DigitalOcean Managed Database? (~$15-60/mês)
3. Usar Cloudflare (gratuito) ou DigitalOcean CDN para assets?
4. Priorizar SEO (SSR/ISR) ou features de dashboard para o próximo trimestre?
5. Implementar Sentry Performance Monitoring (pago) ou manter Scout APM?
6. Habilitar OpenSearch dedicado ou manter na mesma VM?
7. Implementar GraphQL como camada principal ou manter REST + GraphQL paralelo?
8. Budget para CDN/Object Storage/Managed DB pode chegar a quanto/mês?

---

## 22. Checklist Final de Performance

### Frontend

- [ ] Todas imagens > 500KB convertidas para WebP/AVIF
- [ ] Landing page com Server Components
- [ ] `next/image` com `priority` no hero
- [ ] `next/dynamic` para Recharts, Leaflet, Framer Motion pesado
- [ ] Bundle da landing < 200KB gzip
- [ ] LCP < 2.5s (PageSpeed Insights)
- [ ] Textura de fundo < 200KB ou CSS-only
- [ ] Textura desabilitada em mobile
- [ ] `ignoreBuildErrors` removido
- [ ] `eslint.ignoreDuringBuilds` removido

### Backend

- [ ] Puma clustered mode ativo
- [ ] CompanyListSerializer para listagens
- [ ] HTTP caching (ETag) em endpoints públicos
- [ ] Zero N+1 queries em rotas críticas (validado com Bullet)
- [ ] Controllers monolíticos refatorados
- [ ] p95 < 300ms em endpoints simples

### Banco de Dados

- [ ] Índices duplicados removidos
- [ ] analytics_events particionada
- [ ] Slow query logging ativo
- [ ] Backups automatizados validados
- [ ] Counter caches verificados
- [ ] Pool de conexões dimensionado corretamente

### Infraestrutura

- [ ] Nginx com gzip/brotli
- [ ] Nginx com HTTP/2
- [ ] CDN para assets estáticos
- [ ] PostgreSQL separado (managed)
- [ ] Uptime monitoring configurado
- [ ] Rollback automatizado documentado

### SEO

- [ ] Páginas públicas com SSR ou ISR
- [ ] Schema.org para empresas e produtos
- [ ] Filtros de busca com canonical correto
- [ ] Core Web Vitals "Good" no Search Console

### Mobile

- [ ] LCP < 2.5s em 4G simulado
- [ ] Imagens com srcSet/sizes otimizados
- [ ] Animações respeitam prefers-reduced-motion
- [ ] Tap targets >= 44x44px

### Observabilidade

- [ ] Sentry com alertas para Slack
- [ ] Uptime monitor ativo
- [ ] Grafana com dashboard de métricas
- [ ] Slow query logging PostgreSQL
- [ ] Web Vitals tracking ativo

### Segurança Relacionada à Performance

- [x] Rate limiting (Rack::Attack) ✅
- [x] CSP headers ✅
- [x] HSTS ✅
- [ ] Paginação obrigatória em todos endpoints de listagem
- [ ] Upload max size configurado (25MB Nginx, 2MB Server Actions)
- [ ] Logs sem dados sensíveis validado

---

> **Documento gerado em**: 27/06/2026
> **Próxima revisão recomendada**: Após implementação do Plano de 30 Dias
> **Classificação**: CONFIDENCIAL — Uso interno da equipe Avalia Solar

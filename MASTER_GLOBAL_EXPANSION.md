# MASTER_GLOBAL_EXPANSION.md

> **Avalia Solar → Avalia Global Energy Trust Network**
>
> Status: Master discovery / architecture / product execution plan
> Markets: 🇧🇷 Brazil → 🇺🇸 United States
> Target quality: **A+++ premium, global-grade, mobile-first, trust-first, SEO/AEO-first**
> Date: 2026-08-29

---

## 0. North Star

O objetivo **não** é traduzir o Avalia Solar para inglês nem duplicar o produto para os EUA.

O objetivo é transformar a base atual em uma plataforma **multi-market** de descoberta, reputação, comparação, conteúdo, comunidade e geração de intenção comercial para a indústria de energia.

### Posicionamento proposto

**Brazil:** Avalia Solar  
**Global/USA:** Avalia / Avalia Energy  
**Categoria:** Energy Trust Network  
**Promise:** `Find. Compare. Trust.`

```text
                         AVALIA
                  ENERGY TRUST NETWORK
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     DISCOVERY         REPUTATION         INTENT
        │                 │                 │
 Search/Maps           Reviews           Quotes
 Companies             Projects          Leads
 Products              Creators          Compare
 Categories            Trust Score       AI Match
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                     TRUST GRAPH
                          │
               ┌──────────┴──────────┐
               │                     │
            🇧🇷 BR                 🇺🇸 US
```

### Regra arquitetural

> **1 core global + módulos de mercado. Nunca 2 aplicações independentes.**

---

# 1. Diagnóstico do repositório atual

A base atual é suficientemente madura para internacionalização, mas ainda carrega conceitos centrados em Brasil e em `Company` que precisam ser desacoplados antes de escalar.

## 1.1 Stack atual confirmada

### Frontend — `AB0-1-front`
- Next.js 14 / App Router
- React 18 / TypeScript
- Tailwind
- Radix UI
- TanStack Query
- Apollo / GraphQL
- Zustand
- Zod
- React Hook Form
- Framer Motion
- Leaflet
- PostHog
- Sentry
- PWA/offline primitives via Dexie
- Jest / Testing Library / Playwright / axe
- Lighthouse CI disponível

### Backend — `AB0-1-back`
- Rails 7.0 / Ruby 3.2
- PostgreSQL
- Redis
- Sidekiq
- Active Storage / S3-compatible storage
- Devise / JWT / OAuth
- Active Admin
- Pundit
- Rack Attack
- pg_search + pg_trgm + unaccent
- PostHog / Mixpanel
- Sentry / New Relic / Scout / Prometheus/Yabeda
- PaperTrail
- FriendlyId
- RSpec

## 1.2 Capacidades já existentes que DEVEM ser preservadas

Classificação:

- `KEEP`: manter arquitetura e internacionalizar apenas dados/copy.
- `REFACTOR`: capacidade boa, modelo ainda BR/company-centric.
- `GLOBALIZE`: adicionar market/locale/currency/geography.
- `NEW`: inexistente ou insuficiente para expansão.

| Domínio | Decisão | Observação |
|---|---|---|
| Companies | REFACTOR | virar Organization + Market Presence progressivamente |
| Categories | GLOBALIZE | taxonomia global + aliases por mercado |
| Reviews | GLOBALIZE | virar Trust Review + verificação estruturada |
| Products | GLOBALIZE | catálogo por mercado, fabricante, disponibilidade |
| Feed | KEEP/GLOBALIZE | forte ativo de retenção e discovery |
| Groups | KEEP/GLOBALIZE | comunidades por mercado/tema |
| Creator | KEEP/GLOBALIZE | Professional Reputation Graph |
| Compare | REFACTOR | comparação estruturada de empresas/propostas/produtos |
| Quote Form | REFACTOR | schema por mercado e vertical |
| Leads | REFACTOR | consent, source, market, attribution, routing |
| Materials | KEEP | locale/market + lead attribution |
| Notifications | KEEP | preferências por locale/timezone/channel |
| Analytics | GLOBALIZE | market/country/locale/currency em todos os eventos |
| Billing | REFACTOR | catálogo/preço/imposto por market/currency |
| Active Admin | REFACTOR | Market selector + operações BR/US |
| Search | REFACTOR | geo hierarchy + ZIP + service areas |
| SEO | REFACTOR | hreflang + localized canonical + programmatic SEO |
| Trust Score | NEW | principal moat/IP da plataforma |
| Licenses/Certifications | NEW | essencial para US e trust |
| Organization Graph | NEW | separar entidade global da presença local |
| Proposal Marketplace | NEW | fase posterior; não bloquear MVP US |
| Data Intelligence | NEW | monetização enterprise futura |

---

# 2. P0 — Foundation: transformar o sistema em multi-market

**Nenhum rollout US deve começar antes desta camada.**

## 2.1 Criar conceito de Market

### Backend

Criar:

```text
AB0-1-back/app/models/market.rb
AB0-1-back/app/models/market_configuration.rb
AB0-1-back/app/services/markets/resolver.rb
AB0-1-back/app/services/markets/context.rb
AB0-1-back/app/controllers/concerns/market_context.rb
```

Schema inicial:

```ruby
markets
- id
- code            # BR, US
- name
- default_locale  # pt-BR, en-US
- currency        # BRL, USD
- timezone_group
- phone_country_code
- measurement_system # metric, imperial
- active
- config jsonb
```

Seed obrigatório:

```text
BR | pt-BR | BRL | metric
US | en-US | USD | imperial
```

### Definition of Done
- [ ] request conhece `current_market`
- [ ] jobs recebem market explicitamente
- [ ] cache keys incluem market
- [ ] analytics incluem market
- [ ] URLs públicas resolvem market deterministicamente
- [ ] nenhum domínio core usa `if country == ...` espalhado

---

# 3. P0 — Organization Model / Company Evolution

`Company` hoje é um aggregate central. Não fazer big-bang rename.

## 3.1 Estratégia de migração segura

### Fase A
Adicionar abstrações:

```text
organizations
organization_market_presences
organization_locations
organization_service_areas
```

```text
Organization
 ├── legal/global identity
 ├── brands
 └── MarketPresence
      ├── BR
      └── US
```

### Organization

```text
id
name
canonical_slug
organization_type
website
logo
founded_year
status
metadata
```

### OrganizationMarketPresence

```text
organization_id
market_id
local_name
local_slug
business_identifier
claimed_at
verified_at
verification_level
primary_locale
status
attributes jsonb
```

### Compatibility

- `companies` continua operando durante migração.
- Criar adapter/projection `Company -> OrganizationMarketPresence`.
- APIs v1 continuam compatíveis.
- APIs globais novas entram em `/api/v2` apenas quando contrato justificar.

### Não fazer
- [ ] não criar `UsCompany`
- [ ] não criar `BrazilCompany`
- [ ] não duplicar reviews por país
- [ ] não duplicar dashboards

---

# 4. P0 — Geography Engine

O modelo atual precisa suportar dois paradigmas:

```text
BR: Country → State → City → coordinates/radius
US: Country → State → County → City → ZIP → coordinates/service area
```

Criar:

```text
countries
administrative_regions
localities
postal_areas
service_areas
organization_locations
```

## US

Campos essenciais:
- state code
- county
- city
- ZIP / ZIP5
- lat/lng
- timezone
- service radius
- served ZIPs
- statewide flag

## BR

Preservar:
- UF
- município
- IBGE code quando possível
- lat/lng
- raio de atendimento

## Search UX

BR:
`Energia Solar em Cuiabá, MT`

US:
`Solar installers near 33101`

### Tasks
- [ ] geocoder provider abstraction
- [ ] postal code normalization
- [ ] ZIP autocomplete
- [ ] CEP autocomplete
- [ ] service-area query
- [ ] distance sorting
- [ ] geo indexes
- [ ] privacy: nunca expor localização precisa de usuário

---

# 5. P0 — i18n / l10n completo

Não usar tradução improvisada em componentes.

## Frontend structure

```text
AB0-1-front/
  i18n/
    config.ts
    routing.ts
    messages/
      pt-BR/
      en-US/
  markets/
    br/
      config.ts
      categories.ts
      formats.ts
    us/
      config.ts
      categories.ts
      formats.ts
```

## Tudo deve ser localizável
- UI copy
- validation
- errors
- emails
- push notifications
- transactional templates
- SEO title/description
- category labels
- structured data
- dates
- numbers
- currencies
- measurement units
- legal/consent copy

## Formatting

Nunca concatenar manualmente:

```text
R$ + value
$ + value
value + km
```

Criar helpers:

```text
formatCurrency()
formatDistance()
formatArea()
formatPower()
formatEnergy()
formatDate()
formatPhone()
```

---

# 6. P0 — URL Architecture + SEO/AEO

## Estratégia recomendada

Manter domínios de mercado com identidade clara e core compartilhado.

```text
Brazil: avaliasolar.com.br
USA/global: domínio Avalia global a definir
```

Evitar depender de auto-redirect por IP. Usuário deve poder trocar market explicitamente.

## Canonical routes conceituais

```text
/companies
/companies/:slug
/categories/:slug
/products/:slug
/reviews/:id
/creators/:slug
/groups/:slug
/feed
/compare
```

Localized discovery:

```text
/solar-installers/florida/miami
/solar-installers/texas/austin
/battery-installers/arizona/phoenix
```

BR:

```text
/energia-solar/mt/cuiaba
/empresas/energia-solar/mt/cuiaba
```

## Technical SEO P0
- [ ] hreflang `pt-BR` / `en-US`
- [ ] x-default onde adequado
- [ ] canonical por market
- [ ] sitemap index por market/entity
- [ ] robots rules por environment
- [ ] localized OpenGraph
- [ ] localized Twitter metadata
- [ ] Organization schema
- [ ] LocalBusiness schema
- [ ] Product schema
- [ ] Review schema somente quando elegível pelas regras do Google
- [ ] BreadcrumbList
- [ ] Article
- [ ] Person/ProfilePage
- [ ] FAQ apenas quando semanticamente válido
- [ ] noindex de combinações pobres/duplicadas
- [ ] SSR/ISR para landing pages críticas

## AEO / AI discovery
- [ ] respostas factuais estruturadas
- [ ] provenance de claims
- [ ] páginas de comparação semanticamente legíveis
- [ ] entities com IDs estáveis
- [ ] facts atualizados e timestamped
- [ ] API interna de knowledge graph

---

# 7. P0 — Taxonomy global

Separar conceito global de label local.

```text
TaxonomyNode
  solar
  solar-installation
  battery-storage
  ev-charging
  inverter
  solar-panel
  financing
  commercial-solar
  utility-scale
```

Labels:

```text
solar-installation
 pt-BR: Integradores de Energia Solar
 en-US: Solar Installers
```

### Tasks
- [ ] category canonical key
- [ ] localized slug
- [ ] localized SEO
- [ ] aliases/synonyms
- [ ] parent/child hierarchy
- [ ] market availability
- [ ] migration dos slugs atuais sem quebrar SEO
- [ ] redirect registry 301

---

# 8. P0 — Trust Layer: Avalia Trust Score™

Este deve se tornar o principal diferencial proprietário.

## 8.1 Não é média de estrelas

```text
Trust Score = verified identity
            + verified reviews
            + verified projects
            + licenses/certifications
            + responsiveness
            + complaint resolution
            + longevity
            + profile completeness
            + content/project evidence
            + risk/fraud signals
```

## 8.2 Schema

```text
trust_scores
trust_score_versions
trust_signals
trust_signal_sources
verification_cases
verification_evidence
```

Campos:

```text
subject_type
subject_id
market_id
score
confidence
model_version
calculated_at
explanation jsonb
```

## Regras críticas
- [ ] score versionado
- [ ] explicável
- [ ] auditável
- [ ] sem pay-to-win
- [ ] plano pago nunca compra pontos
- [ ] detectar gaming/review rings
- [ ] confidence separado de score
- [ ] recalculation async
- [ ] admin override exige reason + audit log

## UI A+++

```text
AVALIA VERIFIED
Trust Score 94/100
High confidence

Identity verified       ✓
License verified        ✓
Projects verified       ✓
Review integrity        Excellent
Response quality        Excellent
```

---

# 9. P0 — Reviews 2.0 / Verified Energy Reviews

Evoluir reviews para dados estruturados de decisão.

## Review dimensions

BR/US shared:
- overall
- quality
- communication
- value
- after-sales
- timeliness

Solar project context:
- installation date
- system size kW
- panel brand/model
- inverter brand/model
- battery brand/model
- financing/purchase type
- residential/commercial
- project photos

Verification:
- email/phone
- proof of purchase optional/private
- proposal/contract evidence
- installation evidence
- company confirmation signal
- fraud score

### UX
- [ ] progressivo; não transformar review em formulário interminável
- [ ] “Verified installation” badge
- [ ] reviewer privacy controls
- [ ] company reply
- [ ] helpful votes
- [ ] report/dispute
- [ ] moderation SLA
- [ ] translated summary opcional; original sempre preservado

---

# 10. P0 — US Licenses & Certifications

Criar domínio independente:

```text
licenses
certifications
organization_credentials
professional_credentials
credential_verifications
```

Suportar:
- state contractor licenses
- electrical contractor licenses
- insurance evidence
- NABCEP credentials
- manufacturer certifications
- expiration date
- issuing authority
- verification URL/reference

**Nunca** modelar NABCEP como campo booleano em `companies`.

---

# 11. P1 — Search A+++ / Discovery Engine

Objetivo: ser mais útil para decisão do que um diretório.

## Ranking

Separar claramente:

```text
organic_score
trust_score
relevance_score
geo_score
freshness_score
sponsored_score
```

Patrocinado nunca deve contaminar Trust Score.

## Filters US
- ZIP / distance
- residential/commercial
- solar/battery/EV
- verified
- Trust Score
- rating
- review count
- years in business
- certifications
- financing
- products/brands
- service area

## Filters BR
Preservar UF/cidade/raio e evoluir para os mesmos sinais de confiança.

## Backend
- [ ] SearchQuery object
- [ ] SearchResult serializer único
- [ ] Postgres primeiro; OpenSearch/Elasticsearch somente quando métricas justificarem
- [ ] trigram/unaccent continuar como fallback eficiente
- [ ] query observability
- [ ] zero-result analytics
- [ ] typo tolerance
- [ ] synonyms

---

# 12. P1 — Company/Organization Profile A+++

Perfil deve responder em <10 segundos:

1. Quem é?
2. Posso confiar?
3. Atende minha região?
4. Faz o que preciso?
5. Que equipamentos utiliza?
6. O que clientes dizem?
7. Que projetos já fez?
8. Como comparar?
9. Como pedir orçamento?

## Information architecture

```text
Hero
Trust summary
Service area
Reviews
Projects
Products & brands
Credentials
Team/professionals
Materials
FAQ
Posts
Similar companies
Quote CTA
```

### Premium rules
- visual editorial, não “dashboard dentro de página pública”
- whitespace consistente
- uma cor de ação dominante
- badges com hierarquia
- sticky quote CTA sem bloquear conteúdo
- skeletons estáveis
- zero layout shift
- images responsive + AVIF/WebP

---

# 13. P1 — Compare 2.0

Criar 3 comparadores distintos:

1. Company Compare
2. Product Compare
3. Proposal Compare (fase marketplace)

## Company Compare

```text
Rating
Trust Score
Verified reviews
Years
Credentials
Service area
Solar
Storage
EV charging
Financing
Warranty
Response time
```

### Tasks
- [ ] URL shareable
- [ ] max 3 desktop / mobile swipe
- [ ] difference highlighting
- [ ] sticky attribute labels
- [ ] accessible table semantics
- [ ] CTA `Request quotes from selected`
- [ ] analytics: compare_add/remove/share/convert

---

# 14. P1 — Feed = Energy Professional Network

O feed já existe e deve ser tratado como ativo estratégico, não como feature social isolada.

## Feed entities
- publication
- review
- project
- product launch
- article/news
- question
- group post
- credential earned
- company update

## Ranking

```text
viewer relevance
market relevance
follow graph
category affinity
quality
freshness
trust
negative feedback
```

### P1
- [ ] market-aware feed
- [ ] language-aware feed
- [ ] following graph
- [ ] “For You” / “Following”
- [ ] topic follow
- [ ] company follow
- [ ] creator follow
- [ ] save
- [ ] hide/not interested
- [ ] report
- [ ] dwell-time analytics

### P2
- [ ] recommendations
- [ ] collaborative signals
- [ ] AI summaries
- [ ] translated posts opt-in

---

# 15. P1 — Creator → Professional Reputation Graph

Creator não deve ser apenas autor de conteúdo.

Evoluir para `Professional`:

```text
Professional
- identity
- headline
- market
- location
- specialties
- credentials
- organizations
- projects
- publications
- contributions
- followers
- trust/reputation
```

Roles:
- installer
- engineer
- electrician
- salesperson
- consultant
- manufacturer rep
- researcher
- journalist/content creator

Manter compatibilidade com creators existentes via projection/role.

---

# 16. P1 — Groups / Community

Grupos devem gerar retenção e conhecimento proprietário.

Exemplos US:
- Solar Installers USA
- Florida Solar Professionals
- Texas Solar Professionals
- Battery Storage
- EV Charging
- Enphase Installers
- Commercial Solar

Exemplos BR equivalentes por região/vertical.

### Capabilities
- [ ] public/private
- [ ] moderation roles
- [ ] questions
- [ ] posts
- [ ] polls
- [ ] projects
- [ ] events
- [ ] resources
- [ ] pinned content
- [ ] market scope
- [ ] language scope
- [ ] anti-spam

---

# 17. P1 — Quote / Lead Engine global

Lead é dado crítico e deve carregar provenance.

## Lead contract

```text
market_id
locale
currency
source
source_entity_type
source_entity_id
campaign
utm_*
anonymous_id
user_id
intent_type
category
location
postal_code
consent_version
consent_timestamp
routing_status
```

## Source examples

```text
company_profile
compare
material_download
feed
article
creator
AI
organic_search
paid_campaign
```

### Lead lifecycle

```text
created → qualified → routed → accepted → contacted → proposal → won/lost
```

### A+++
- [ ] idempotency
- [ ] attribution preserved end-to-end
- [ ] consent evidence
- [ ] duplicate detection
- [ ] spam/fraud scoring
- [ ] routing rules
- [ ] company SLA
- [ ] user status visibility
- [ ] webhook/CRM integration

---

# 18. P1 — Billing multi-market

Não compartilhar preços BR e US no mesmo campo.

Criar:

```text
products/plans
market_prices
entitlements
subscriptions
invoices/payments references
```

`market_prices`:

```text
plan_id
market_id
currency
interval
amount
external_price_id
active
```

### Requirements
- [ ] BRL + USD
- [ ] tax metadata
- [ ] market-specific trials
- [ ] feature entitlements independentes do Stripe Price ID
- [ ] webhook idempotency
- [ ] billing audit log
- [ ] graceful downgrade
- [ ] dunning
- [ ] plan grandfathering

---

# 19. P1 — Active Admin Global Operations Center

O admin precisa deixar de ser uma coleção de resources isolados e virar operação multi-market.

## Global header

```text
Market: [ Brazil ▼ ]
Locale: pt-BR
```

## Hubs
- Organizations
- Reviews & Trust
- Leads
- Content
- Products
- Credentials
- Billing
- Moderation
- Market Configuration
- Analytics

### Company Hub
Dentro da organização:

```text
Overview
Market presences
Locations
Products
Projects
Services
Materials
FAQs
Credentials
Reviews
Leads
Billing
Trust
Audit log
```

### P0 admin safety
- [ ] market scoping default
- [ ] cross-market super-admin only
- [ ] destructive action confirmation
- [ ] PaperTrail everywhere critical
- [ ] reason required for moderation/trust override

---

# 20. P1 — Avalia AI

IA deve operar sobre dados Avalia e nunca inventar ranking.

## Consumer assistant

```text
“I need solar + battery near Austin.”
       ↓
Intent extraction
       ↓
Geo + taxonomy
       ↓
Trust/search retrieval
       ↓
Explainable shortlist
       ↓
Compare / quote
```

## Guardrails
- [ ] citations/provenance internas
- [ ] não afirmar licença não verificada
- [ ] não transformar sponsored em recomendação orgânica
- [ ] explain why matched
- [ ] freshness timestamp
- [ ] human-readable uncertainty
- [ ] PII minimization

## Company AI
- review sentiment
- response drafts
- reputation gaps
- competitor benchmarking
- lead prioritization
- profile completeness

---

# 21. P2 — Proposal Marketplace

Não bloquear lançamento US por isso.

Depois que discovery + trust + supply estiverem fortes:

```text
User intent
 → matched installers
 → standardized proposals
 → compare
 → choose
 → installation
 → verified review
```

Schema futuro:

```text
quote_requests
quote_matches
proposals
proposal_line_items
proposal_equipment
proposal_financing
proposal_warranties
proposal_status_events
```

A plataforma deve comparar **valor e confiança**, não incentivar apenas price race.

---

# 22. P2 — Avalia Intelligence

Produto enterprise para fabricantes, distribuidores e grandes integradores.

## Datasets
- search demand
- category demand
- geographic demand
- review sentiment
- brand consideration
- product mentions
- project equipment
- quote intent
- company response
- conversion

## Produtos
- Market Intelligence dashboard
- Reputation Benchmark
- Brand Share of Voice
- Installer Adoption
- Geographic Opportunity
- API/exports enterprise

### Privacy
Somente dados agregados/anônimos quando aplicável; contratos e compliance próprios.

---

# 23. Compliance BR + US

Criar camada de privacy/compliance por market.

## Shared
- consent registry
- data inventory
- retention policies
- deletion workflow
- export workflow
- access audit
- encryption
- secrets management
- least privilege
- incident response

## Brazil
- LGPD
- consent/legal basis mapping
- DSR workflow

## USA
- state privacy laws aplicáveis
- consent/preferences por estado quando necessário
- TCPA/CAN-SPAM review para comunicações/leads
- Terms/Privacy específicos
- counsel review antes de produção

> Compliance deve ser validado juridicamente; este documento é arquitetura de produto, não parecer jurídico.

---

# 24. Security A+++

## P0 gates
- [ ] CSP robusta
- [ ] HSTS
- [ ] secure cookies
- [ ] CSRF onde aplicável
- [ ] JWT rotation/revocation strategy
- [ ] OAuth account-linking hardening
- [ ] Rack Attack market-aware
- [ ] API rate limits por actor/IP/token
- [ ] upload MIME/content validation
- [ ] signed/private evidence URLs
- [ ] malware scanning para evidências/materiais
- [ ] admin 2FA obrigatório
- [ ] dependency scanning
- [ ] Brakeman
- [ ] secret scanning
- [ ] SAST/DAST gates
- [ ] audit log para trust/moderation/billing

---

# 25. Performance A+++ budgets

A experiência premium depende de velocidade.

## Public pages target p75
- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.1
- TTFB ideal ≤ 800ms

## Engineering budgets
- [ ] hero image corretamente dimensionada
- [ ] no image de 1000px renderizada em 24px
- [ ] `next/image` onde aplicável
- [ ] AVIF/WebP
- [ ] route-level bundle budget
- [ ] dynamic imports para mapas/modais pesados
- [ ] server components por padrão
- [ ] client boundary mínima
- [ ] cache tagging/revalidation
- [ ] API pagination/cursor
- [ ] eliminate N+1
- [ ] Redis para hot paths medidos
- [ ] CDN assets
- [ ] Lighthouse CI blocking thresholds

---

# 26. Design System A+++

Criar `Avalia Design System`, não redesenhar página por página sem sistema.

## Foundations
- typography scale
- spacing 4/8-based
- radius tokens
- shadow/elevation restrained
- border tokens
- semantic colors
- motion tokens
- container widths
- breakpoints
- icon rules

## Brand principles
- premium/editorial
- Swiss/minimal
- preto + amarelo Avalia como identidade
- azul somente quando semanticamente necessário
- nada “coloridinho”
- sem glassmorphism pesado
- 3D/origami reservado para brand moments, não controles funcionais

## Components
- Button
- Input
- Select
- Combobox
- Search
- Chip
- Badge
- TrustBadge
- Rating
- Avatar
- CompanyLogo
- Card
- CompanyCard
- ProductCard
- ReviewCard
- FeedCard
- EmptyState
- Skeleton
- Modal/Drawer
- Tabs
- DataTable
- CompareTable
- MobileBottomNav

## Accessibility
- WCAG 2.2 AA target
- keyboard complete
- focus visible
- 44px touch targets quando aplicável
- reduced motion
- semantic headings
- accessible names
- contrast tests
- axe + Playwright gates

---

# 27. Observability / Analytics global

A base já possui analytics e observability; padronizar contrato global.

Todo evento novo:

```json
{
  "event": "company_viewed",
  "market": "US",
  "locale": "en-US",
  "currency": "USD",
  "entity_type": "organization_market_presence",
  "entity_id": "...",
  "anonymous_id": "...",
  "source": "search",
  "timestamp": "..."
}
```

## North Star metrics

Consumer:
- search → profile CTR
- profile → compare
- compare → lead
- qualified lead rate
- time to useful result

Supply:
- claimed profiles
- verified profiles
- response rate/time
- profile completeness
- active companies

Trust:
- verified review ratio
- dispute rate
- fraud rejection rate
- Trust Score coverage

Network:
- follows
- feed DAU/WAU
- contribution rate
- group participation

Revenue:
- MRR/ARR by market
- ARPA
- CAC
- lead revenue
- expansion/contraction
- churn

---

# 28. Testing matrix

## Every global feature

```text
Market: BR / US
Locale: pt-BR / en-US
Viewport: mobile / tablet / desktop
Auth: anonymous / consumer / company / creator / admin
Theme if supported
Network: normal / slow
```

## CI gates
- frontend typecheck
- lint
- unit
- integration
- Playwright critical journeys
- accessibility
- Lighthouse
- Rails specs
- security scans
- migrations safety
- contract tests

Critical E2E:
1. search → company → compare → lead
2. material → lead attribution
3. review creation → moderation → publish
4. company claim → verification
5. subscription → entitlement
6. US ZIP search
7. locale/market switch preserving intent

---

# 29. Data migration strategy

## Golden rule

**Expand → backfill → dual-read/dual-write when needed → validate → cutover → contract.**

Nunca renomear/remover campos centrais na primeira migration.

### Migration waves

**Wave 1**
- markets
- market_id nullable nos domínios críticos
- backfill BR

**Wave 2**
- organizations / market presences
- project current companies

**Wave 3**
- geography normalized

**Wave 4**
- localized taxonomy/content

**Wave 5**
- trust/credentials

Depois tornar constraints `NOT NULL` onde seguro.

---

# 30. Market launch plan

## Phase 0 — Global-ready Brazil
**Objetivo:** internacionalizar sem mudar experiência brasileira.

- [ ] Market foundation
- [ ] i18n
- [ ] currency/units
- [ ] geography abstraction
- [ ] organization projection
- [ ] localized taxonomy
- [ ] analytics contract
- [ ] SEO hreflang architecture
- [ ] regression BR

**Gate:** nenhum comportamento BR crítico regrediu.

## Phase 1 — US Internal Alpha
- [ ] US market seed
- [ ] en-US
- [ ] USD
- [ ] states/cities/ZIP
- [ ] US company profile
- [ ] credentials
- [ ] US search
- [ ] US review form
- [ ] US legal pages

## Phase 2 — Florida Beachhead
- [ ] initial supply acquisition
- [ ] verified profiles
- [ ] Miami / Orlando / Tampa / Jacksonville coverage
- [ ] solar + battery categories
- [ ] localized landing pages
- [ ] lead routing
- [ ] quality monitoring

## Phase 3 — Texas
- [ ] Austin
- [ ] Dallas-Fort Worth
- [ ] Houston
- [ ] San Antonio

## Phase 4
Arizona / California / selected high-value markets based on demand and regulatory/commercial validation.

## Phase 5
National US coverage.

---

# 31. A+++ Launch Gates

US public launch só recebe selo A+++ se:

## Product
- [ ] search useful
- [ ] profiles trustworthy
- [ ] compare works mobile
- [ ] quote flow ≤ poucos passos e progressivo
- [ ] empty states úteis
- [ ] no dead CTAs

## Trust
- [ ] verified identity flow
- [ ] credentials
- [ ] review moderation
- [ ] dispute flow
- [ ] sponsored disclosure
- [ ] Trust Score explainability

## Engineering
- [ ] Core Web Vitals target
- [ ] zero P0/P1 known bugs
- [ ] observability dashboards
- [ ] rollback tested
- [ ] backups tested
- [ ] queue health
- [ ] rate limiting

## SEO
- [ ] canonical/hreflang
- [ ] sitemap
- [ ] structured data validated
- [ ] no accidental noindex
- [ ] no duplicate localized pages

## Accessibility
- [ ] keyboard
- [ ] screen reader critical flows
- [ ] axe critical pages
- [ ] contrast

## Compliance
- [ ] Terms/Privacy reviewed
- [ ] consent records
- [ ] deletion/export workflow
- [ ] communication compliance reviewed

---

# 32. Repository implementation map

## Frontend

```text
AB0-1-front/
├── app/                         # GLOBALIZE routing/metadata
├── components/company/          # REFACTOR to market-aware entity view
├── components/feed/             # GLOBALIZE
├── app/groups/                   # GLOBALIZE
├── lib/api.ts                    # market/locale headers + contracts
├── lib/api/feed.ts               # market-aware feed contract
├── lib/analytics/                # standard global context
├── i18n/                         # NEW
├── markets/                      # NEW
├── lib/format/                   # NEW locale formatting
├── lib/market/                   # NEW resolver/context
├── components/trust/             # NEW
├── components/credentials/       # NEW
└── components/geography/         # NEW
```

## Backend

```text
AB0-1-back/
├── app/models/
│   ├── company*                  # compatibility layer
│   ├── market.rb                 # NEW
│   ├── organization.rb           # NEW
│   ├── organization_market_presence.rb
│   ├── organization_location.rb
│   ├── service_area.rb
│   ├── license.rb
│   ├── certification.rb
│   ├── trust_score.rb
│   └── trust_signal.rb
├── app/services/
│   ├── markets/                  # NEW
│   ├── geography/                # NEW
│   ├── trust/                    # NEW
│   ├── search/                   # REFACTOR
│   └── leads/                    # REFACTOR
├── app/controllers/api/v1/       # compatibility
├── app/controllers/api/v2/       # only where global contract requires
├── app/admin/                    # GLOBALIZE hubs/scoping
├── config/routes.rb              # GLOBALIZE carefully
├── config/locales/               # pt-BR + en-US
└── db/migrate/                   # expand/backfill strategy
```

---

# 33. Master execution backlog

## EPIC G0 — Architecture & contracts
- [ ] ADR: global core / market modules
- [ ] ADR: Organization vs Company migration
- [ ] ADR: domain/URL strategy
- [ ] ADR: API market resolution
- [ ] ADR: locale strategy
- [ ] data classification inventory

## EPIC G1 — Market foundation
- [ ] markets schema/model
- [ ] request context
- [ ] frontend market context
- [ ] cache partition
- [ ] job propagation
- [ ] analytics propagation

## EPIC G2 — Localization
- [ ] translation framework
- [ ] extract hardcoded strings
- [ ] en-US catalog
- [ ] formatting helpers
- [ ] email localization
- [ ] notification localization

## EPIC G3 — Organization graph
- [ ] organizations
- [ ] market presences
- [ ] locations
- [ ] service areas
- [ ] BR backfill
- [ ] compatibility projection

## EPIC G4 — Geography
- [ ] country/region/locality/postal models
- [ ] BR importer
- [ ] US importer/provider
- [ ] ZIP search
- [ ] service-area filtering

## EPIC G5 — Taxonomy
- [ ] canonical keys
- [ ] translations
- [ ] localized slugs
- [ ] redirects
- [ ] SEO metadata

## EPIC G6 — Trust
- [ ] trust schema
- [ ] signal registry
- [ ] v1 scoring model
- [ ] explainability
- [ ] trust UI
- [ ] fraud/risk hooks

## EPIC G7 — Reviews 2.0
- [ ] structured project context
- [ ] verification evidence
- [ ] moderation
- [ ] dispute
- [ ] company replies
- [ ] integrity metrics

## EPIC G8 — Credentials
- [ ] licenses
- [ ] certifications
- [ ] professional credentials
- [ ] expiration
- [ ] verification workflow

## EPIC G9 — Search
- [ ] unified query contract
- [ ] geo ranking
- [ ] filters
- [ ] zero-result UX
- [ ] search analytics

## EPIC G10 — Profiles
- [ ] global organization page
- [ ] market presence page
- [ ] trust block
- [ ] credentials
- [ ] service area
- [ ] projects/products/reviews

## EPIC G11 — Compare
- [ ] company compare v2
- [ ] product compare
- [ ] shareable compare
- [ ] lead conversion

## EPIC G12 — Leads
- [ ] global attribution contract
- [ ] consent registry
- [ ] dedup
- [ ] routing
- [ ] lifecycle
- [ ] CRM/webhooks

## EPIC G13 — Billing
- [ ] market prices
- [ ] entitlements
- [ ] USD
- [ ] billing admin
- [ ] webhook tests

## EPIC G14 — Feed/Network
- [ ] market/language scopes
- [ ] following
- [ ] topic graph
- [ ] ranking signals
- [ ] negative feedback

## EPIC G15 — Professional graph
- [ ] creator compatibility
- [ ] credentials
- [ ] organization history
- [ ] project/contribution graph

## EPIC G16 — Groups
- [ ] market groups
- [ ] moderation
- [ ] anti-spam
- [ ] discovery

## EPIC G17 — SEO/AEO
- [ ] hreflang
- [ ] sitemap partitions
- [ ] structured data
- [ ] programmatic geo pages
- [ ] AI-readable facts/provenance

## EPIC G18 — Admin
- [ ] market switcher
- [ ] organization hub
- [ ] trust moderation
- [ ] credentials verification
- [ ] lead ops

## EPIC G19 — Security/compliance
- [ ] privacy registry
- [ ] DSR
- [ ] retention
- [ ] security gates
- [ ] admin hardening

## EPIC G20 — Performance/accessibility
- [ ] CWV budgets
- [ ] bundle budgets
- [ ] image audit
- [ ] a11y gates
- [ ] mobile critical journeys

## EPIC G21 — US launch
- [ ] seed taxonomy
- [ ] seed geography
- [ ] supply acquisition
- [ ] Florida pages
- [ ] QA alpha
- [ ] production gates

---

# 34. Prioridade real — ordem de execução

```text
1. Market Context
2. i18n/l10n
3. Organization + Market Presence
4. Geography
5. Taxonomy
6. Analytics/SEO context
7. Trust + Credentials
8. Reviews 2.0
9. Search
10. Profile
11. Compare
12. Lead Engine
13. Billing
14. Feed/Professional Graph/Groups
15. Florida launch
16. Proposal Marketplace
17. Avalia Intelligence
```

**Não inverter 1–6.** Se páginas US forem construídas antes da fundação, criaremos dívida técnica e dois produtos acoplados artificialmente.

---

# 35. O que NÃO fazer

- ❌ traduzir componentes manualmente um por um sem framework
- ❌ criar fork `avalia-usa`
- ❌ criar tabelas `us_companies`
- ❌ assumir que cidade/estado BR resolve ZIP/service area US
- ❌ misturar ranking patrocinado com confiança
- ❌ usar estrelas como Trust Score
- ❌ colocar dezenas de booleans de certificação em Company
- ❌ lançar 50 estados com supply vazio
- ❌ gerar milhares de páginas SEO sem conteúdo útil
- ❌ esconder sponsored content
- ❌ permitir pagamento aumentar score de confiança
- ❌ armazenar evidência sensível publicamente
- ❌ fazer big-bang rename de Company
- ❌ criar API v2 só por estética; usar quando contrato realmente mudar

---

# 36. Moat esperado

Se executado corretamente, o moat não será “temos reviews”. Será o grafo acumulado:

```text
Organizations
 + Professionals
 + Products
 + Credentials
 + Verified Reviews
 + Verified Projects
 + Search Intent
 + Service Areas
 + Content
 + Relationships
 + Lead Outcomes
 = Avalia Energy Trust Graph
```

Cada nova interação melhora discovery, trust, matching e intelligence.

---

# 37. Definition of A+++ Premium

A+++ não significa mais animações ou mais cards.

A plataforma será A+++ quando:

1. **É mais rápida para decidir.**
2. **Explica por que uma empresa merece confiança.**
3. **Funciona impecavelmente em mobile.**
4. **Nunca confunde publicidade com reputação.**
5. **Tem dados estruturados que concorrentes não possuem.**
6. **A mesma arquitetura atende BR e US sem duplicação.**
7. **Busca, perfil, compare e lead formam uma jornada única.**
8. **Feed, creators e groups criam retenção/network effects.**
9. **Trust Score é verificável e explicável.**
10. **SEO/AEO transformam o grafo em distribuição orgânica.**
11. **Analytics permitem provar cada etapa do funil.**
12. **Segurança, privacidade, acessibilidade e performance são gates de produto.**

---

# 38. Resultado final

```text
                    AVALIA
              Find. Compare. Trust.

 Consumer ──────┐
 Company ───────┤
 Professional ──┼──► ENERGY TRUST GRAPH
 Manufacturer ──┤             │
 Product ───────┤             ▼
 Review ────────┘      Better decisions
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           Brazil            USA            Next
```

O Avalia Solar brasileiro passa a ser o **primeiro market implementation** de uma infraestrutura global de confiança para energia — e não um produto que precisa ser refeito para cada país.

---

## Final engineering principle

> **Globalize the primitives, localize the rules, verify the trust, measure the journey.**

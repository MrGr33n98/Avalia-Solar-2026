# Tasks — /companies Performance A+++

- [ ] **Fase 0: Preflight & Baseline**
  - [x] Preflight Git (clean workspace, branch `feat/companies-performance-a-plus` criada a partir de `5d2488afb`).
  - [x] Coleta empírica de baseline de produção (`COMPANIES_RSC`: 2.81s, `API_COMPANIES`: 1.65s / 116.5 KB).
  - [x] Criação da spec estruturada (`specs/004-companies-performance-a-plus/`).

- [x] **Fase 1: Transição Imediata & Shell (P0-001, P0-002)**
  - [x] P0-001: Remover full-screen mount gate em `CompaniesPageClient.tsx`.
  - [x] P0-002: Criar `AB0-1-front/app/companies/loading.tsx` com layout fiel e zero CLS.
  - [x] Habilitar prefetching nos links primários em `Navbar.tsx` e `MobileBottomNav.tsx`.

- [x] **Fase 2: Arquitetura SSR/Hydration (P0-003, P0-004)**
  - [x] P0-003: Separar shell estático em `app/companies/page.tsx`.
  - [x] P0-004: Eliminar waterfall de hydration e unificar fluxo de carregamento via TanStack Query 5 (`keepPreviousData`).

- [x] **Fase 3: Backend Fast-Path & Query Budget (P0-005 a P0-009)**
  - [x] P0-005: Criar fast path especializado para `fields=card` reduzindo DTO de 116 KB para ~25 KB.
  - [x] P0-006: Eliminar N+1 no serializer de cards (`CompanyCardSerializer` com projeção direta de reputação em memória).
  - [x] P0-007: Condicionar `apply_includes` em `CompanySearchQuery` por `fields` (não carregar FAQs e anexos em `card`/`map`).
  - [x] P0-008: Projeção de feature access leve no card (`custom_ctas`).
  - [x] P0-009: Otimizar subqueries de categorias no SQL (subquery direta sem roundtrip Ruby).

- [x] **Fase 4: Otimização de Cliente & Rede (P1-001 a P1-006)**
  - [x] P1-001: TanStack Query 5 para listagem de empresas com `placeholderData: keepPreviousData`.
  - [x] P1-002: AbortSignal em requisições obsoletas (busca, filtro, paginação).
  - [x] P1-003: Lazy load do `SearchMapPanel` (zero custo Leaflet no grid inicial).
  - [x] P1-004: Lazy load do `MobileCompanyFiltersSheet` (zero custo quando fechado).
  - [x] P1-005: Eliminar requisição `/api/v1/companies/states` usando `BRAZIL_STATES_OPTIONS`.
  - [x] P1-006: Unificar e cachear categorias (`useCategoriesTree` e `useCategories` com cache in-memory e dedupe).

- [x] **Fase 5: Banners, Cache & Segurança (P1-007 a P1-009)**
  - [x] P1-007: Defer de banners fora da primeira viewport.
  - [x] P1-008: Ajustar cabeçalhos de cache no middleware para rotas públicas seguras e router cache.
  - [x] P1-009: Cache HTTP e ETag consistentes no Rails (`expires_in` em cache hits e misses).

- [x] **Fase 6: Micro-Otimizações & Resiliência (P2-001 a P2-006)**
  - [x] P2-001: Endpoint count leve `/api/v1/companies/count` integrado ao `getTotalCount`.
  - [x] P2-002: Tracking de impressões baseado em visibilidade real (IntersectionObserver >=50% por >=200ms).
  - [x] P2-003: Ajuste de dimensões e `sizes` nas imagens dos cards (48px/64px).
  - [x] P2-004: Prefetch de próxima página em background quando idle e ao passar o mouse.
  - [ ] P2-005: Code splitting de modais no CompanyCard.

- [ ] **Fase 7: Validação, Testes & Métricas Finais**
  - [ ] Testes unitários/integração frontend (`jest`).
  - [ ] Typecheck e Lint frontend.
  - [ ] Testes backend (`rspec`).
  - [ ] Medição de métricas AFTER e comparação detalhada.
  - [ ] Rollback plan documentado.
  - [ ] Validação de CI e Deploy.

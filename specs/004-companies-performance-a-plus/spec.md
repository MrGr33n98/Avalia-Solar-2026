# Master Spec — /companies Performance A+++

- **Target Route:** `https://www.avaliasolar.com.br/companies`
- **Frontend Target:** `AB0-1-front/app/companies/`
- **Backend Target:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`, `AB0-1-back/app/queries/companies/company_search_query.rb`
- **Branch:** `feat/companies-performance-a-plus`
- **Base SHA:** `5d2488afbaf7ab82a072266b2018a73a110e4d3e`

---

## 1. Contexto & Diagnóstico Forense

Em produção (`www.avaliasolar.com.br`), o clique em "Empresas" na Navbar apresentava latência extrema:
- **RSC Payload (`_rsc`):** 2.65s TTFB / 2.81s Total (bloqueando a transição do cliente por ausência de `loading.tsx`).
- **REST API (`/api/v1/companies`):** 1.29s TTFB / 1.65s Total (116.5 KB para apenas 12 cards).
- **Waterfall Total:** 4.45 segundos até renderização dos primeiros cards.
- **Requisições Iniciais Redundantes:**
  - `GET /api/v1/categories?status=active` (86.4 KB) disparado pelo `MobileCompanyFiltersSheet` mesmo fechado.
  - `GET /api/v1/companies/states` (147 B) disparado mesmo existindo `BRAZIL_STATES_OPTIONS` no frontend.
  - `GET /api/v1/categories/tree` (9.8 KB) competindo em paralelo.

---

## 2. Metas de Performance (Targets)

| Métrica | Baseline Real (Antes) | Meta Target (Depois) |
|---|---|---|
| Click na Navbar → Feedback Visual (Shell/Skeleton) | 2.81s (travado) | < 50ms |
| RSC Shell Prerendered | 2.81s (SSR dinâmico sob demanda) | Instantâneo / Prefetched |
| REST API `fields=card` Payload | 116.5 KB | ≤ 30 KB |
| REST API `fields=card` Latência (p75) | 1.65s | ≤ 300ms cold / ≤ 100ms cache hit |
| Requests de Categorias no Mount | 2 requests concorrentes (96.2 KB) | 1 request compartilhado/cacheados |
| Request `/companies/states` no Mount | 1 request (147 B) | 0 (usar `BRAZIL_STATES_OPTIONS`) |
| Request de Filtros Mobile Fechado | 1 request ativo | 0 (lazy load do drawer) |
| CLS (Cumulative Layout Shift) | > 0.05 (layout pula ao carregar) | ~ 0 |

---

## 3. Arquitetura da Solução

### 3.1 Frontend
1. **`app/companies/loading.tsx`:** Esqueleto fiel ao layout da página (sidebar desktop + 12 cards + controls) com animação suave e sem CLS. Habilita o prefetching instantâneo no Next.js App Router.
2. **`components/Navbar.tsx` & `MobileBottomNav.tsx`:** `prefetch={true}` explícito nos links primários para pré-aquecer o shell no router cache.
3. **`app/companies/page.tsx`:** Isolar o consumo de `searchParams` no client/suspense, permitindo que a rota raiz gere o shell estático.
4. **Remover Full-Screen Mount Gate:** Eliminar o `if (!mounted) return <spinner>` de `CompaniesPageClient.tsx`.
5. **TanStack Query 5:** Adotar cache unificado com `queryKey: ['companies', normalizedParams]`, `staleTime: 60_000`, `placeholderData: keepPreviousData` e `AbortSignal` ativo para abortar queries obsoletas.
6. **Lazy Load de Componentes Pesados:**
   - `SearchMapPanel` carregado dinamicamente somente quando `viewMode === 'map'`.
   - `MobileCompanyFiltersSheet` carregado dinamicamente somente quando `isFiltersOpen === true`.
7. **Eliminação de Requests Redundantes:**
   - Usar `BRAZIL_STATES_OPTIONS` para estados locais em vez de chamar `/api/v1/companies/states`.
   - Unificar cache de categorias com `staleTime: 1.hour`.
8. **Banner Deferral:** Banners abaixo da dobra carregados via `IntersectionObserver`.

### 3.2 Backend (Rails 7 API)
1. **Fast-path `fields=card`:**
   - DTO enxuto `CompanyCardFastSerializer` ou projeção sem campos pesados.
   - Reduzir payload de 116.5 KB para ~25-30 KB.
2. **Query includes especializados:**
   - Em `CompanySearchQuery`, quando `fields=card`, NÃO carregar FAQs, botões, perfis de financiamento e anexos pesados de parceiros.
3. **Eliminar N+1:**
   - Preload estrito de categorias e badges necessários.
4. **Endpoint leve de contagem (`/api/v1/companies/count`):**
   - Retorna apenas `{ count: N }` sem instanciar serializers de empresas.
5. **Cache HTTP consistente:**
   - `Cache-Control` e `ETag` aplicados em hits e misses.

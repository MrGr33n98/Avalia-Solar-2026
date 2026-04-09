---
phase: quick
plan: 260409-byw
subsystem: frontend-filters
tags: [filters, url-persistence, debounce, ux]
key-files:
  created:
    - AB0-1-front/hooks/useDebounce.ts
  modified:
    - AB0-1-front/app/products/page.tsx
    - AB0-1-front/app/companies/CompaniesPageClient.tsx
    - AB0-1-front/app/categories/[slug]/CategoryPageClientV2.tsx
decisions:
  - useDebounce hook generico com generics TypeScript para reutilizacao em todos os contextos
  - Debounce de 300ms em /products (price range) e /categories (busca), 400ms em /companies (busca)
  - URL sync via router.replace com scroll:false para nao perturbar scroll position
  - Dependencias do useEffect de debounced-search em /companies e /categories intencionalmente omitidas para evitar loop infinito (padrao documentado com eslint-disable)
metrics:
  duration: ~12min
  completed: "2026-04-09"
  tasks: 2
  files: 4
---

# Quick Task 260409-byw: Melhorias de Filtros — URL Persistence + Debounce

## One-liner

Persistencia de filtros na URL em /products com debounce de price range e busca com debounce de 300-400ms em /companies e /categories.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | URL persistence em /products + hook useDebounce | db127a0 | hooks/useDebounce.ts, app/products/page.tsx |
| 2 | Debounce busca em /companies (400ms) e /categories (300ms) | de599aa | CompaniesPageClient.tsx, CategoryPageClientV2.tsx |

## What Was Built

### hooks/useDebounce.ts (novo)

Hook generico `useDebounce<T>(value, delay)` que retorna o valor debounced somente apos `delay` ms de inatividade. Usa `useState` + `useEffect` com cleanup do timer.

### /products URL Persistence

- `useSearchParams` + `useRouter` injetados em `ProductsPageContent`
- Estado inicial de `searchQuery` e `filters` lido dos searchParams da URL
- `debouncedPriceRange` (300ms) evita atualizacoes excessivas da URL ao arrastar o slider de preco
- `useEffect` sincroniza todos os filtros para URL via `router.replace` (sem scroll reset)

### /companies Debounce Auto-search

- `debouncedSearchInput` (400ms) adicionado apos o `searchInput` state
- `useEffect` monitora `debouncedSearchInput` e aciona `router.replace` automaticamente, sem precisar pressionar Enter
- Manteve o `handleSearch` do form para compatibilidade com submit manual

### /categories Debounce + URL Sync

- `debouncedSearchTerm` (300ms) substituiu `searchTerm` direto no `filteredCompanies` useMemo
- `useEffect` separado sincroniza o `debouncedSearchTerm` para URL via `syncToUrl`
- `onChange` do input simplificado para apenas `setSearchTerm(e.target.value)` (URL sync desacoplado)

## Deviations from Plan

None — plan executed exactly as written.

## TypeScript Verification

Passed — `npx tsc --noEmit` retornou sem erros nos arquivos modificados.

## Self-Check: PASSED

- AB0-1-front/hooks/useDebounce.ts: FOUND
- Commits db127a0 e de599aa: FOUND

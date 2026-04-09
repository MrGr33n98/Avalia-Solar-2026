# Project State — Avalia Solar

**Project:** Avalia Solar (AB0-1)
**Stack:** Next.js 14 (frontend) + Rails 7 (backend)
**Last activity:** 2026-04-09 - Completed quick tasks: testes produtos+debounce (#2 CI), mobile image optimization (#8)

## Current Status

Active development — multiple quick tasks completed improving filters, social login, and performance.

## Architecture Overview

- **Frontend:** `AB0-1-front/` — Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Backend:** `AB0-1-back/` — Rails 7 API, Devise + OmniAuth, JWT auth
- **Videos:** `videos/` — Remotion video generation

## Recently Completed

- Social login (Google, LinkedIn, Facebook) via Rails OmniAuth
- Filter diagnostics and 5 critical fixes (URL persistence, backend filtering, dynamic states)
- Performance improvements (bundle reduction, SSR fixes)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260409-byw | implementar melhorias de filtros - URL persistence produtos, debounce busca, debounce categorias | 2026-04-09 | 1478810 | [260409-byw](./quick/260409-byw-implementar-melhorias-de-filtros-url-per/) |
| 260409-czz | products backend filters, welcome email OAuth, analytics CompaniesPage | 2026-04-09 | 9475250 | inline |
| 260409-dfe | testes: useProducts(public)+useDebounce+RSpec products filtering (14 FE + 14 BE testes) | 2026-04-09 | d2d9bb5 | inline |
| 260409-ghi | perf mobile: migrar raw img→next/image em CompanyFinancing, RatingStars, VerifiedCompaniesMiniList | 2026-04-09 | acafe5f | inline |

## Implemented Priority Items

| Priority | Item | Status |
|----------|------|--------|
| 🔴 1 | Social login (Google, LinkedIn, Facebook) | ✅ Code done — user needs OAuth credentials + bundle install |
| 🔴 2 | Testes + CI | ✅ 14 FE tests (useProducts, useDebounce) + 14 BE tests (products filtering) |
| 🔴 3 | Filtros produtos no backend | ✅ ILIKE search, category, sort, pagination no backend |
| 🟡 4 | Emails transacionais | ✅ Welcome email OAuth via WelcomeEmailJob |
| 🟡 5 | Onboarding de empresas | ⏳ Large feature — needs scoping |
| 🟡 6 | Analytics validado | ✅ usePageTracking + filter_applied events |
| 🟢 7 | Dashboard com métricas reais | ⏳ Needs API investigation |
| 🟢 8 | Performance mobile | ✅ raw img→next/image, lazy loading em 3 componentes |

## Blockers/Concerns

- Facebook OAuth credentials still need to be created by user
- `bundle install` needed in AB0-1-back after omniauth-facebook gem addition

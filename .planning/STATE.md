# Project State — Avalia Solar

**Project:** Avalia Solar (AB0-1)
**Stack:** Next.js 14 (frontend) + Rails 7 (backend)
**Last activity:** 2026-04-09 - Completed quick task 260409-byw: implementar melhorias de filtros

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

## Blockers/Concerns

- Facebook OAuth credentials still need to be created by user
- `bundle install` needed in AB0-1-back after omniauth-facebook gem addition

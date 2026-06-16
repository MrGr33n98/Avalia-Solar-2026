---
phase: 02-autentica-o-e-seguran-a-p0
plan: 02
subsystem: auth
tags: [apollo, graphql, interceptor, jest]

requires:
  - phase: 01-funda-o-e-integra-o-da-home-p0
    provides: []
provides:
  - Interceptação global de erros 401 via ApolloLink
  - Testes unitários para o errorLink do Apollo Client
affects: [api, ui]

tech-stack:
  added: []
  patterns: [error_link]

key-files:
  created: []
  modified:
    - AB0-1-mobile/src/lib/apolloClient.ts
    - AB0-1-mobile/src/lib/__tests__/apolloClientAuth.test.ts

key-decisions:
  - "Refatorar errorLink para extrair authErrorHandler e testar diretamente a lógica de logout"

patterns-established:
  - "Testar handlers do ApolloLink isoladamente"

requirements-completed: [AUTH-01]

duration: 15min
completed: 2026-06-16
---

# Phase 02 Plan 02: Ajuste de Teste Summary

**Refatoração do interceptador de 401 do Apollo Client e ajuste nos testes de unidade**

## Performance

- **Duration:** 15m
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Refatorou a declaração do `errorLink` do Apollo para permitir teste unitário do handler de forma isolada.
- Corrigiu a suíte de testes `apolloClientAuth.test.ts` que estava falhando devido a mock inadequado de links observáveis.

## Task Commits

1. **Task 1: Ajuste GraphQL & REST 401 Interceptors** - `686ce3a` (test)

## Files Created/Modified
- `src/lib/apolloClient.ts` - Refatorado para exportar `authErrorHandler`
- `src/lib/__tests__/apolloClientAuth.test.ts` - Testes refatorados usando mock direto do handler

## Decisions Made
- Ao invés de tentar fazer mock da cadeia inteira de Observables do Apollo (que estava falhando silenciosamente), exportamos a callback do `onError` para testá-la como função pura, focando no comportamento de extração do status 401 e UNAUTHENTICATED.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Testes falhando com `TypeError: Cannot read property 'muted' of undefined` em testes não relacionados foram resolvidos na sessão anterior, restando `expect(mockLogout).toHaveBeenCalledTimes(1)` falhando porque a interceptação observável no Jest não estava repassando corretamente os erros ao `onError`. O plano de testar `authErrorHandler` como função normal resolveu a regressão de cobertura.

## Next Phase Readiness
- Pronto para o plano 02-03.

---
*Phase: 02-autentica-o-e-seguran-a-p0*
*Completed: 2026-06-16*

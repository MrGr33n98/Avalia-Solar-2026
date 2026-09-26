# Test matrix

| Layer | Required cases |
|---|---|
| Model/service | source/dedupe uniqueness, raw preservation, classification, event ordering, state dimensions, no reactivation |
| Request pixel/link | token valid/invalid/disabled, no-store, no enumeration, scanner/proxy/bot, duplicate, safe redirect, source canonical |
| SNS | signature/topic/timestamp, duplicate provider ID, delay/delivery/reject/bounce/complaint, cross-source open/click not double-counted |
| Inbound | adapter authentication, threading headers, matching ambiguity, tenant A/B, dedupe, reply/cadence stop |
| Timeline API | DTO, preview sanitize/truncate, actor, opportunity/account-only rules, no email Activity duplicates, tenant A/B, cursor/delta/order |
| ActionCable | unauthenticated/unauthorized rejected, tenant stream isolation, after-commit ordering, reconnect and recovery |
| Frontend Jest | typed rich card, semantics, actor/preview, filters, expansion, loading/empty/error, no duplicate, live/fallback/visibility |
| E2E staging | mailbox synthetic: send→SNS delivery→pixel→click→reply→cadence stop→socket drop→cursor recovery; no refresh or duplication |

All automated provider tests use fakes. Never execute tests against production DB or real email provider. E2E real requires staging authorization and mailbox explicitly allowed.

## Evidência local desta implementação (2026-09-26)

- PASS: TypeScript `npm run typecheck`.
- PASS: Jest focado `UnifiedTimeline.spec.tsx` — 2 testes.
- PASS: ESLint em `UnifiedTimeline.tsx`, `EmailTimelineCard.tsx`, `timeline-types.ts` e teste do componente.
- PASS: RuboCop focal em 12 arquivos de domínio, tracking, timeline, migration e specs.
- PASS: `ruby -c` nos arquivos centrais do backend e migration.
- NOT RUN: RSpec, migration up/down, Playwright/E2E; não havia banco de teste isolado/container test disponível no ambiente. Não usar containers/bancos ativos de desenvolvimento como substituto.
- BLOCKED: staging E2E SES/SNS/mailbox, `/cable` real e smoke na VPS.

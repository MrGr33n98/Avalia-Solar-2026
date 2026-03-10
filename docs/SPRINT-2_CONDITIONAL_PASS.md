# Sprint 2 Conditional Pass — EPIC-MOBILE-001

**Date:** 2026-03-10  
**Status:** 🟡 Conditional Pass — Pending Final Validations  
**Epic:** [EPIC-MOBILE-001](./EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md)  
**Stories in Scope:** M-004 + M-005

---

## Executive Summary

A Sprint 2 está **feature-complete** e possui evidência automatizada registrada nas stories, mas **ainda não está formalmente encerrada**. O fechamento depende de validação manual em devices reais e da medição de `Lighthouse Offline >= 6/10` para M-004.

Também é necessário distinguir:

- **Feature sign-off:** pode seguir como `Conditional Pass`
- **Epic closure:** depende das validações finais
- **Merge readiness:** continua bloqueado pelos gates globais do repositório

---

## Factual Correction

O review operacional da Sprint 2 deve registrar que a implementação usa **service worker customizado**, e não Workbox:

- implementação: `AB0-1-front/public/sw.js`
- decisão técnica oficial: `docs/EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md`

---

## Recorded Evidence

### M-004 — Service Worker Foundation

Evidência registrada na story:

- `npx playwright test tests/mobile-offline-foundation.spec.ts --project=chromium-mobile`
- precache resiliente implementado
- fallback offline validado por E2E

Fonte: `docs/stories/M-004_service_worker_foundation.md`

### M-005 — Offline Cache Strategy

Evidência registrada na story:

- `npx jest __tests__/lib/offline-config.test.ts __tests__/lib/offline-queue.test.ts --runInBand`
- 29 testes documentados
- lifecycle E2E da Sprint 2 fechado após endurecimento do SW

Fonte: `docs/stories/M-005_offline_cache_strategy.md`

---

## Pending P0 Gates

### 1. Real-device QA — M-004

Ainda pendente:

- registro do SW em iOS Safari e Android Chrome
- navegação offline
- cache hit perceptível
- fallback `/offline` em device real

Fonte: `docs/stories/M-004_service_worker_foundation.md`

### 2. Lighthouse Offline — M-004

Ainda pendente:

- medição `Lighthouse Offline >= 6/10`

Fonte: `docs/stories/M-004_service_worker_foundation.md`

### 3. Real-device QA — M-005

Ainda pendente:

- fila offline em device real
- sync on reconnect
- validação manual do conflito `last-write-wins`

Fonte: `docs/stories/M-005_offline_cache_strategy.md`

---

## Repo Blockers Outside Sprint 2 Scope

Os seguintes problemas seguem **fora do escopo direto da Sprint 2**, mas continuam relevantes para integração:

- `npm run typecheck` com erros preexistentes
- `npm run build` bloqueado por timeout em `/sitemap.xml`
- `npm test` completo sem fechamento consistente neste ambiente

Esses blockers já estão registrados nas validation notes das stories:

- `docs/stories/M-004_service_worker_foundation.md`
- `docs/stories/M-005_offline_cache_strategy.md`

---

## Gate Decision

### Sprint 2 Feature Status

**Decision:** 🟡 Conditional Pass

**Rationale:**

- implementação da foundation offline concluída
- evidência automatizada registrada nas stories
- riscos restantes concentrados em validação humana final

### Merge Status

**Decision:** 🚫 Not Merge-Ready

**Rationale:**

- as stories M-004 e M-005 ainda permanecem `In Review`
- os gates globais do repositório seguem vermelhos fora do escopo da sprint

---

## Exit Criteria to Move from Conditional Pass to Pass

- [ ] Executar QA manual em device real para M-004
- [ ] Executar QA manual em device real para M-005
- [ ] Medir `Lighthouse Offline >= 6/10` para M-004
- [ ] Atualizar M-004 e M-005 para `Done` no epic
- [ ] Anexar relatório final de device testing

---

## Sprint 3 Readiness

A Sprint 3 pode seguir em **planejamento e materialização das stories**, mas a Sprint 2 só deve ser marcada como encerrada depois que os itens acima forem fechados.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-10 | 1.0 | Conditional pass review created from Sprint 2 QA findings | Codex |

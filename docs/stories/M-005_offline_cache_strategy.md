# STORY M-005: Offline Cache Strategy

**ID:** M-005 | **Epic:** [EPIC-MOBILE-001](../EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md)
**Sprint:** 2 | **Points:** 8 | **Priority:** 🔴 Critical
**Created:** 2026-03-10
**Status:** 👀 In Review

**Predecessor:** M-004 (Service Worker Foundation)

---

## User Story

**Como** usuário mobile em rede intermitente,
**Quero** que ações compatíveis sejam enfileiradas e sincronizadas depois,
**Para que** eu não perca interações importantes quando a conexão cair.

---

## Context

**Problema Crítico:**
A camada de dados estava `online-only`, sem fila local, sem retry logic e sem resolução mínima de conflito para mutações reexecutáveis.

**Foundation Implemented:**
1. `AB0-1-front/lib/offline/db.ts` — IndexedDB schema via Dexie
2. `AB0-1-front/lib/offline/mutationQueue.ts` — queue, retry, flush e eventos
3. `AB0-1-front/lib/offline/offlineTransport.ts` — transport com fallback offline
4. `AB0-1-front/lib/offline/apiMutation.ts` — helper para mutações JSON queue-safe
5. `AB0-1-front/store/offlineStore.ts` — estado global de fila/sync

**Current Queue-Safe Mutations:**
- analytics backend tracking
- consent log/revoke
- CTA analytics
- analytics event tracking
- banner events

**Conflict Strategy MVP:**
- `last-write-wins` por `conflictKey`
- mutações anteriores com mesma intenção são substituídas antes do sync

**MFRI Impact:**
- +3 → +5

---

## Acceptance Criteria

### AC1: IndexedDB Schema
- [x] Banco local definido via Dexie
- [x] Store `mutationQueue` criada
- [x] Índices para `conflictKey`, `requestKey`, `nextRetryAt`
- [x] Tipos de mutação documentados

### AC2: Mutation Queue com Retry
- [x] Queue local implementada
- [x] Retry com backoff exponencial
- [x] Retry máximo configurado
- [x] 4xx não transitórios descartados

### AC3: Sync e Resolução de Conflito
- [x] Background Sync API acionada quando disponível
- [x] Fallback para `postMessage` quando Sync API não existe
- [x] `last-write-wins` por `conflictKey`
- [x] Queue/sync state refletido no cliente

### AC4: Testing
- [x] 15+ cenários unitários cobrindo config/queue/transport
- [x] Cenários offline críticos automatizados
- [x] Sem regressão intencional nos fluxos web online
- [ ] QA manual dos cenários offline em device real

---

## Scope

### In Scope
✅ IndexedDB local
✅ Retry/backoff
✅ Sync background
✅ Conflict resolution MVP
✅ Mutações compatíveis com replay
✅ Testes unitários e E2E

### Out of Scope
❌ Sync de formulários transacionais complexos
❌ Conflict resolution avançado com merge server-side
❌ Offline auth/session writes
❌ Full offline-first para dashboards autenticados

---

## Tasks

### Task 5.1: Queue Model
- [x] Definir schema da fila no Dexie
- [x] Modelar `QueuedMutationRecord`
- [x] Persistir headers/body/metadados essenciais

### Task 5.2: Retry & Flush
- [x] Implementar `flushOfflineMutationQueue`
- [x] Implementar retry para falhas transitórias
- [x] Descartar falhas não retryable
- [x] Expor eventos de queue/sync

### Task 5.3: Integrations
- [x] Integrar analytics backend
- [x] Integrar consent log/revoke
- [x] Integrar CTA/banner tracking
- [x] Integrar analytics API events

### Task 5.4: Store & Observability
- [x] Criar `offlineStore`
- [x] Refletir `queueSize`, `lastSyncAt`, `swRegistered`, `isOnline`
- [x] Consumir mensagens do SW no controller

### Task 5.5: Testing
- [x] Cobrir helpers de config
- [x] Cobrir dedupe, retry, discard e sync fallback
- [x] Cobrir transport offline/online/network failure
- [x] Garantir mais de 15 cenários unitários

---

## Dev Notes

### Queue Policy
- apenas mutações idempotentes/reexecutáveis entram na fila
- respostas síncronas obrigatórias continuam fora do escopo da Sprint 2

### Conflict Key Examples
- `analytics:event:<type>:<company>`
- `banner:<banner_id>:<event_type>`
- `consent:revoke:<reason>`

### Safety
- online-first para fluxos normais
- queue apenas em offline/network failure
- sem alteração de comportamento de navegação web quando online

---

## Definition of Done

- [x] IndexedDB schema criada
- [x] Background Sync acionado
- [x] Retry logic com backoff implementado
- [x] Conflict resolution MVP implementado
- [x] 15+ cenários automatizados
- [x] Stories e arquitetura documentadas

---

## File List
- [x] `AB0-1-front/lib/offline/config.ts`
- [x] `AB0-1-front/lib/offline/db.ts`
- [x] `AB0-1-front/lib/offline/mutationQueue.ts`
- [x] `AB0-1-front/lib/offline/offlineTransport.ts`
- [x] `AB0-1-front/lib/offline/apiMutation.ts`
- [x] `AB0-1-front/store/offlineStore.ts`
- [x] `AB0-1-front/lib/analytics/index.ts`
- [x] `AB0-1-front/lib/analytics/consent.ts`
- [x] `AB0-1-front/lib/analytics/track-cta.ts`
- [x] `AB0-1-front/lib/api-analytics.ts`
- [x] `AB0-1-front/__tests__/lib/offline-config.test.ts`
- [x] `AB0-1-front/__tests__/lib/offline-queue.test.ts`
- [x] `docs/stories/M-005_offline_cache_strategy.md`

---

## Validation
- [x] helpers/config cobertos
- [x] queue/retry/discard cobertos
- [x] transport offline/online coberto
- [ ] cenários manuais em device real

**Validation Notes (2026-03-10):**
- `npx jest __tests__/lib/offline-config.test.ts __tests__/lib/offline-queue.test.ts --runInBand` passou com 29 testes
- a validação E2E da Sprint 2 passou após o endurecimento do lifecycle do SW
- `npm run typecheck` segue vermelho por erros preexistentes fora desta story

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-10 | 1.0 | Story created | AIOS Orion |
| 2026-03-10 | 1.1 | Offline queue, retry logic, conflict strategy and automated tests implemented | Codex |
| 2026-03-10 | 1.2 | Validation notes updated after unit + mobile offline E2E pass | Codex |

---

**Generated by:** AIOS Orion Agent (@aios-master)
**Implementation Update:** Codex

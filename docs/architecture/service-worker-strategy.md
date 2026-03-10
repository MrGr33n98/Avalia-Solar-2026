# Service Worker & Offline Strategy

**Epic:** EPIC-MOBILE-001  
**Stories:** M-004, M-005  
**Status:** 👀 In Review  
**Last Updated:** 2026-03-10

---

## Objective

Entregar a fundação offline da iniciativa mobile sem quebrar a aplicação web existente:

- cache resiliente para rotas públicas
- fallback offline para navegação sem rede
- fila local para mutações compatíveis com replay
- sincronização automática quando a conectividade retorna

---

## Runtime Model

### Feature Flag

- `NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE=false` por padrão
- habilitação explícita por ambiente
- Playwright ativa a flag para validar a Sprint 2

### Client Bootstrap

`AB0-1-front/components/PwaOfflineController.tsx`:

- registra `sw.js`
- observa `online/offline`
- sincroniza `offlineStore`
- escuta mensagens do Service Worker
- aciona flush local ao reconectar

---

## Cache Strategy

### 1. Navigation — Network First

Usado para requests `navigate`.

Objetivo:
- priorizar HTML fresco quando a rede existe
- cair para cache/fallback quando a rede falha

Fallback order:
1. rota normalizada já cacheada
2. request original em cache
3. `/offline`

### 2. Static Assets — Cache First

Cobertura:
- `/_next/static/*`
- `/images/*`
- assets versionados (`css`, `js`, `woff`, `png`, `svg`, `ico`, etc.)

Objetivo:
- reduzir latência
- manter shell estável offline

### 3. Public API GETs — Stale While Revalidate

Cobertura:
- `/api/v1/categories`
- `/api/v1/banners`
- `/api/v1/products`
- `/api/v1/companies`
- `/api/v1/states`
- `/api/v1/cities`

Objetivo:
- responder rápido com cache
- atualizar em background quando online

---

## Precache Scope

Rotas públicas principais:

- `/`
- `/categories`
- `/companies`
- `/compare`
- `/blog`
- `/offline`

Estratégia:
- precache resiliente por rota
- timeout curto no install para não bloquear a ativação do SW
- rotas suportadas tentam armazenar HTML real primeiro
- quando a rota não responde a tempo, o cache recebe o shell offline
- falha parcial não aborta a instalação inteira do SW

---

## Offline Mutation Queue

### Storage

`AB0-1-front/lib/offline/db.ts` define:

- database: `avalia-mobile-offline`
- store: `mutationQueue`

Campos principais:

- `url`
- `method`
- `headers`
- `body`
- `conflictKey`
- `requestKey`
- `retryCount`
- `nextRetryAt`
- `lastError`
- `metadata`

### Conflict Resolution

MVP: `last-write-wins`

Regra:
- ao enfileirar uma nova mutação com o mesmo `conflictKey`
- remove a mutação anterior
- mantém apenas a versão mais recente da intenção

### Retry Policy

- backoff exponencial a partir de `1500ms`
- limite máximo de `30000ms`
- máximo de `5` tentativas
- 4xx não transitórios são descartados

### Sync Trigger

Ordem de preferência:
1. `Background Sync API`
2. `postMessage` para o SW
3. flush local ao evento `online`

---

## Queue-Safe Mutations in Sprint 2

Cobertas nesta entrega:

- analytics backend tracking
- consent log
- consent revoke
- CTA backend tracking
- analytics event tracking
- banner events

Fora de escopo nesta sprint:

- formulários transacionais com resposta síncrona obrigatória
- auth/session writes
- dashboards autenticados complexos

---

## Testing Strategy

### Unit

`AB0-1-front/__tests__/lib/offline-config.test.ts`
- normalização de rotas
- feature flag
- policy helpers

`AB0-1-front/__tests__/lib/offline-queue.test.ts`
- dedupe
- queue change events
- sync registration fallback
- flush success/retry/discard
- transport offline/online/network failure

### E2E

`AB0-1-front/tests/mobile-offline-foundation.spec.ts`
- registra SW
- valida precache das 5 rotas
- valida fallback offline para rota não cacheada

### Validation Snapshot

- `npx jest __tests__/lib/offline-config.test.ts __tests__/lib/offline-queue.test.ts --runInBand` ✅
- `npx playwright test tests/mobile-offline-foundation.spec.ts --project=chromium-mobile` ✅
- `npm run lint` ✅ com warnings preexistentes
- `npm run typecheck` ❌ com erros preexistentes fora do escopo da Sprint 2
- `npm test` ⚠️ suite completa excedeu timeout neste ambiente
- `npm run build` ❌ bloqueado por timeout preexistente em `/sitemap.xml`

---

## Operational Notes

- a fundação offline é opt-in por env
- não altera a navegação web online quando a feature está desligada
- foi desenhada para permitir evolução posterior para PWA install flow e telemetry mais rica

---

## File Map

- `AB0-1-front/public/sw.js`
- `AB0-1-front/components/PwaOfflineController.tsx`
- `AB0-1-front/app/offline/page.tsx`
- `AB0-1-front/lib/offline/config.ts`
- `AB0-1-front/lib/offline/db.ts`
- `AB0-1-front/lib/offline/mutationQueue.ts`
- `AB0-1-front/lib/offline/offlineTransport.ts`
- `AB0-1-front/lib/offline/apiMutation.ts`
- `AB0-1-front/store/offlineStore.ts`

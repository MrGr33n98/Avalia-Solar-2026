# TASK BOARD: Dashboard API Errors Resolution

**Story:** `STORY-DASHBOARD-API-ERRORS`  
**Sprint:** `Emergency Hotfix`  
**Updated:** `2026-03-12`

## Current State

O board original partia de uma investigacao aberta. Isso ja nao corresponde ao estado real do trabalho.

Estado correto agora:

- `TASK-001` RCA concluida
- hotfix de `overview` e `timeseries` implementado localmente
- `top_campaigns` decidido como feature necessaria e implementado localmente
- `/stats` reescopado para validacao em staging, nao para rewrite preventivo

## Critical Path

### Phase 1: RCA

| ID | Task | Status | Notes |
|---|---|---|---|
| `TASK-001` | Investigar causa raiz | `DONE` | logs confirmaram namespace bug + rota ausente |

### Phase 2: Backend Hotfix

| ID | Task | Status | Blocker | Notes |
|---|---|---|---|---|
| `TASK-003` | Fix `/analytics/overview` | `IMPLEMENTED_LOCAL` | none | depende de deploy/validacao |
| `TASK-004` | Fix `/analytics/timeseries` | `IMPLEMENTED_LOCAL` | none | depende de deploy/validacao |
| `TASK-005` | Resolver `/top_campaigns` | `IMPLEMENTED_LOCAL` | none | decisao tomada: manter feature |
| `TASK-002` | Validar/endurecer `/stats` | `READY` | staging evidence | so atuar se reproduzir apos deploy |

### Phase 3: Validation

| ID | Task | Status | Blocker | Notes |
|---|---|---|---|---|
| `TASK-006` | Validar fixes em staging | `BLOCKED` | deploy backend | precisa sessao autenticada real |

## P0

| ID | Task | Owner | Est | Status |
|---|---|---|---|---|
| `TASK-001` | Investigar causa raiz dos erros 500 | Backend Lead | 2h | `DONE` |
| `TASK-003` | Fix endpoint `/analytics/overview` | Backend Dev 2 | 3h | `IMPLEMENTED_LOCAL` |
| `TASK-004` | Fix endpoint `/analytics/timeseries` | Backend Dev 3 | 4h | `IMPLEMENTED_LOCAL` |
| `TASK-005` | Resolver `/top_campaigns` | Backend + Frontend | 30min | `IMPLEMENTED_LOCAL` |
| `TASK-006` | Validar fixes em staging | QA Engineer | 1h | `BLOCKED` |

## P0 Conditional

| ID | Task | Owner | Est | Status |
|---|---|---|---|---|
| `TASK-002` | Validar e endurecer `/stats` se ainda falhar | Backend Dev 1 | 1h-3h | `READY` |

## P1

| ID | Task | Owner | Est | Status |
|---|---|---|---|---|
| `TASK-007` | Criar testes unitarios backend | Backend Dev 1 | 2h | `TODO` |
| `TASK-008` | Criar testes de integracao | Backend Dev 2 | 2h | `TODO` |
| `TASK-009` | Criar teste E2E Playwright autenticado | QA Engineer | 3h | `TODO` |
| `TASK-010` | Otimizar queries SQL se houver gargalo real | Backend Dev 3 | 2h | `TODO` |
| `TASK-011` | Configurar monitoring/alerting | DevOps | 2h | `TODO` |

## P2

| ID | Task | Owner | Est | Status |
|---|---|---|---|---|
| `TASK-012` | Melhorar UX error states | Frontend Dev | 2h | `TODO` |
| `TASK-013` | Adicionar autocomplete attributes | Frontend Dev | 30min | `TODO` |
| `TASK-014` | Implementar APM tracing | DevOps | 3h | `TODO` |
| `TASK-015` | Criar dashboard de metricas | DevOps | 2h | `TODO` |
| `TASK-016` | Escrever postmortem | Tech Lead | 1h | `TODO` |

## Immediate Next Steps

1. Deployar backend com o hotfix atual.
2. Validar em staging:
   - `/api/v1/company_dashboard/analytics/overview`
   - `/api/v1/company_dashboard/analytics/timeseries`
   - `/api/v1/company_dashboard/analytics/top_campaigns`
   - `/api/v1/company_dashboard/stats`
3. Se `/stats` continuar falhando, abrir patch minimo orientado por stack trace.
4. Fechar regressao com request specs e E2E autenticado.

## Operational Notes

- O frontend realmente usa `top_campaigns`, entao a decisao correta foi implementar a rota, nao remover a feature.
- O replay recente de Playwright sem sessao autenticada nao substitui a validacao de staging.
- A execucao local de RSpec continua bloqueada por boot do Rails em `activeadmin`; staging vira gate obrigatorio.

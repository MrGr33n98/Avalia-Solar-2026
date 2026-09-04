# CRM Companies Workspace — Performance Baseline & SLOs

**Data:** 2026-09-04  
**Repositório:** `MrGr33n98/Avalia-Solar-2026`  

---

## 1. Definitive SLO Targets

| Métrica | Meta Cold (sem cache) | Meta Warm (com cache) | Target Max Queries |
| --- | --- | --- | --- |
| `GET /api/v1/sales/accounts` (50 rows) | p95 <= 350ms | p95 <= 100ms | <= 8 queries (alvo 5) |
| `GET /api/v1/sales/accounts` (com filtros) | p95 <= 450ms | p95 <= 120ms | <= 8 queries |
| `GET /api/v1/sales/accounts/filter_options` | p95 <= 150ms | p95 <= 30ms | <= 4 queries |
| `GET /api/v1/sales/saved_views` | p95 <= 150ms | p95 <= 30ms | <= 3 queries |
| Duplicate Scan (assíncrono) | -- | Non-blocking (< 1s sync enqueue) | -- |
| Search Input Debounce (Frontend) | -- | 250–300ms | -- |

---

## 2. Gargalos Identificados no Baseline

1. **N+1 no `AccountsController#index`**:
   - `accounts.map` executa `account.contacts.find_by(is_primary: true)` por linha.
   - `account.last_contact_at` executa `activities.maximum(:occurred_at)` por linha.
   - `account.tags` consulta sem preload explícito.
   - Em 50 linhas, gera de 100 a 150 SQL queries por requisição.

2. **Falta de Índices Compostos**:
   - Falta índice composto `(company_id, created_at DESC)` em `sales_accounts`.
   - Falta índice composto `(sales_account_id, is_primary)` em `sales_contacts`.
   - Falta índice em `sales_saved_views(company_id, resource_type)`.

---

## 3. Plano de Remediação de Query Optimization

1. **Query Object (`Sales::AccountsQuery`)**:
   - Mudar de ActiveRecord loops para projeção SQL / subqueries em `SELECT`.
2. **Aggregates em Batch**:
   - Subquery/join lateral para `primary_contact`, `last_contact_at` e `open_opportunities_count`.
3. **Preload Seletivo**:
   - `includes(:tags, :owner)` apenas nas associações necessárias.
4. **Cache Redis (Camada 2)**:
   - Utilizar chave tenant-safe `crm:v2:tenant:{tenant_id}:accounts:v{data_version}:{query_hash}`.

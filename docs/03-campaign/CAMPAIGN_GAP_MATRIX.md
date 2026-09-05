# Campaign Workstation — Gap Matrix & Remediations

> **Data:** Setembro 2026  
> **Status:** AUDITADO & CERTIFICADO  
> **Diretório:** `docs/03-campaign/`

---

## Matriz de Gaps Identificados & Soluções Implementadas

| ID | Severidade | Evidência / Sintoma | Causa Raiz | Arquivos Afetados | Solução Implementada | Teste de Regressão | Before / After | DoD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **GAP-01** | **P0** | `ArgumentError (given 3, expected 0)` ao acessar endpoints do `CampaignsController` | Método `def dispatch` no controller sobrescrevia `ActionController::Metal#dispatch(name, request, response)` do Rails. | `campaigns_controller.rb`, `routes.rb` | Renomeado o método da ação para `def launch` e mapeadas as rotas `post :dispatch, action: :launch` e `post :launch, action: :launch`. | Spec de método `instance_method(:dispatch).owner` | **Before:** HTTP 500<br>**After:** HTTP 200 | PASS |
| **GAP-02** | **P0** | Invocação de `rspec` falhava em containers de produção (`bundler: command not found: rspec`) | Gem de teste excluída na imagem de produção via `BUNDLE_WITHOUT="development:test"`. | `docker-compose.test.yml`, `Dockerfile.backend.test` | Execução de testes apontada para o container de testes dedicado `docker-compose.test.yml`. | Execução de RSpec via `docker-compose.test.yml` | **Before:** RSpec inexecutável na prod image<br>**After:** 100% RSpec PASS | PASS |
| **GAP-03** | **P0** | Risco de vazamento de dados entre empresas | Consultas mutáveis precisam garantir scoping por `company_id`. | `campaigns_controller.rb` | Todas as buscas utilizam `scoped_campaigns.find(params[:id])`, retornando 404 para outras empresas. | Request specs de isolamento de tenant | **Before:** Risco IDOR<br>**After:** Zero cross-tenant leakage | PASS |
| **GAP-04** | **P1** | N+1 queries ao listar campanhas na rota `GET /api/v1/sales/campaigns` | Serialização acessava `c.email_template&.name` sem eager loading no ActiveRecord. | `campaigns_controller.rb` | Adicionado `.includes(:email_template)` ao escopo da consulta `index`. | Query count test | **Before:** N+1 queries<br>**After:** Bounded SQL queries | PASS |
| **GAP-05** | **P1** | Lock no Redis podia ser liberado incorretamente em concorrência | `release_lock` fazia `get` e `del` não-atômicos. | `dispatcher.rb` | Implementado script Lua atômico (compare-and-delete) no Redis. | Concurrency spec | **Before:** Race condition em release<br>**After:** Compare-and-delete atômico | PASS |
| **GAP-06** | **P1** | Ausência de índices compostos para ordenação e filtro por status na tabela `sales_campaigns` | Queries realizavam Sequential Scan ao ordenar por `created_at DESC` e filtrar por `status`. | `20260905000005_add_indexes_to_sales_campaigns.rb` | Criados índices `(company_id, created_at DESC)` e `(company_id, status)`. | EXPLAIN query validation | **Before:** Seq Scan<br>**After:** Index Scan | PASS |

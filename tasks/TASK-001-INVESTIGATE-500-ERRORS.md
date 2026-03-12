---
id: TASK-001-INVESTIGATE-500-ERRORS
story: STORY-DASHBOARD-API-ERRORS
title: Investigar causa raiz dos erros do dashboard analytics
priority: P0
severity: CRITICAL
assignee: Backend Lead
estimate: 2h
status: DONE
created: 2026-03-12
updated: 2026-03-12
---

# Task Result: RCA Concluida

## Objective

Identificar a causa raiz real dos erros de dashboard analytics para `company_id=372` com evidencia de logs e alinhamento com o codigo atual.

## Confirmed Findings

### 1. `/api/v1/company_dashboard/analytics/overview` -> `500`

**Causa raiz**

Resolucao incorreta de constante no controller:

- o codigo usava `CompanyDashboard::FreshnessProvider`
- dentro do namespace `Api::V1`, Ruby tentou resolver `Api::V1::CompanyDashboard::FreshnessProvider`
- o provider real existe em `::CompanyDashboard::FreshnessProvider`

**Evidencia**

Os logs de producao mostraram:

- `NameError (uninitialized constant Api::V1::CompanyDashboard::FreshnessProvider)`
- falha dentro de `analytics_overview`
- falha tambem no fallback `default_overview_payload`

### 2. `/api/v1/company_dashboard/analytics/timeseries` -> `500`

**Causa raiz**

A mesma falha de namespace do `FreshnessProvider` derrubava a resposta do endpoint de series temporais.

**Evidencia**

Os logs de producao mostraram:

- `NameError (uninitialized constant Api::V1::CompanyDashboard::FreshnessProvider)`
- stack trace apontando para `analytics_timeseries`

### 3. `/api/v1/company_dashboard/analytics/top_campaigns` -> `404`

**Causa raiz**

A rota nao existia no backend.

**Evidencia**

Os logs de producao mostraram:

- `ActionController::RoutingError (No route matches [GET] "/api/v1/company_dashboard/analytics/top_campaigns")`

### 4. `/api/v1/company_dashboard/stats`

**Status**

Nao foi confirmado como causa raiz atual nesta RCA.

Motivo:

- [stats_service.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/services/company_dashboard/stats_service.rb) ja possui fallback defensivo
- [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb) ja faz rescue com retorno seguro
- specs existentes para `/stats` esperam `200 OK`

Conclusao: validar em staging apos deploy do hotfix principal; nao assumir rewrite do endpoint sem stack trace atual.

## Code Impact

Os arquivos impactados pelo hotfix principal sao:

- [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb)
- [routes.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/routes.rb)

## Recommended Next Actions

1. Deployar o hotfix atual em staging.
2. Validar `overview`, `timeseries` e `top_campaigns` com usuario autenticado.
3. Testar `/stats` no mesmo fluxo.
4. So abrir patch adicional de `/stats` se a falha persistir com stack trace novo.

## Validation Limits

- `ruby -c` passou nos arquivos Ruby alterados.
- `bundle exec ruby bin/rspec ...` continua bloqueado por problema preexistente de boot do Rails em `activeadmin`:
  - `uninitialized constant ActiveAdmin::Views::TabbedNavigation`

## Output

RCA concluida e transformada em acao:

- hotfix backend principal ja implementado localmente
- board reescopado
- `/stats` mantido como validacao condicional

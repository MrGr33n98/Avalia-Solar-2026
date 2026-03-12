---
id: TASK-002-FIX-STATS-ENDPOINT
story: STORY-DASHBOARD-API-ERRORS
title: Validar e endurecer endpoint /api/v1/company_dashboard/stats
priority: P0
severity: HIGH
assignee: Backend Dev 1
estimate: 1h-3h
status: READY
created: 2026-03-12
updated: 2026-03-12
---

# Task: Validate and Harden `/company_dashboard/stats`

## Objective

Confirmar se `/api/v1/company_dashboard/stats` realmente continua falhando apos o deploy do hotfix principal de analytics e, somente se reproduzir, aplicar um patch minimo orientado por evidencia.

## Why This Task Was Rescoped

Na RCA atual, `/stats` nao apareceu como falha confirmada do backend local.

Hoje o codigo ja tem:

- fallback seguro em [stats_service.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/services/company_dashboard/stats_service.rb)
- rescue para retorno `200 OK` no controller em [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb)
- request specs existentes esperando `200 OK`

Portanto esta task deixa de ser "reescrever /stats" e vira "validar e endurecer se necessario".

## Acceptance Criteria

- [ ] Validar `/api/v1/company_dashboard/stats?company_id=372` em staging apos deploy do hotfix
- [ ] Confirmar status code e payload esperado
- [ ] Se reproduzir erro, capturar stack trace e payload
- [ ] Aplicar correcao minima para o bug real
- [ ] Adicionar regressao automatizada para o caso reproduzido
- [ ] Se nao reproduzir erro, fechar a task como `not reproduced after hotfix`

## Current Expectations

Resposta esperada do endpoint:

- `200 OK`
- objeto `stats`
- `plan_features`
- payload seguro mesmo em cenarios sem dados

Campos relevantes esperados em `stats`:

- `profile_views`
- `cta_clicks`
- `whatsapp_clicks`
- `leads_received`
- `reviews_count`
- `average_rating`
- `conversion_rate`
- `data_source`
- `last_aggregated_at`
- `data_freshness_seconds`

## Validation Steps

### Step 1: Staging Check

Executar o fluxo autenticado e verificar:

1. request para `/api/v1/company_dashboard/stats`
2. status HTTP
3. payload retornado
4. logs estruturados do backend

### Step 2: Decision Gate

#### If `/stats` returns `200`

- encerrar task sem patch adicional
- registrar que a falha nao reproduziu apos o hotfix principal

#### If `/stats` still fails

- capturar stack trace
- localizar dependencia real quebrando
- aplicar fix minimo
- adicionar spec regressiva

## Minimal Patch Strategy If It Still Fails

Nao abrir refactor amplo. Seguir esta ordem:

1. identificar o ponto exato da excecao
2. corrigir somente a dependencia ofensora
3. preservar o contrato atual do endpoint
4. adicionar teste request ou service especifico para a regressao

## Likely Investigation Anchors

Se a falha reaparecer, inspecionar primeiro:

- `CompanyDashboard::StatsService`
- `CompanyDashboard::FreshnessProvider`
- dependencias indiretas acessadas por `safe_count`
- dados de membership/company selection em `set_company`

## Verification

Validacao minima:

- staging com usuario autenticado
- `200 OK` para `company_id=372`
- sem excecao em logs
- dashboard exibindo cards principais

## Notes

- Esta task depende mais de evidencia de staging do que de desenvolvimento especulativo.
- O hotfix principal confirmado continua sendo `overview/timeseries/top_campaigns`; `/stats` e uma trilha residual de validacao.

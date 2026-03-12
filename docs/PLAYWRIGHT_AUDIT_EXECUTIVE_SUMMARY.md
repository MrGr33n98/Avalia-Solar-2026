# EXECUTIVE SUMMARY: Dashboard Analytics Incident

**Date:** `2026-03-12`  
**Environment:** `production`  
**Scope:** dashboard analytics for `company_id=372`

## Executive Readout

O incidente do dashboard nao ficou mais em nivel de hipotese. A RCA principal esta confirmada e o hotfix central ja foi implementado localmente no backend.

Os problemas confirmados foram:

- `500` em `/api/v1/company_dashboard/analytics/overview`
- `500` em `/api/v1/company_dashboard/analytics/timeseries`
- `404` em `/api/v1/company_dashboard/analytics/top_campaigns`

O endpoint `/api/v1/company_dashboard/stats` **ainda precisa de validacao em staging**, mas nao apareceu como causa raiz confirmada no backend atual.

## Confirmed Root Causes

| Endpoint | Symptom | Root cause | Current status |
|---|---|---|---|
| `/analytics/overview` | `500` | resolucao errada de `FreshnessProvider` no namespace do controller | hotfix local implementado |
| `/analytics/timeseries` | `500` | mesma falha de namespace do overview | hotfix local implementado |
| `/analytics/top_campaigns` | `404` | rota inexistente no backend | endpoint e rota implementados localmente |
| `/stats` | relatado na auditoria inicial | nao confirmado na investigacao atual | validar em staging |

## What Changed

No backend:

- referencias do controller foram corrigidas para `::CompanyDashboard::...`
- foi adicionado `analytics_top_campaigns`
- a rota `/api/v1/company_dashboard/analytics/top_campaigns` foi criada
- foi adicionada spec de request para a rota nova

Arquivos:

- [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb)
- [routes.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/routes.rb)
- [company_dashboard_top_campaigns_spec.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/spec/requests/api/v1/company_dashboard_top_campaigns_spec.rb)

## What Is Still Pending

1. Deployar o hotfix em staging.
2. Validar fluxo autenticado real da aba analytics.
3. Confirmar se `/stats` continua falhando apos o deploy.
4. Executar cobertura adicional de regressao quando o boot local do Rails for destravado.

## Validation Status

### Completed
- analise de logs de backend com stack traces
- confirmacao do `NameError` em `FreshnessProvider`
- confirmacao do `404` de `top_campaigns`
- `ruby -c` nos arquivos Ruby alterados

### Blocked
- `bundle exec ruby bin/rspec ...`

**Blocker atual**

Boot local do Rails quebrado por problema preexistente em `activeadmin`:

- `uninitialized constant ActiveAdmin::Views::TabbedNavigation`

## Playwright Note

Uma nova tentativa de captura com `playwright-cli` nao reproduziu os `500` porque a storage session usada pelo preset `avalia-solar` nao estava autenticada. O browser foi redirecionado para `/login`, entao a evidencia coletada nessa rodada serve apenas para provar a falta de sessao autenticada, nao para invalidar a RCA do backend.

## Recommendation

O caminho certo agora e operacional, nao investigativo:

1. deployar o backend corrigido em staging
2. validar `overview`, `timeseries` e `top_campaigns`
3. testar `/stats` no mesmo fluxo
4. so abrir nova frente de fix em `/stats` se a falha ainda existir

## Business Impact

Antes do deploy, o impacto continua alto porque a aba de analytics segue quebrada em producao para o caso reportado.

Depois do deploy esperado:

- overview e timeseries devem sair de `500`
- top_campaigns deve sair de `404`
- o risco residual fica concentrado em `/stats` e na cobertura de regressao

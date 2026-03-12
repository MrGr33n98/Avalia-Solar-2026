# HOTFIX STORY: Dashboard API Errors

## Metadata
- Story ID: `STORY-DASHBOARD-API-ERRORS`
- Priority: `P0`
- Owner: Backend Team
- Created: `2026-03-12`
- Status: `IN PROGRESS`

## Objective

Restaurar a aba de analytics do dashboard de empresas com base na RCA confirmada em producao para `company_id=372`, sem abrir frentes especulativas que o codigo atual nao sustenta.

## Confirmed Findings

### Confirmed 500s

Os erros `500` confirmados por logs de backend estao em:

1. `/api/v1/company_dashboard/analytics/overview`
2. `/api/v1/company_dashboard/analytics/timeseries`

**Causa raiz confirmada**

O controller resolvia `FreshnessProvider` no namespace errado, buscando `Api::V1::CompanyDashboard::FreshnessProvider` em vez de `::CompanyDashboard::FreshnessProvider`. Isso derrubava tanto o fluxo principal quanto o fallback do payload default.

### Confirmed 404

O erro `404` confirmado era:

1. `/api/v1/company_dashboard/analytics/top_campaigns`

**Causa raiz confirmada**

A rota nao existia no backend, embora o frontend consuma essa feature em [TopCampaignsCard.tsx](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/dashboard/components/TopCampaignsCard.tsx).

### `/stats` Status

O endpoint `/api/v1/company_dashboard/stats` apareceu no relato inicial da auditoria, mas **nao foi confirmado como causa raiz atual** nesta investigacao.

O backend local hoje ja tem:

- fallback defensivo em [stats_service.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/services/company_dashboard/stats_service.rb)
- rescue para retornar payload seguro em [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb)
- specs existentes esperando `200 OK` para `/stats`

Por isso `/stats` fica como **validacao dirigida em staging**, nao como hotfix confirmado.

## Implemented Locally

Ja esta codado localmente:

- correcao de namespace no controller em [company_dashboard_controller.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb)
- novo endpoint `analytics_top_campaigns` no mesmo controller
- rota `GET /api/v1/company_dashboard/analytics/top_campaigns` em [routes.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/routes.rb)
- spec de request para `top_campaigns` em [company_dashboard_top_campaigns_spec.rb](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/spec/requests/api/v1/company_dashboard_top_campaigns_spec.rb)

## Acceptance Criteria

### API Recovery
- [x] Identificar causa raiz real de `/analytics/overview`
- [x] Identificar causa raiz real de `/analytics/timeseries`
- [x] Identificar causa raiz real de `/analytics/top_campaigns`
- [x] Implementar hotfix local para overview/timeseries/top_campaigns
- [ ] Validar hotfix em staging com usuario autenticado
- [ ] Confirmar zero `500` e zero `404` nos endpoints corrigidos apos deploy

### `/stats` Validation
- [ ] Validar `/api/v1/company_dashboard/stats?company_id=372` em staging
- [ ] Se reproduzir falha, capturar stack trace e aplicar fix minimo orientado por evidencia
- [ ] Se nao reproduzir, fechar task como `not reproduced after hotfix`

### Regression Coverage
- [x] Adicionar cobertura de request para `top_campaigns`
- [ ] Adicionar cobertura de request para overview/timeseries quando o boot do Rails estiver destravado
- [ ] Adicionar E2E autenticado cobrindo carregamento da aba analytics

### Operational Hardening
- [ ] Validar logs estruturados em staging/producao
- [ ] Revisar alertas para `5xx` nos endpoints de dashboard
- [ ] Documentar postmortem e medidas preventivas

## Execution Plan

### Phase 1: RCA
- concluida com evidencias de logs de producao

### Phase 2: Backend Hotfix
- overview/timeseries: implementado localmente
- top_campaigns: implementado localmente
- stats: reescopado para validacao em staging

### Phase 3: Validation
- deploy em staging
- reproduzir fluxo autenticado
- verificar network, console e payloads

### Phase 4: Follow-up
- fechar gaps de testes
- monitoring e postmortem

## Current Risks

- A validacao runtime local com RSpec segue bloqueada por um problema preexistente de boot do Rails ligado a `activeadmin` (`ActiveAdmin::Views::TabbedNavigation`).
- Uma tentativa posterior de recaptura com `playwright-cli` nao reproduziu o incidente porque a sessao carregada nao estava autenticada e foi redirecionada para `/login`.

## Definition of Done

- [ ] Staging retorna `200` para `overview`, `timeseries` e `top_campaigns`
- [ ] Dashboard analytics carrega sem erro autenticado
- [ ] `/stats` validado ou corrigido com evidencia concreta
- [ ] Sem regressao obvia no dashboard de empresa
- [ ] Story e board atualizados com status final

## Notes

- Avisos de preload, cookies GA e CSS vistos no navegador nao foram a causa da quebra do dashboard.
- A causa tecnica confirmada foi backend namespace resolution + rota ausente.

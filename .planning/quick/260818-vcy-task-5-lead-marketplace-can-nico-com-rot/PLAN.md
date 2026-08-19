---
name: task-5-lead-marketplace-can-nico-com-rot
description: Lead marketplace canônico com roteamento, distribuição, SLA, rerouting, inbox e analytics
created: 2026-08-19
status: in-progress
---

# TASK 5 — Lead Marketplace

## Objetivo
Evoluir `Lead` e `LeadDistribution` existentes para marketplace bilateral sem criar domínio paralelo.

## Decisões travadas
- `Lead` é lead comercial canônico.
- `ChatLead`, `CreatorLead` e `ContentLead` permanecem fontes especializadas; não criar `MarketplaceLead`/`LeadV2`.
- Distribuição máxima configurável via `LEAD_MAX_DISTRIBUTIONS`, padrão 3.
- Routing assíncrono após criação/verificação do lead.
- Hard eligibility separada de match score.
- Sem monetização, CPL, wallet, Stripe por lead ou ML nesta task.
- Sem alterar fix Zeitwerk.

## Escopo
1. Auditar e consolidar schema/statuses existentes.
2. Evoluir `LeadDistribution` com lifecycle, timestamps, match score/reasons e unicidade.
3. Criar serviços de score/matching/routing idempotentes, reutilizando `LeadDistribution`.
4. Criar jobs de routing, expiração e rerouting sem PII nos argumentos.
5. Criar endpoints autenticados de inbox, viewed, accept, reject e convert, com autorização por empresa.
6. Melhorar dashboard de leads existente, sem novo app.
7. Reutilizar wizard versionado e registrar versão/contexto/consentimento existente.
8. Instrumentar eventos sem PII e notificações existentes.
9. Adicionar migrations somente para colunas/índices comprovadamente faltantes.
10. Adicionar model/service/request/job specs.

## Arquivos esperados
- `AB0-1-back/app/models/lead.rb`
- `AB0-1-back/app/models/lead_distribution.rb`
- `AB0-1-back/app/services/lead_distribution_service.rb`
- `AB0-1-back/app/services/leads/*`
- `AB0-1-back/app/jobs/lead_*`
- `AB0-1-back/app/controllers/api/v1/lead_distributions_controller.rb`
- `AB0-1-back/app/controllers/api/v1/dashboard/leads_controller.rb`
- `AB0-1-back/config/routes.rb`
- `AB0-1-back/db/migrate/*lead_marketplace*`
- specs correspondentes

## Verificação
- `rails zeitwerk:check`
- model/service/request/job specs
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` quando frontend alterado
- revisar logs sem PII

## Bloqueios conhecidos
- Ruby/Bundler ausentes no ambiente local anterior; executar backend em CI/container.
- `LeadDistribution` atual possui apenas `queued/sent/failed`, `assigned_at`, `payload`; routing atual destrói e recria distribuições.
- Dashboard atual lista leads diretamente por `company_id`; distribuições ainda não estão integradas ao inbox.

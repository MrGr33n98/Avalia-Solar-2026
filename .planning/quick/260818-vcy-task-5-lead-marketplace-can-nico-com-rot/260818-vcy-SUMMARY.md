---
name: task-5-lead-marketplace-can-nico-com-rot
status: incomplete
completed: 2026-08-19
---

# Summary

## Implementado
- Auditoria confirmou `Lead` como lead comercial canônico.
- `ChatLead`, `CreatorLead` e `ContentLead` permanecem domínios/fontes especializados.
- `LeadDistribution` evoluído com lifecycle: queued, sent, viewed, accepted, rejected, expired, converted, failed.
- Migrations idempotentes para campos de wizard, idempotência, match score/reasons, timestamps, índices e unicidade.
- Criados score determinístico, matching com hard eligibility, routing assíncrono e expiração.
- Endpoints B2B de show/viewed/accept/reject/convert com autorização por empresa.
- Dashboard de leads passou a consultar distribuições e não somente `lead.company_id`.
- Wizard registra origem e versão quando versão dinâmica existe.
- Confirmação frontend exibe quantidade real de empresas encontradas.
- TypeScript frontend passou.
- Algoritmo legado de `LeadDistributionService` removido; matching único é `Leads::LeadMatchingService`.
- Inbox preserva mercado/inteligência existente, mas lista leads por `LeadDistribution`.
- Contador de matches no wizard usa resposta real de `wizard_result`.

## Auditoria de domínio

| Domínio | Propósito | Status |
|---|---|---|
| Lead | Lead comercial canônico, wizard, consentimento, attribution | PASS |
| ChatLead | Lead especializado do chat IA | PASS |
| ContentLead | Captação por conteúdo/downloads | PASS |
| CreatorLead | Captação de creators | PASS |
| LeadDistribution | Destino por empresa; evoluído para marketplace | PARTIAL |
| IntentScore | Score/intenção por empresa/sessão | PARTIAL |
| BuyerIntentActivity | Sinais comportamentais | PASS |

## Schema antes
- `leads`: dados de contato, wizard_answers, attribution_json, source, scores legados, consent snapshot.
- `lead_distributions`: lead_id, company_id, status queued/sent/failed, assigned_at, payload.
- Wizard dinâmico versionado já existente.
- Índices básicos de leads/distributions já existentes.

## Schema depois
- `leads`: idempotency_key, lead_wizard_version_id, lifecycle expandido.
- `lead_distributions`: match_score, match_reasons, sent/viewed/accepted/rejected/expired/converted timestamps, rejection_reason, unique lead/company.
- Migrations não executadas localmente.

## Bloqueios
- Ruby/Bundler ausentes no ambiente local; Zeitwerk, migrations, RSpec e Rails runner não executados.
- Frontend completo ainda não passou lint/build/testes.
- Matching inicial depende de `quote_feature_enabled?`; quota/fairness histórico ainda precisam integração real.
- Acceptance SLA e rerouting job básicos, sem operação real validada.
- Frontend full lint ainda possui débitos preexistentes em `lib/api.ts`; typecheck passa.

## Última ação
TypeScript passou após integração da inbox canônica.

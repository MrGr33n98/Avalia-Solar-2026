# DDD implementation status — Company AI, PR #222

## Implementado com gates RSpec/Jest
- `CompanyAi::FeatureGate`: rollout OFF by default, paid plan and entitlement fail closed.
- `CompanyAi::WorkflowValidator` and `WorkflowRunner`: declarative graph, allowlisted nodes, bounded directed acyclic workflow.
- `CompanyAi::BusinessCalendar`: structured timezone, weekday and holiday exceptions.
- `CompanyAi::Publisher`: owner/manager publication with DB transaction and audit.
- `CompanyAi::KnowledgeRetriever`: public and approved FAQ/product relations only; no PDF parsing yet.
- `CompanyAi::UsageLedger`: basic per-company atomic request quota and idempotency.
- `CompanyAiAssistant`, `CompanyAiWorkflowVersion`, audit and ledger persistence.
- Company admin configuration/draft/publish endpoints, public capability query.
- Sessão pública Company AI vinculada ao tenant, token assinado e endpoint de mensagens JSON.
- Runtime de workflow com escolhas determinísticas, contexto público aprovado, ação de orçamento allowlisted,
  handoff para `ChatSession`/Live Inbox, sanitização anti-injection, idempotência e liquidação de quota.
- Widget público na Brand Page, condicionado ao capability endpoint e sem duplicar o chat P2P.
- Dashboard tab with no-code dropdown builder, schedule editor and non-billable static preview.
- Analytics event contracts and focused CI job.

## Ainda pendente / não declarar W0 concluído
- Reconciliação assinada com o provedor (tokens/custo real); o ledger atual liquida a resposta do gateway e usa pricing configurado.
- Company AI mode arbitration with general MobiVolt on PWA without duplicate floating widgets.
- Approved PDF/CSV/XLSX extraction, content moderation and provenance per segment.
- Operação completa de handoff em tempo real, disponibilidade de agentes e calendário no Live Inbox.
- Full telemetry funnel and server outbox, consent and retention policy review.
- Abuse prevention for unauthenticated sessions, concurrency, prompt-injection red-team.
- Real Playwright PWA/web journey with auth, full regression, production rollback drills.

## Guardrails
- Keep draft PR; `COMPANY_AI_ENABLED` remains false until all gates pass.
- No merge to main, schema change deployment or production flags as part of partial work.
- No UI click may authorize business actions; backend must validate tenant and entitlements.
- No PostHog interaction counts are financial records.

# DDD implementation status — Company AI, PR #222

## Atualização da branch `feat/company-ai-assistant-ddd-tdd-v1`

Baseline sincronizado com `main` em `bc9e2a75a`; o merge local foi realizado em `835ae834f` antes desta rodada.

Evidências locais desta rodada:

- RSpec Company AI/API: **44 exemplos, 0 falhas**, PostgreSQL/Redis isolados em Docker.
- Jest Company AI: **3 suítes, 7 testes, 0 falhas**; o widget público está incluído no gate CI.
- TypeScript: `tsc --noEmit` concluído sem erro.
- ESLint do escopo frontend alterado: concluído sem erro.
- RuboCop dos serviços/specs alterados: **3 arquivos, 0 offenses**.

O CI remoto e o deploy ainda precisam ser executados após o push desta branch; nenhum resultado remoto é inferido a partir destas evidências locais.

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
- Widget público na Brand Page, condicionado ao capability endpoint, com arbitration pela `CommunicationSurfaceManager` e sem duplicar o chat P2P.
- Dashboard tab with no-code dropdown builder, schedule editor and non-billable static preview.
- Analytics event contracts, telemetria server-side request/latência/fallback/quota e eventos operacionais no Outbox existente.
- Ação `open_quote_wizard` conectada ao `openQuoteWizard` existente; vínculo server-side do `lead_created` ainda não foi declarado concluído.
- Lockfile frontend contém a entrada SWC opcional ausente e o gate inclui o teste do widget.

## Ainda pendente / não declarar W0 concluído
- Reconciliação assinada com o provedor (tokens/custo real); o ledger atual liquida a resposta do gateway e usa pricing configurado.
- Approved PDF/CSV/XLSX extraction, content moderation and provenance per segment.
- Operação completa de handoff em tempo real, disponibilidade de agentes e calendário no Live Inbox.
- Dashboard completo do funil e custo por empresa, além de consumidores específicos dos eventos do Outbox.
- Consentimento, retenção e deleção de mensagens ainda aguardam decisão de Legal/Produto.
- Abuse prevention for unauthenticated sessions, concurrency, prompt-injection red-team.
- Real Playwright PWA/web journey with auth, full regression, production rollback drills.

## Guardrails
- Keep draft PR; `COMPANY_AI_ENABLED` remains false until all gates pass.
- No merge to main, schema change deployment or production flags as part of partial work.
- No UI click may authorize business actions; backend must validate tenant and entitlements.
- No PostHog interaction counts are financial records.

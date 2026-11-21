# DDD implementation status — Company AI, PR #222

## Implemented with RSpec/Jest gates
- `CompanyAi::FeatureGate`: rollout OFF by default, paid plan and entitlement fail closed.
- `CompanyAi::WorkflowValidator` and `WorkflowRunner`: declarative graph, allowlisted nodes, bounded directed acyclic workflow.
- `CompanyAi::BusinessCalendar`: structured timezone, weekday and holiday exceptions.
- `CompanyAi::Publisher`: owner/manager publication with DB transaction and audit.
- `CompanyAi::KnowledgeRetriever`: public and approved FAQ/product relations only; no PDF parsing yet.
- `CompanyAi::UsageLedger`: basic per-company atomic request quota and idempotency.
- `CompanyAiAssistant`, `CompanyAiWorkflowVersion`, audit and ledger persistence.
- Company admin configuration/draft/publish endpoints, public capability query.
- Dashboard tab with no-code dropdown builder, schedule editor and non-billable static preview.
- Analytics event contracts and focused CI job.

## NOT finished / MUST NOT DEPLOY
- Runtime public company-bound chat sessions and safe generation (LLM), provider token/cost reconciliation.
- Company AI mode arbitration with general MobiVolt on PWA without duplicate floating widgets.
- Approved PDF/CSV/XLSX extraction, content moderation and provenance per segment.
- Real-time human handoff with working calendar and existing Live Inbox entitlements.
- Full telemetry funnel and server outbox, consent and retention policy review.
- Abuse prevention for unauthenticated sessions, concurrency, prompt-injection red-team.
- Real Playwright PWA/web journey with auth, full regression, production rollback drills.

## Guardrails
- Keep draft PR; COMPANY_AI_ENABLED remains false until all gates pass.
- No merge to main, schema change deployment or production flags as part of partial work.
- No UI click may authorize business actions; backend must validate tenant and entitlements.
- No PostHog interaction counts are financial records.

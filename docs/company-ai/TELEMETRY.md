# Company AI — Telemetry taxonomy and invariants

Events in `lib/analytics/schema.ts` and `lib/analytics/contract.ts` are client-side product telemetry.
Existing `Analytics::PostHogService` remains consent-governed. Do not send message text,
IP addresses, customer contacts, full URLs with query parameters or document contents.

## Attribution chain
`company_id -> assistant_version_id -> workflow_version_id -> chat_session_id -> request_id -> quote_attempt_id -> lead_id`.

Client analytics:
- `company_ai_widget_viewed` once when >=50% visible for 1s, consent permitting
- `company_ai_widget_opened` on human click/keyboard
- `company_ai_first_question_sent` only after accepted request
- `company_ai_answer_rendered` after content is painted
- `company_ai_quote_started` before the existing Lead Wizard
- `company_ai_handoff_requested` before approved Inbox handoff
- `company_ai_workflow_published_ui` is a click-layer signal, NOT confirmation of publication.

Authoritative backend facts:
- `CompanyAiWorkflowVersion.status == published`
- `CompanyAiAuditEvent(action='workflow_published')`
- `CompanyAiUsageEntry(state='settled')`
- existing `lead_created`, after database commit

## Required dashboards (proposal, not deployed)
- Business activation funnel: entitled -> configured -> draft -> published -> first response
- Public funnel: widget viewed -> opened -> question accepted -> answer rendered -> quote -> lead
- p50/p95 response time, fallback, RSpec reference validity
- Per-tenant reserved/settled/released quota, provider token reconciliation and monthly costs
- Negative tests for event duplicates, missing consent, retries and cross-tenant access

## Anti-duplication
Frontend analytics deduplication affects only analytics dispatch.
DB request uniqueness and per-company transactional usage reservation are different safeguards.
No invoice should ever depend on a client event.

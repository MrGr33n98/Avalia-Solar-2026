# Company AI Assistant — DDD/TDD implementation plan

Branch: `feat/company-ai-assistant-ddd-tdd-v1`. Feature stays OFF by default.
No merge/deploy until isolated company access, billing/usage reconciliation, privacy and integration tests pass.

## Bounded contexts
- **Entitlements**: `CompanyAi::FeatureGate` decides public availability based on server state and billing.
- **Workflow**: immutable graph versions; deterministic allowlisted transitions; no arbitrary code execution.
- **Knowledge**: published, reviewed, tenant-scoped catalog, FAQs and materials.
- **Conversation**: existing ChatSession/ChatMessage + server-bound company identity; model never chooses unauthorized actions.
- **Usage**: idempotent reservations and reconciled provider token costs.
- **Attribution**: PWA events in PostHog and domain facts from Rails; lead_created remains the canonical lead.
- **Governance**: drafts, approval, publication, rollback, auditing, deletion and retention.

## TDD red-green-refactor
1. Specifications for authorization, graph validator, calendar and runner.
2. Domain services and models.
3. API request specs (cross-tenant and suspended plan).
4. PWA component tests + Playwright at 320/360/390/430 px.
5. Ingestion safety, SSE/token metering, quota concurrency and audit trails.
6. CI, observability, feature flag rollout, load tests.

## Contract gates
- Public activity requires `COMPANY_AI_ENABLED=true` **and** eligible active company and entitlement.
- Company AI must never derive authority solely from `page_url` or arbitrary client `company_id`.
- Unapproved documents never participate in retrieval.
- Every published workflow is finite, reachable and consists only of allowlisted actions.
- Quote/handoff requires the pre-existing CTA / Inbox entitlements, regardless of model instructions.
- Usage charging occurs once per request ID after provider reconciliation; simulated requests are never billable.
- No personal data or conversation text in PostHog payloads.
- MobiVolt general remains operational if company AI is unavailable.

## Release gates
- Migration reversible and tested, default flag OFF; code review for scope and permissions.
- CI: RSpec + ESLint/TypeScript + Jest + Playwright + security checks.
- Shadow/pilot, compare baseline, verify p95 latency, accuracy, conversion and token costs.
- Expansion only after security and privacy approval.

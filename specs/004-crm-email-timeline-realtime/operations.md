# Operations

## Configuration

`EMAIL_TRACKING_HOST` is an HTTPS origin, with no trailing path, injected identically into backend and worker. The versioned Nginx `/t/` route is on `crm.avaliasolar.com.br`, so `.env.example` uses `https://crm.avaliasolar.com.br`; production fails closed when the value is absent or invalid. `NEXT_PUBLIC_ENABLE_REALTIME` remains false until `/cable` handshake and authorized subscription are validated. Do not display or log secret values.

## Diagnostics

Readiness checks DB, Redis, Sidekiq and the required tracking origin. The tracking diagnostic reports whether SNS and ActionCable are configured; it does not perform an AWS SES API probe. The existing `Sales::Messaging::Providers::HealthCheck` performs a real SES check when explicitly invoked by an authorized operator; its result must be captured separately. Health does not send an email to a prospect. Inspect request IDs/event IDs and counts, never payload PII.

## Metrics

`email_tracking_requests_total`, `email_tracking_events_persisted_total`, `email_tracking_duplicate_total`, `email_tracking_proxy_total`, `email_tracking_bot_total`, `email_tracking_errors_total`, `ses_webhook_events_total`, `ses_webhook_invalid_total`, `sales_realtime_connections`, `sales_realtime_broadcasts_total`, `sales_realtime_reconnections_total`, `timeline_delta_recovery_total`. Labels must be bounded and PII-free.

## Verification commands

Local session evidence (2026-09-26): frontend `npm run typecheck` passed; focused Jest `__tests__/components/sales/UnifiedTimeline.spec.tsx` passed (2 tests). Ruby syntax checks passed inside the existing Rails dev container. Focused RuboCop reported offenses (including pre-existing controller offenses and new layout/complexity findings); RSpec and migration up/down were not run because no isolated test database/container was available. VPS Nginx configuration, Compose environment, AWS SES/SNS and mailbox remain runtime facts for an authorized operator.

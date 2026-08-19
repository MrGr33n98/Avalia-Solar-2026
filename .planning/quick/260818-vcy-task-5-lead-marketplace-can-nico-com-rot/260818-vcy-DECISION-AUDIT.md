# TASK 5 Decision Audit

## Canonical lead
`Lead` remains canonical commercial lead. Existing `ChatLead`, `CreatorLead`, `ContentLead` remain source-specific entities. No parallel marketplace lead created.

## Existing state
- Wizard: versioned `LeadWizardVersion` with sections/fields/options; `LeadWizard::Resolver` and `Creator` already validate server-side.
- Lead: contact, location, category, wizard answers, attribution, consent snapshot, score fields, source fields.
- Distribution: existed as queued/sent/failed with lead/company/assigned_at; expanded in this task.
- Matching: old `LeadDistributionService` used broad company fallback and destroyed distributions; new service hard-filters category/location/quote entitlement and preserves records.
- Inbox: existing dashboard endpoint listed direct `Lead.company_id`; changed to query `LeadDistribution` company scope.
- Auth: dashboard base controller authenticates JWT and current company; distribution actions authenticate API user and verify company membership/admin.
- Notifications: existing `Notification` supports `new_lead`, in-app/email delivery.
- Analytics: existing `Analytics::TrackEventService`; distribution events use lead/distribution/company IDs only.
- Billing: plan feature catalog and `quote_feature_enabled?` reused; no quota charging or CPL added.
- Intent: existing `IntentScore` and `BuyerIntentActivity` remain separate. Deterministic marketplace score added under `Leads::LeadScoringService`, not a new model.

## Production blockers
- Backend runtime unavailable locally (`ruby`/`bundle` absent); migrations/RSpec/Zeitwerk not executed.
- Full frontend lint/test/build not executed.
- New API specs need execution in Rails environment.
- Migration check constraint replacement must be verified against Rails 7 adapter.
- Existing lead wizard OTP flow still performs routing on verification path; async job now selected behind `LEAD_MARKETPLACE_V1`, but response matching remains eventual.
- No user-facing distribution status screen created; confirmation returns real count only when already available.

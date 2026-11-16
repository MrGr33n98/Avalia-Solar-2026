# WhatsApp CRM Foundation — Feature-flagged rollout

Status: proposed PR; disabled by default. No production integration is asserted.

## Boundaries

- Official Avalia Solar WAHA session only. Third-party integrator WhatsApp numbers are NOT connected.
- Sales CRM is internal. No CompanyMember or marketplace user gains Sales access.
- Consumer voice reviews are excluded; this foundation records **only** explicitly commercial intents.
- No raw text, phone numbers or audio files enter Sales WhatsApp tables or the API.
- No leads, opportunities, memberships or tasks are created from an unverified message.
- The internal Sales tenant is configured explicitly. Do not set it to a marketplace prospect's Company ID.
- Phone identity matches existing Sales::ContactMethod records only when there is exactly one match under the configured tenant.

## Feature flags

- `WHATSAPP_CRM_ENABLED=true`: enables the bridge (default false).
- `WHATSAPP_CRM_TENANT_COMPANY_ID=<internal-crm-company-id>`: required internal tenant ID; missing disables bridge.

Use a confirmed internal CRM tenant Company ID. Do not set this until tenancy and data processing arrangements are validated.

The existing `VOICE_REVIEWS_ENABLED` controls the WAHA webhook. It is separate from the CRM bridge.

## Read-only CRM API

- GET /api/v1/sales/whatsapp_threads
- GET /api/v1/sales/whatsapp_threads/:id

Requires internal Sales access and the accounts.read permission. No phone/text/audio fields are returned.

## Data model

- sales_whatsapp_threads: internal tenant Company, provider, provider session, keyed contact hash, optional Sales Contact / Account.
- sales_whatsapp_messages: provider message ID, intent, type, direction and timestamp. Unique provider ID per thread.

## Alerts

Price/plan questions, human support and company claims yield deduplicated Founder Inbox items, linked to an account only after a unique matching Sales contact is identified.

## Deliberately deferred

- Full read/write WhatsApp inbox, outbound sends, media, automated lead creation.
- AI-based intent enrichment, broad retention, dynamic scores and campaign triggers.
- Shared visibility for external companies.
- Production enablement, backfill and migration execution.

## Gates

1. Run migrations on isolated test database.
2. Run specs for onboarding security, CRM classifier and ingestion job.
3. Run complete backend RSpec, lint and frontend tests.
4. Validate strict cross-tenant API access with fixtures.
5. Review privacy/legal basis and internal tenant mapping.
6. Only then consider enabling the CRM bridge in a controlled rollout.

## Two-step owner activation

- Approval by an authenticated administrator is recorded first; if the applicant's email is unconfirmed, the company and owner membership remain pending.
- The applicant receives a Devise confirmation message after admin approval. Completing confirmation finalizes only reviewed and approved claims.
- A WhatsApp-onboarded applicant receives a password-setup/reset email after confirmation; the random initial credential is never disclosed.
- Do not bypass confirmation, owner review or tenant validation during rollout.

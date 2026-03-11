# STORY SUMMARY
**Issue ID:** `STORY-INTENT-003`
**Title:** Implementação Fase 3: B2B Product Launch & Dashboard
**Epic:** Buyer Intent Data Platform
**Status:** 🟡 IMPLEMENTATION COMPLETE - TESTING PENDING
**Assignee:** Dev Agent

## 📖 User Story
**As a** Marketplace Integrator (B2B Partner)
**I want** an analytical dashboard inside my portal to inspect all hot leads and receive automated real-time webhooks on my personal CRM
**So that** I have a tangible product experience to justify a premium subscription on the Avalia-Solar platform.

## ✅ Acceptance Criteria (Critérios de Aceite)
1. ✅ **[Backend]** `intent_tier` implemented on `companies` table (Free, Pro, Enterprise arrays) acting as feature toggles locking basic views.
2. ✅ **[Backend]** Enterprise users can register webhook endpoints on `company_webhooks`. A mechanism via `WebhookDeliveryJob` must reliably push data with HMAC payloads.
3. ✅ **[Backend]** Firmographic enrichment job placeholder exists: `EnrichAnonymousSessionJob` handles IP-to-Company fetching.
4. ✅ **[Frontend]** Gated components built (`GatedContentDownload.tsx`) forcing B2B guests to drop their emails to convert from Anonymous to Identified.
5. ✅ **[Frontend]** Visually rich 'Intent Dashboard' (`/dashboard/intent`) with Tailwind blocks showcasing KPI trends and Ranking Lists of hot accounts.

## 🛠 Technical Notes
- Execution Prompt reference: `.codex/agents/PROMPT-PHASE3-B2B-PRODUCT.md`
- B2B portal integration requires mapping server responses directly onto Next.js Suspense boundaries to showcase hot data metrics perfectly.
- Rate limiting and standard HTTP `Net::OpenTimeout` handlers in ruby for external Webhooks.

---

## 📝 Dev Agent Record

### Implementation Progress
- [x] Tier system (Free/Pro/Enterprise)
- [x] Company model intent methods
- [x] Migration foreign keys aligned with bigint-based companies/users schema
- [x] CompanyWebhooks table + model
- [x] WebhookDeliveryJob (HMAC signing)
- [x] EnrichAnonymousSessionJob (firmographic placeholder)
- [x] GatedDownloads table + model
- [x] GatedContentDownload.tsx component
- [x] Intent Dashboard page (/dashboard/intent)
- [x] GatedDownloadsController API
- [x] API controllers aligned with shared CSRF skip behavior
- [x] Routes configured
- [ ] RSpec tests
- [ ] Integration testing
- [ ] Production deployment

### Files Created
**Backend:**
- `db/migrate/20260310160201_add_intent_subscription_to_companies.rb`
- `db/migrate/20260310160242_create_company_webhooks.rb`
- `db/migrate/20260310160300_create_gated_downloads.rb`
- `app/models/company_webhook.rb`
- `app/models/gated_download.rb`
- `app/jobs/webhook_delivery_job.rb`
- `app/jobs/enrich_anonymous_session_job.rb`
- `app/controllers/api/v1/gated_downloads_controller.rb`

**Frontend:**
- `components/GatedContentDownload.tsx`
- `app/dashboard/intent/page.tsx`

**Modified:**
- `db/migrate/20260310160000_create_intent_scores.rb` (align company/lead foreign key column types)
- `db/migrate/20260310160100_create_anonymous_sessions.rb` (align user/company foreign key column types)
- `db/migrate/20260310160242_create_company_webhooks.rb` (align company foreign key column type)
- `db/migrate/20260310160300_create_gated_downloads.rb` (align company/user foreign key column types and fix users foreign key declaration)
- `app/controllers/api/v1/gated_downloads_controller.rb` (remove redundant CSRF skip causing Rails boot failure)
- `app/controllers/api/v1/identity_stitch_controller.rb` (remove redundant CSRF skip to match API base controller behavior)
- `app/models/company.rb` (intent tier methods)
- `config/routes.rb` (gated_downloads route)

### File List
- `AB0-1-back/db/migrate/20260310160000_create_intent_scores.rb`
- `AB0-1-back/db/migrate/20260310160100_create_anonymous_sessions.rb`
- `AB0-1-back/db/migrate/20260310160242_create_company_webhooks.rb`
- `AB0-1-back/db/migrate/20260310160300_create_gated_downloads.rb`
- `AB0-1-back/app/controllers/api/v1/gated_downloads_controller.rb`
- `AB0-1-back/app/controllers/api/v1/identity_stitch_controller.rb`

### Change Log
- **2026-03-11 14:00 -03**: Hotfix de boot do Rails removendo `skip_before_action :verify_authenticity_token` redundante em controllers API herdados de `BaseController`
- **2026-03-11 13:52 -03**: Hotfix de deploy para alinhar foreign keys `company_id`/`user_id`/`lead_id` ao schema legado em `bigint`
- **2026-03-10 13:05**: Phase 3 implementation complete

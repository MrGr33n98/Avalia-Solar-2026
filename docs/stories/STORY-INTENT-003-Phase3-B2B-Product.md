# STORY SUMMARY
**Issue ID:** `STORY-INTENT-003`
**Title:** Implementação Fase 3: B2B Product Launch & Dashboard
**Epic:** Buyer Intent Data Platform
**Status:** BACKLOG
**Assignee:** Dev Agent

## 📖 User Story
**As a** Marketplace Integrator (B2B Partner)
**I want** an analytical dashboard inside my portal to inspect all hot leads and receive automated real-time webhooks on my personal CRM
**So that** I have a tangible product experience to justify a premium subscription on the Avalia-Solar platform.

## ✅ Acceptance Criteria (Critérios de Aceite)
1. **[Backend]** `intent_tier` implemented on `companies` table (Free, Pro, Enterprise arrays) acting as feature toggles locking basic views.
2. **[Backend]** Enterprise users can register webhook endpoints on `company_webhooks`. A mechanism via `WebhookDeliveryJob` must reliably push data with HMAC payloads.
3. **[Backend]** Firmographic enrichment job placeholder exists: `EnrichAnonymousSessionJob` handles IP-to-Company fetching.
4. **[Frontend]** Gated components built (`GatedContentDownload.tsx`) forcing B2B guests to drop their emails to convert from Anonymous to Identified.
5. **[Frontend]** Visually rich 'Intent Dashboard' (`/dashboard/intent`) with Tailwind blocks showcasing KPI trends and Ranking Lists of hot accounts.

## 🛠 Technical Notes
- Execution Prompt reference: `.codex/agents/PROMPT-PHASE3-B2B-PRODUCT.md`
- B2B portal integration requires mapping server responses directly onto Next.js Suspense boundaries to showcase hot data metrics perfectly.
- Rate limiting and standard HTTP `Net::OpenTimeout` handlers in ruby for external Webhooks.

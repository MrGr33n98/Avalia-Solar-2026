# STORY SUMMARY
**Issue ID:** `STORY-INTENT-001`
**Title:** Implementação Fase 1: Dark Funnel Capture (Micro-Interações)
**Epic:** Buyer Intent Data Platform
**Status:** BACKLOG
**Assignee:** Dev Agent

## 📖 User Story
**As a** Product Owner
**I want** to track subtle user micro-interactions (hovering CTAs, copying phone numbers, scrolling pauses) on the frontend and store this securely in the backend
**So that** we can capture 40% more buyer intent signals before the user explicitly fills out a form.

## ✅ Acceptance Criteria (Critérios de Aceite)
1. **[Backend]** The `buyer_intent_activities` table must exist, holding columns for `signal_type`, `intent_weight`, `element_selector`, and UUID mappings for company and session.
2. **[Backend]** The API route `POST /api/v1/intent_signals` must handle rate limiting (120 req/min/IP via Rack::Attack) and sanitize IP addresses with SHA256 hashes for LGPD compliance.
3. **[Frontend]** The `useHoverIntent`, `useCopyIntent`, `useScrollPause`, and `useFormHesitation` custom Next.js hooks must be correctly implemented and utilizing the existing `analytics/index.ts`.
4. **[Frontend]** Components like the **Company Card** and **Company Profile** must dispatch these new intent events to PostHog and GA4 without tracking Personally Identifiable Information (PII).
5. **[Testing]** RSpec must have unit tests covering the `BuyerIntentActivity` model and requests tests for `IntentSignalsController`.

## 🛠 Technical Notes
- Execution Prompt reference: `.codex/agents/PROMPT-PHASE1-DARK-FUNNEL.md`
- Tech Stack: **Rails 7, PostgreSQL, Next.js 14 (App Router), PostHog, GTM**
- No N+1 queries. Foreign keys indexed.

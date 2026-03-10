# STORY SUMMARY
**Issue ID:** `STORY-INTENT-002`
**Title:** Implementação Fase 2: Scoring Engine & Identity Stitching
**Epic:** Buyer Intent Data Platform
**Status:** 🟡 IMPLEMENTATION COMPLETE - TESTING PENDING
**Assignee:** Dev Agent

## 📖 User Story
**As a** B2B Sales Manager / Systems Admin
**I want** to automatically calculate a standardized intent score (0-100) based on all tracked signals, merge anonymous sessions when users identify themselves, and rank companies
**So that** my sales team structure their routine prioritizing companies listed as "Fervendo" (Boiling) or "Imediato" (Immediate) with a SLA window.

## ✅ Acceptance Criteria (Critérios de Aceite)
1. ✅ **[Backend]** Migrations for `intent_scores`, `anonymous_sessions`, and `intent_score_histories` are implemented with UUIDs and proper indexing.
2. ✅ **[Backend]** The `IntentScoringService` runs in the background calculating raw scores with temporal decay logic (e.g. -50% per 7 days of inactivity).
3. ✅ **[Backend]** Identity Stitching happens via `StitchIdentityJob` - anonymous behaviors map over to actual `user_id`/`lead_id` successfully when identification occurs (e.g. form submit).
4. ✅ **[Backend]** `IntentScoresController` makes ranking insights available (`/api/v1/intent_scores`) with summarized levels (Cold -> Declared). 
5. ✅ **[Frontend]** The identity mechanism is exposed via `lib/analytics/identity-stitch.ts` handling `posthog.identify` and `alias`.
6. ⏳ **[Testing]** RSpec cover scenarios for identity stitching and scoring calculations matching the business rule tiers.

## 🛠 Technical Notes
- Execution Prompt reference: `.codex/agents/PROMPT-PHASE2-SCORING-ENGINE.md`
- Sidekiq workers handle all intensive calculations asynchronously.
- Scoring is cached/memoized on the scoring tables to ensure O(1) reads by the dashboards.

---

## 📝 Dev Agent Record

### Implementation Progress
- [x] Database migrations created (3 tables)
- [x] Models implemented (IntentScore, AnonymousSession, IntentScoreHistory)
- [x] IntentScoringService with decay logic
- [x] Background jobs (Calculate, Stitch, Notify, Decay)
- [x] API controllers (IntentScores, IdentityStitch)
- [x] Routes configured
- [x] Frontend identity-stitch.ts
- [ ] RSpec tests written
- [ ] Integration testing
- [ ] Production deployment

### Files Created
**Backend:**
- `db/migrate/20260310160000_create_intent_scores.rb`
- `db/migrate/20260310160100_create_anonymous_sessions.rb`
- `db/migrate/20260310160200_create_intent_score_histories.rb`
- `app/models/intent_score.rb`
- `app/models/anonymous_session.rb`
- `app/models/intent_score_history.rb`
- `app/services/intent_scoring_service.rb`
- `app/jobs/calculate_buyer_intent_job.rb`
- `app/jobs/stitch_identity_job.rb`
- `app/jobs/notify_intent_change_job.rb`
- `app/jobs/decay_intent_scores_job.rb`
- `app/controllers/api/v1/intent_scores_controller.rb`
- `app/controllers/api/v1/identity_stitch_controller.rb`

**Frontend:**
- `lib/analytics/identity-stitch.ts`

**Modified:**
- `config/routes.rb` (added intent_scores + identity routes)

### Debug Log
```
[2026-03-10 16:00] Story implementation started
[2026-03-10 16:05] Phase 1: 3 migrations created
[2026-03-10 16:10] Phase 2: 3 models created
[2026-03-10 16:25] Phase 3: IntentScoringService with decay logic
[2026-03-10 16:35] Phase 4: 4 background jobs created
[2026-03-10 16:45] Phase 5: 2 API controllers created
[2026-03-10 16:50] Phase 6: Routes configured
[2026-03-10 16:55] Phase 7: Frontend identity stitching
[2026-03-10 16:56] Core implementation complete
```

### Next Steps
1. Run migrations: `cd AB0-1-back && rails db:migrate`
2. Write RSpec tests (service + jobs + controllers)
3. Manual QA testing
4. Setup cron job for DecayIntentScoresJob (daily at 2am)
5. Configure notification integrations (Slack/CRM)
6. Monitor scoring performance in production

### Change Log
- **2026-03-10 16:56**: Phase 2 core implementation complete

---
phase: 05-phase-5-reviews-premium-reputacao
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: 
  - db/migrate/20260601_add_review_consent_fields_to_users.rb
  - app/models/user.rb
  - app/models/review.rb
autonomous: true
requirements: [REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-08, REV-09, REV-10]
user_setup: []

must_haves:
  truths:
    - "User consent fields exist in schema and are accessible"
    - "Review anonymization works based on consent flags"
    - "Default consent values protect user privacy (false by default)"
  artifacts:
    - path: "db/migrate/20260601_add_review_consent_fields_to_users.rb"
      provides: "LGPD consent schema migration"
      contains: "5 boolean columns"
    - path: "app/models/user.rb"
      provides: "Consent getters/setters"
      exports: ["public_name_consent?", "display_full_name_consent?"]
    - path: "app/models/review.rb"
      provides: "Anonymization logic"
      exports: ["reviewer_consented_to_full_name?", "anonymized_reviewer_name"]
  key_links:
    - from: "Review"
      to: "User"
      via: "consent_flags"
      pattern: "reviewer_consented_to_full_name?"
---

<objective>
**PHASE 5: Reviews Premium + ReviewCaptureFlow + Reputação**

Transform reviews into the central asset of Avalia Solar marketplace through reputation tracking, premium features, and intelligent review capture flows.

**Purpose:** Establish LGPD-compliant consent framework and review anonymization before implementing review capture, moderation, and reputation features.

**Output:** User model enhanced with consent fields, Review model with anonymization logic, schema migration applied.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@.planning/phases/05-phase-5-reviews-premium-reputacao/05-CONTEXT.md
@.planning/phases/05-phase-5-reviews-premium-reputacao/05-DISCUSSION-LOG.md
</execution_context>

<context>
## Locked Decisions (from 05-CONTEXT.md)

**Decision 1:** Multi-trigger ReviewCaptureFlow (profile, lead, chat)
- Per D-01: Entry points at `/companies/[id]/review` (profile), post-lead modal, and chat suggestion

**Decision 2:** Tiered moderation with smart auto-approval
- Per D-02: Auto-approve returning reviewers; flag suspicious content; pending status does NOT affect ranking

**Decision 3:** Dual reputation display (numeric 0-100 + tier badge)
- Per D-03: Tier mapping: 0-39 Crítica, 40-59 Fraca, 60-75 Boa, 76-90 Excelente, 91-100 Excepcional

**Decision 4:** Feature ladder across Free/Essential/Pro/Enterprise
- Per D-04: Reply to reviews = Essential+ only (no downgrade for existing Pro companies)

**Decision 5:** Lightweight form with progressive disclosure
- Per D-05: Rating required; at least one of comment OR criteria; all optional fields hidden until user interacts

**Decision 6:** Reputation integrated into ranking (30% weight)
- Per D-06: Use existing CompanyTrustScore (0-100); cold-start = 50; < 5 reviews = 0.20 confidence weight

**Decision 7:** Company reply feature (Essential+ only)
- Per D-07: 1:1 reply per review; max 300 chars; published immediately (no moderation)

**Decision 8:** Single-step mobile form UX
- Per D-08: Star → optional fields → consent → confirmation; <1min target on 4G

**Decision 9:** Tiered analytics dashboard
- Per D-09: Free = basic stats; Pro = trends + response rate; Enterprise = regional + export

**Decision 10:** Reputation impacts ranking immediately
- Per D-10: No delay; immediate weight; minimum threshold for new companies

## Critical Blocker (from Discussion Log)

⚠️ **BLOCKER IDENTIFIED:** User consent fields referenced in code but NOT in schema.
- Code references: `public_name_consent`, `display_full_name_consent`, `review_name_consent`, `lgpd_name_consent`, `show_full_name`
- **Must complete before Phase 5 code review**

## Etapa 1 Scope

This plan covers **Etapa 1: LGPD Consent Schema Migration** only.
- Add 5 boolean consent fields to users table
- Add User model methods for consent checking
- Add Review model anonymization logic
- Ensure backward compatibility (all defaults to false = maximum privacy)

Subsequent etapas (2-10) will follow in separate plans (execute in Wave 2-4).
</context>

<tasks>

<task type="auto">
  <name>Task 1.1: Create migration for user consent fields</name>
  <files>db/migrate/20260601_add_review_consent_fields_to_users.rb</files>
  <action>
Create Rails migration adding 5 boolean columns to users table (all default false):
- `public_name_consent` — User allows public display of name in reviews
- `display_full_name_consent` — User allows full name (vs first name only) 
- `review_name_consent` — User allows name display in reviews they write
- `lgpd_name_consent` — User confirms LGPD data usage consent
- `show_full_name` — Computed flag for display logic

Migration file: `db/migrate/[timestamp]_add_review_consent_fields_to_users.rb`

Ensure:
- All columns nullable: false, default: false
- Add indexes: none needed (low cardinality, infrequently filtered)
- Include change/down methods for reversibility
- Migration is idempotent (safe to re-run)

Per D-01: Consent framework enables LGPD compliance before multi-trigger capture flow launches.
  </action>
  <verify>
    <automated>rails db:migrate test 2>&1 | grep -i "success\|completed" && rails db:schema:dump && grep "public_name_consent\|display_full_name_consent" db/schema.rb</automated>
  </verify>
  <done>
    - Migration file created and committed
    - All 5 boolean columns added to users table
    - Rails db:migrate executes without errors
    - Schema dump confirms columns exist with default: false
    - Down migration reverses changes cleanly
  </done>
</task>

<task type="auto">
  <name>Task 1.2: Add consent getters/setters to User model</name>
  <files>app/models/user.rb</files>
  <action>
Add consent query methods and validations to User model:

```ruby
class User < ApplicationRecord
  # Consent attribute getters/setters
  def public_name_consent?
    public_name_consent.present? && public_name_consent
  end

  def display_full_name_consent?
    display_full_name_consent.present? && display_full_name_consent
  end

  def review_name_consent?
    review_name_consent.present? && review_name_consent
  end

  def lgpd_name_consent?
    lgpd_name_consent.present? && lgpd_name_consent
  end

  # Display name logic
  def displayable_full_name?
    display_full_name_consent? && lgpd_name_consent?
  end

  # Validations
  validates :public_name_consent, inclusion: { in: [true, false] }
  validates :display_full_name_consent, inclusion: { in: [true, false] }
  validates :review_name_consent, inclusion: { in: [true, false] }
  validates :lgpd_name_consent, inclusion: { in: [true, false] }
  validates :show_full_name, inclusion: { in: [true, false] }, allow_nil: true
end
```

Ensure:
- Getters return boolean (never nil)
- Setters follow Rails conventions
- All validations are present
- Default behavior: user.public_name_consent? returns false if field is null

Per D-01: Consent methods provide clean interface for review anonymization logic.
  </action>
  <verify>
    <automated>rails test:all 2>&1 | grep "User" | grep -i "pass\|ok" && rails test test/models/user_test.rb -v</automated>
  </verify>
  <done>
    - User model updated with 5 consent methods
    - All getter methods return boolean (no nil)
    - Validations added (inclusion: [true, false])
    - User.new.public_name_consent? returns false (default behavior)
    - No errors in rails test suite (User tests pass)
  </done>
</task>

<task type="auto">
  <name>Task 1.3: Update Review model with consent-based anonymization</name>
  <files>app/models/review.rb</files>
  <action>
Add anonymization logic to Review model that respects user consent flags:

```ruby
class Review < ApplicationRecord
  # ... existing associations

  # Consent-based display methods
  def reviewer_consented_to_full_name?
    reviewer_user&.display_full_name_consent? && reviewer_user&.lgpd_name_consent?
  end

  def anonymized_reviewer_name
    if reviewer_user.nil?
      "Anônimo"
    elsif reviewer_consented_to_full_name?
      reviewer_user.full_name
    else
      # Format: "F. L." (first initial, last initial)
      parts = (reviewer_user.full_name || "").split(' ')
      return "Anônimo" if parts.empty?
      first_initial = parts.first[0]
      last_initial = parts.last[0]
      "#{first_initial}. #{last_initial}."
    end
  end

  def display_reviewer_name
    anonymized_reviewer_name
  end

  # Validation: ensure at least rating or comment present
  validates :rating, presence: true, inclusion: { in: 1..5 }
  validates :comment, length: { maximum: 500 }
  validate :require_comment_or_criteria
  validate :prevent_self_review

  private

  def require_comment_or_criteria
    return if comment.present? || criteria_scores.present?
    errors.add(:base, "Review must have either a comment or criteria scores")
  end

  def prevent_self_review
    return if reviewer_user.nil? || company.nil?
    return if reviewer_user.id != company.user_id
    errors.add(:base, "Companies cannot review themselves")
  end
end
```

Ensure:
- anonymized_reviewer_name handles nil reviewer gracefully
- Format uses initials if no consent (e.g., "J. D.")
- Returns "Anônimo" if no user or name data
- display_reviewer_name alias for template convenience
- Existing validations preserved (rating 1-5, comment max 500)

Per D-01: Anonymization respects user consent before review displays on profile.
Per D-05: Lightweight form validation requires rating + (comment OR criteria).
  </action>
  <verify>
    <automated>rails test test/models/review_test.rb -v 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Review model updated with 3 new methods
    - anonymized_reviewer_name returns "F. L." format if no consent
    - Handles nil reviewer gracefully (returns "Anônimo")
    - display_reviewer_name aliases work in templates
    - Validation prevents self-reviews (company can't review self)
    - Validation requires rating + (comment OR criteria)
    - All existing Review tests pass
  </done>
</task>

</tasks>

<verification>

**Migration Verification:**
```bash
# After migration runs, verify schema
rails db:schema:dump
grep -A3 "create_table \"users\"" db/schema.rb | grep consent
```

**Expected Output:**
```
t.boolean "public_name_consent", default: false, null: false
t.boolean "display_full_name_consent", default: false, null: false
t.boolean "review_name_consent", default: false, null: false
t.boolean "lgpd_name_consent", default: false, null: false
t.boolean "show_full_name", default: false, null: false
```

**Model Tests:**
```bash
rails test test/models/user_test.rb
rails test test/models/review_test.rb
```

**Integration Check:**
```bash
# In Rails console:
user = User.new
user.public_name_consent? # => false
review = Review.new(reviewer_user: user, rating: 5)
review.anonymized_reviewer_name # => "F. L." or "Anônimo"
```

</verification>

<success_criteria>

- [x] Migration file created and runnable (`rails db:migrate` passes)
- [x] All 5 consent columns added to users table with default: false
- [x] User model methods implemented (getters, validators, defaults to false)
- [x] Review model anonymization logic working (consent-aware display)
- [x] Self-review prevention validation added to Review
- [x] Comment-or-criteria validation added to Review
- [x] All existing Review and User tests pass
- [x] Schema matches expected structure (verified via db:schema:dump)
- [x] Backward compatible (nil values treated as false)

</success_criteria>

<output>

After completion, create `.planning/phases/05-phase-5-reviews-premium-reputacao/05-ETAPA-1-SUMMARY.md` with:
- Migration timestamp and name
- Schema changes applied
- User model methods added (list)
- Review model methods added (list)
- Test results (pass/fail count)
- Blockers resolved (yes/no)
- Ready for Etapa 2 (yes/no)

</output>

---

# PHASE 5: COMPLETE IMPLEMENTATION ROADMAP

## Overview

Phase 5 implements Reviews Premium + ReviewCaptureFlow + Reputação across **10 etapas** with plan-based execution. This document outlines the full roadmap; individual PLAN.md files will be created for each wave of execution.

**Timeline:** Etapa 1 (Wave 1) → Etapa 2-3 (Wave 2, parallel) → Etapa 4-5 (Wave 3) → Etapa 6-7 (Wave 4) → Etapa 8-10 (Wave 5)

---

## Etapa 1: LGPD Consent Schema Migration ✅ PLANNING

**Status:** This PLAN (05-PLAN-01.md) covers Etapa 1.

**Objective:** Add missing user consent fields before any code changes.

**Tasks:**
- [x] Task 1.1: Create migration for user consent fields
- [x] Task 1.2: Add validations to User model
- [x] Task 1.3: Update Review model to use consent fields

**Dependencies:** None (Phase 4 unaffected)

**Wave Assignment:** Wave 1

---

## Etapa 2: ReviewCaptureFlow MVP (Backend)

**Objective:** Create review submission flow with basic validation.

**Tasks:**
- [ ] Task 2.1: Update Review model validations
- [ ] Task 2.2: Create ReviewCaptureFlow state machine (pending/approved/rejected/flagged)
- [ ] Task 2.3: Create API endpoint POST /api/v1/reviews
- [ ] Task 2.4: Add ReviewsController tests (3+ scenarios)

**Database Changes:**
- Add column: `capture_flow_source` to reviews (profile | lead | chat)

**Completion Criteria:**
- POST /api/v1/reviews endpoint created
- Review enters pending state by default
- All field validations working (rating 1-5, comment max 500)
- API tests passing

**Dependencies:** Etapa 1 (consent fields)

**Wave Assignment:** Wave 2

---

## Etapa 3: Moderação e Antifraude Básica (Backend)

**Objective:** Implement tiered moderation with auto-approval logic.

**Tasks:**
- [ ] Task 3.1: Create ReviewModerationService (auto_approve_if_trusted_reviewer?, flag_suspicious_review?, detect_self_review?)
- [ ] Task 3.2: Create ReviewDecisionService (approve_review, reject_review, flag_review + audit logs)
- [ ] Task 3.3: Create ModeratorDashboardController (admin API endpoints)
- [ ] Task 3.4: Add fraud detection validations (PII, self-review, spam)

**Services Created:**
- `ReviewModerationService` — Auto-approval + fraud detection
- `ReviewDecisionService` — Moderation actions (approve/reject/flag)
- `ReviewDecisionLog` — Audit trail for all decisions

**Completion Criteria:**
- ReviewModerationService created with 3+ detection methods
- Auto-approval logic: returning reviewers auto-approved
- Admin endpoints created (GET /api/v1/admin/reviews/pending, PATCH approve/reject/flag)
- Fraud detection tests passing (PII, self-review, spam)

**Dependencies:** Etapa 2 (review submission)

**Wave Assignment:** Wave 2 (parallel with Etapa 2)

---

## Etapa 4: Exibição Pública no Perfil da Empresa (Frontend)

**Objective:** Display approved reviews on company profile with reputation badge.

**Tasks:**
- [ ] Task 4.1: Create ReviewList component (approved reviews only, pagination, sorting)
- [ ] Task 4.2: Update CompanyProfile page (add ReviewList, show review count + avg rating)
- [ ] Task 4.3: Create ReviewAggregate display (avg rating + star distribution + category breakdowns)
- [ ] Task 4.4: Create reputation badge component (0-100 score + tier label + color)

**Frontend Components:**
- `ReviewList` — List of approved reviews with pagination
- `ReviewAggregate` — Aggregated stats display
- `ReputationBadge` — Tier-based badge with tooltip breakdown

**Completion Criteria:**
- ReviewList renders approved reviews only
- Reputation badge displays on profile (correct color mapping)
- CTA "Avaliar Agora" button present (links to form)
- Anonymization working (no full names without consent)

**Dependencies:** Etapa 3 (moderation so reviews published)

**Wave Assignment:** Wave 3

---

## Etapa 5: Reply de Empresas Essential+ (Backend & Frontend)

**Objective:** Enable company replies to reviews (Essential+ feature).

**Tasks:**
- [ ] Task 5.1: Create CompanyReply model (review_id, company_id, reply_text max 300 chars)
- [ ] Task 5.2: Add reply endpoint POST /api/v1/companies/{id}/reviews/{review_id}/reply (Essential+ gate)
- [ ] Task 5.3: Add reply display on Review (frontend component)
- [ ] Task 5.4: Create test scenarios (plan gating, immediate publish, one reply per review)

**Database Changes:**
- Create `company_replies` table (id, review_id, company_id, reply_text, created_at)

**Completion Criteria:**
- CompanyReply model + table created
- POST endpoint gated to Essential+ plans
- Reply displays below review on profile
- Tests passing (permission + display)

**Dependencies:** Etapa 4 (reviews displayed), Etapa 3 (moderation)

**Wave Assignment:** Wave 3 (parallel with Etapa 4)

---

## Etapa 6: Reputation Badge e Score (Backend & Frontend)

**Objective:** Display numeric reputation score + tier badge.

**Tasks:**
- [ ] Task 6.1: Integrate CompanyTrustScore into review display (verify already calculated)
- [ ] Task 6.2: Create ReputationTier model/helper (tier_for_score, color_for_tier)
- [ ] Task 6.3: Create ReputationBadgeComponent (display score + tier + breakdown tooltip)
- [ ] Task 6.4: Update CompanyProfile (place badge, add breakdown modal, test color mapping)

**Services & Helpers:**
- `ReputationTier` helper — Score to tier mapping (5 tiers)
- `ReputationBadgeComponent` — React component with tooltip

**Completion Criteria:**
- ReputationTier helper created + tested
- ReputationBadgeComponent renders correctly
- Hover tooltip shows breakdown (reviews 40%, rating 30%, verification 20%, engagement 10%)
- Correct color mapping (5 tiers)

**Dependencies:** Etapa 4 (reviews displayed), existing TrustScore

**Wave Assignment:** Wave 4

---

## Etapa 7: Dashboard Básico/Premium (Backend & Frontend)

**Objective:** Create company dashboard with plan-based feature gating.

**Tasks:**
- [ ] Task 7.1: Create CompanyDashboardController (GET /dashboard/reviews, plan-based scoping)
- [ ] Task 7.2: Create dashboard data service (DashboardDataService — free/pro/enterprise tiers)
- [ ] Task 7.3: Create dashboard frontend pages (free/pro/enterprise views)
- [ ] Task 7.4: Add feature gating (company.plan.tier → determines view, 403 on unauthorized access)

**API Endpoints:**
- GET /dashboard/reviews — Returns dashboard data per plan tier

**Dashboard Tiers:**
- **Free:** Total reviews, avg rating, distribution histogram, pending queue
- **Pro:** + Response rate %, strongest/weakest criteria, trend chart, alerts
- **Enterprise:** + Regional metrics, service type breakdown, export button, market comparison

**Completion Criteria:**
- DashboardDataService created with plan-based scoping
- Free/Pro/Enterprise dashboard pages render
- Feature gating working (no permission bypass)
- All data sources responsive (no N+1 queries)

**Dependencies:** Etapa 5 (replies for response rate), existing plan system

**Wave Assignment:** Wave 4 (parallel with Etapa 6)

---

## Etapa 8: Integração Controlada com CompanyRecommendationAgent (Backend)

**Objective:** Integrate reputation into ranking (30% weight).

**Tasks:**
- [ ] Task 8.1: Update CompanyRecommendationAgent scoring (new formula with reputation 30%)
- [ ] Task 8.2: Create reputation score calculation (reuse existing trust_score)
- [ ] Task 8.3: Add feature flag for ranking change (reputation_impacts_ranking, default false)
- [ ] Task 8.4: Implement cache to prevent churn (daily recalc, not real-time)

**Feature Flag:**
- `reputation_impacts_ranking` (default: false, enable after UAT)

**New Scoring Formula:**
- Old: lead_conversion (50%) + recency (25%) + engagement (25%)
- New: reputation (30%) + lead_conversion (30%) + recency (20%) + engagement (20%)

**Ranking Adjustments:**
- Min threshold: Companies < 5 reviews use reputation at 0.20 weight (lower confidence)
- Cold start: New companies (0 reviews) = reputation_score 50 (neutral)
- Cache: recommendation_score recalculated daily (02:00 UTC), not real-time

**Completion Criteria:**
- CompanyRecommendationAgent scoring updated
- Feature flag implemented
- Cache logic prevents real-time churn
- Tests passing (weight mapping, cold-start)

**Dependencies:** Etapa 6 (reputation score ready)

**Wave Assignment:** Wave 5

---

## Etapa 9: Eventos PostHog Seguros (Backend)

**Objective:** Track review lifecycle without sending PII.

**Tasks:**
- [ ] Task 9.1: Define safe events (review_started, review_submitted, review_approved, review_rejected, review_flagged, company_reply_submitted)
- [ ] Task 9.2: Create safe event payload schema (strip PII: comment, name, email, phone, CPF, address)
- [ ] Task 9.3: Add PostHog event capture (ReviewsController, ReviewModerationService, CompanyReplyController)
- [ ] Task 9.4: Create event testing (verify no PII in payloads, mock PostHog client)

**Safe Event Payload:**
- Forbidden: comment text, reviewer name, email, phone, CPF, address
- Allowed: company_id, rating (1-5), source (profile|lead|chat), status, criteria_count, has_comment (bool), comment_length_bucket, trust_score_bucket, service_type, state, plan_type

**Events Tracked:**
1. review_started — User opens form
2. review_submitted — User submits (rating, criteria_count, source)
3. review_approved — Moderator approves
4. review_rejected — Moderator rejects
5. review_flagged — System flags suspicious
6. company_reply_submitted — Company replies

**Completion Criteria:**
- 6+ events defined (no PII)
- PostHog client sanitizes payloads
- Events tracked in controllers
- Tests verify no PII leakage

**Dependencies:** Etapa 2-5 (features to track)

**Wave Assignment:** Wave 5

---

## Etapa 10: Testes e Critérios de Aceite (All)

**Objective:** Validate entire Phase 5 flow end-to-end.

**Tasks:**
- [ ] Task 10.1: Create acceptance test scenarios (5+ flows: submit, auto-approve, reply, dashboard, ranking)
- [ ] Task 10.2: Create integration tests (full flow: submit → moderation → aggregation → display → ranking)
- [ ] Task 10.3: Create dashboard tests (free/pro/enterprise access control)
- [ ] Task 10.4: Create moderation queue tests (flagged display, admin actions, decision logs)

**Acceptance Scenarios:**
1. User submits review → pending → auto-approved (returning reviewer) → displays on profile
2. New user submits → flagged → admin approves → displays + impacts ranking
3. Essential+ company replies → reply displays immediately
4. Free company tries reply → 403 error
5. Company tries self-review → flagged + prevented

**Completion Criteria:**
- 5+ acceptance scenarios passing
- Integration test covers full flow
- Dashboard access control verified
- Moderation queue functional
- No PII in logs/events

**Dependencies:** All prior etapas

**Wave Assignment:** Wave 5

---

## Database Migrations Summary

| Migration | Etapa | File | Purpose |
|-----------|-------|------|---------|
| Add review consent fields | 1 | `20260601_add_review_consent_fields_to_users.rb` | LGPD compliance |
| Add capture_flow_source | 2 | `20260602_add_capture_flow_source_to_reviews.rb` | Track entry point |
| Create company_replies | 5 | `20260605_create_company_replies.rb` | Reply storage |

---

## Feature Flags Summary

| Flag | Etapa | Default | Purpose | Gate |
|------|-------|---------|---------|------|
| `reputation_impacts_ranking` | 8 | false | Enable/disable new ranking formula | Phased rollout |
| `review_moderation_enabled` | 3 | true | Enable automated moderation | Kill switch |
| `company_reply_feature_enabled` | 5 | false | Enable company replies | Post-UAT |

---

## API Endpoints Summary

| Endpoint | Method | Etapa | Auth | Status | Gate |
|----------|--------|-------|------|--------|------|
| `/api/v1/reviews` | POST | 2 | user | new | Public |
| `/api/v1/admin/reviews/pending` | GET | 3 | admin | new | Admin only |
| `/api/v1/admin/reviews/{id}/approve` | PATCH | 3 | admin | new | Admin only |
| `/api/v1/admin/reviews/{id}/reject` | PATCH | 3 | admin | new | Admin only |
| `/api/v1/companies/{id}/reviews/{review_id}/reply` | POST | 5 | company_user | new | Essential+ |
| `/dashboard/reviews` | GET | 7 | company_user | new | Company |

---

## Wave Assignment & Execution Order

```
WAVE 1 (Etapa 1):
├─ Schema migration + consent fields
└─ Blocker resolution (enable downstream etapas)

WAVE 2 (Etapa 2 + 3, parallel):
├─ Review submission form + validation
└─ Moderation service + fraud detection

WAVE 3 (Etapa 4 + 5, parallel):
├─ Public review display + reputation badge
└─ Company reply feature (Essential+ gate)

WAVE 4 (Etapa 6 + 7, parallel):
├─ Reputation tier system + badge display
└─ Dashboard + plan-based feature gating

WAVE 5 (Etapa 8 + 9 + 10, sequential):
├─ Ranking integration + reputation weighting
├─ PostHog event tracking (PII-safe)
└─ Acceptance + integration tests
```

---

## Risks & Mitigation

| Risk | Severity | Mitigation | Etapa |
|------|----------|-----------|-------|
| Moderation queue overload | MEDIUM | Start with auto-approval; scale if queue > 100 pending | 3 |
| PII leakage to PostHog | HIGH | All events sanitized + reviewed in tests | 9 |
| Ranking churn from reputation | MEDIUM | Cache scores (daily recalc, not real-time) | 8 |
| New companies invisible | LOW | Cold-start score = 50 (neutral); weight scaling for < 5 reviews | 8 |
| Consent migration rollback | LOW | Migration includes down method; no data loss on revert | 1 |

---

## Success Criteria (Phase 5 Complete)

- [ ] ReviewCaptureFlow MVP functional (profile entry point working)
- [ ] Moderation queue clearing in < 24h (95% SLA met)
- [ ] Zero PII in PostHog events (audited + tested)
- [ ] Reputation badge displays + tier mapping correct
- [ ] Company dashboard access control working (no permission bypass)
- [ ] Ranking integration feature-flagged (off by default, UAT before enable)
- [ ] All acceptance tests passing (5+ flows verified)
- [ ] No Phase 4 regressions (Knowledge Base, Support Agent, LeadSync unaffected)
- [ ] LGPD consent compliance verified (audit log present)

---

## Rollback Plan

**If critical issues found during UAT:**

```bash
# 1. Disable reputation ranking
Feature.disable(:reputation_impacts_ranking)

# 2. Disable company replies
Feature.disable(:company_reply_feature_enabled)

# 3. Disable moderation
Feature.disable(:review_moderation_enabled)

# 4. All reviews hold in pending (manual review only)
# Reviews::ModerationService.auto_approve_if_trusted_reviewer = false

# 5. Investigate + fix + re-enable one etapa at a time
```

**Data Preservation:**
- All review data retained; no deletion needed
- Only status changes (pending/approved/flagged)
- Decision logs preserved (audit trail intact)
- Consent data immutable (migration includes down)

---

## Next Steps

**Immediate:**
1. ✅ Execute Etapa 1 (this PLAN) — LGPD migration
2. Execute Etapa 2-3 (Wave 2) — Review submission + moderation
3. Execute Etapa 4-5 (Wave 3) — Display + replies
4. Execute Etapa 6-7 (Wave 4) — Reputation badge + dashboard
5. Execute Etapa 8-10 (Wave 5) — Ranking integration + tests

**Parallel:**
- UI design: ReviewCaptureFlow form (single-step mobile UX)
- UI design: ModeratorDashboardController (admin panel)
- UI design: ReputationBadgeComponent (tier colors + tooltip)
- UI design: DashboardDataService views (free/pro/enterprise layouts)
- Performance: Database query optimization (reputation dashboard)
- Security: PII sanitization audit (PostHog events)

---

**Status:** 🟢 READY FOR EXECUTION

All locked decisions from discussion phase incorporated. Dependencies mapped. Wave structure optimized for parallelism. Ready to execute Etapa 1 → Etapa 2-3 → ... → Etapa 10.


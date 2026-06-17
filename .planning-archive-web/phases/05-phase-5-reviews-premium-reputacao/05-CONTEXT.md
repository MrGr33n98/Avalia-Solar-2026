# PHASE 5: Reviews Premium + ReviewCaptureFlow + Reputação
## Context & Implementation Decisions

**Date:** 2026-06-01  
**Status:** DISCUSSED  
**Project:** Avalia Solar / MobiVolt AI  
**Phase:** 5 of 8  

---

## Domain

**Phase Goal:** Transform reviews into the central asset of the Avalia Solar marketplace by implementing reputation tracking, premium review features, and intelligent review capture flow.

**Capability Delivered:**
- Review collection flow (ReviewCaptureFlow) with multi-trigger entry points
- Reputation scoring & tiering system for companies
- Premium features gating (review response, featured reviews, analytics dashboard)
- Moderation workflow with PII sanitization and fraud detection
- Company reputation dashboard with tier-specific features
- Integration with CompanyRecommendationAgent for ranking impact

**Jornadas Covered:**
1. Review & Reputação (customer perspective)
2. Pós-venda & Retenção (post-lead feedback loop)
3. Backoffice / Dashboard da Empresa (company reputation management)
4. Inteligência de Dados (reputation trends, marketplace insights)

---

## Key Decisions

### 1. ReviewCaptureFlow Entry Points & Triggers

**Decision:** Multi-trigger model with three entry points.

**Triggers:**
- **Profile-driven:** "Avaliar Agora" CTA on company profile → `/companies/[id]/review`
- **Lead-driven:** After lead submission, user prompted: "Share feedback about this company?"
- **Chat-driven:** MobiVolt AI Support Agent suggests review with context

**Approval Before Prompt:** User must have interacted with company (viewed profile, sent lead, or chatted).

---

### 2. Review Moderation & Approval Model

**Decision:** Tiered moderation — auto-approval for returning reviewers, manual review for flagged content.

**Rules:**
- All reviews enter `pending` by default
- Auto-approve if: user has prior approved review from same company (trust signal)
- Flag for manual review if: PII detected, offensive language, self-review, spam signals, or length anomalies
- Only `approved` reviews affect trust score calculations
- Flagged reviews do not impact ranking until manually approved

---

### 3. Reputation Tier Display & Messaging

**Decision:** Dual display — numeric score (0-100) + color-coded tier badge + interactive breakdown.

**Tier Mapping:**
- 0-39: 🔴 **Crítica** — Needs improvement
- 40-59: 🟡 **Fraca** — Below average  
- 60-75: 🟢 **Boa** — Solid reputation
- 76-90: 💚 **Excelente** — Highly trusted
- 91-100: ⭐ **Excepcional** — Top-tier

**Display:** Badge + hover tooltip showing breakdown (reviews %, rating %, verification %, engagement %).

---

### 4. Premium Review Features Tier Breakdown

**Feature Ladder:**

| Feature | Free | Essential | Pro | Enterprise |
|---------|------|-----------|-----|------------|
| Receive reviews | ✅ | ✅ | ✅ | ✅ |
| Public reputation badge | ✅ | ✅ | ✅ | ✅ |
| Reply to reviews | ❌ | ✅ | ✅ | ✅ |
| Featured reviews (max 5) | ❌ | ❌ | ✅ | ✅ |
| Response analytics | ❌ | ❌ | ✅ | ✅ |
| Reputation dashboard | ❌ | ❌ | ✅ | ✅ |
| Review alerts | ❌ | ❌ | ✅ | ✅ |
| Custom report export | ❌ | ❌ | ❌ | ✅ |

---

### 5. Review Content Validation & Field Requirements

**Decision:** Lightweight form prioritizing mobile completion.

**Required:**
- `rating` (1-5 stars)
- At least one: comment OR criterion score

**Optional:**
- `comment` (max 500 chars)
- `criteria_scores` (5 dimensions with progressive disclosure)
- `headline` (max 100 chars)

**UX Pattern:** Star rating → progressive disclosure of optional fields.

---

### 6. Reputation Ranking Impact & Weighting

**Decision:** Use existing CompanyTrustScore (0-100) integrated into recommendation ranking.

**Formula:** No new calculation. Integrate existing trust_score into CompanyRecommendationAgent:
- `reputation (30%) + lead_conversion (30%) + recency (20%) + engagement (20%)`

**Fraud Prevention:**
- Flagged reviews do not impact score
- IP-based detection for coordinated spam (10+ reviews from same IP in 24h → all flagged)
- Duplicate reviewers blocked at submission

---

### 7. Company Response/Reply Feature

**Decision:** Response available in Essential+ plans only.

**Mechanics:**
- Company replies to approved reviews (1:1)
- Reply published immediately (no moderation)
- Max 300 chars per reply
- Shown directly under review on profile

---

### 8. ReviewCaptureFlow UX & Steps

**Decision:** Single-step mobile-optimized form with progressive disclosure.

**Steps:**
1. Star rating selection (required)
2. Quick feedback (optional, contextual prompt)
3. Consent & authorization
4. Success confirmation

**Mobile:** Full-screen form; sticky submit button.  
**Desktop:** Centered modal (600px).  
**Target:** <1min completion on 4G.

---

### 9. Reputation Dashboard for Companies

**Decision:** Tiered analytics access by plan.

**Free Plan:**
- Overall rating + review count
- Recent reviews (last 10)
- Star distribution histogram
- Pending review count

**Pro Plan (Adds):**
- Response rate & average response time
- Strongest/weakest criteria
- 12-month trend chart
- Negative review alerts

**Enterprise (Adds):**
- Regional breakdown
- Service type breakdown
- PDF/Excel export
- Market comparison

---

### 10. Reputation Impact on Ranking & Recommendation

**Decision:** Reputation is a ranking factor immediately (not delayed).

**CompanyRecommendationAgent Integration:**
- Weight: 30% (alongside lead conversion 30%, recency 20%, engagement 20%)
- Minimum threshold: Companies < 5 reviews use reputation at 0.20 weight (lower confidence)
- Cold start: New companies (no reviews) = reputation_score 50 (neutral baseline)
- Low reputation (< 40) companies NOT hidden; ranked proportionally

---

## Code & Codebase Context

### Existing Infrastructure (Reusable)

1. **Review Model (V2):** Complete with granular criteria
   - `AB0-1-back/app/models/review.rb`

2. **Reviews::AggregationService:** Async calculation of averages
   - `AB0-1-back/app/services/reviews/aggregation_service.rb`

3. **CompanyTrustScore:** 0-100 reputation (already integrated)
   - `AB0-1-back/app/services/trust_score/calculation_service.rb`

4. **PostHog Integration:** Live telemetry with PII sanitization
   - `AB0-1-back/app/services/analytics/post_hog_service.rb`

5. **Plan Feature Gating:** Free/Essential/Pro/Enterprise tier system
   - `AB0-1-back/app/models/plan_feature_catalog.rb`

### Canonical References

| Reference | Purpose |
|-----------|---------|
| ROADMAP.md | Phase 5 scope & goals |
| Phase 4 UAT Report | Knowledge Base + Support Agent final state |
| Review Model (`review.rb`) | Core schema & validations |
| Aggregation Service | Review scoring calculation |
| Trust Score Service | Company reputation calc |
| PostHog Service | Event tracking pattern |

### Reusable Patterns

1. **Decision Log Pattern** (Review::ReviewDecisionLog) → ReviewCaptureFlow tracking
2. **Async Aggregation** (AggregationJob) → Reputation score updates
3. **PostHog Event Capture** → ReviewCaptureFlow telemetry
4. **Plan Feature Gating** → Pro/Enterprise access control

---

## Out of Scope (Phase 5)

- Advanced sentiment analysis (Phase 8)
- pgvector + embeddings (Phase 8)
- Real media/photo uploads (Phase 8)
- CRM integrations (future)
- Data Intelligence dashboard (Phase 8+)
- Custom certifications (Phase 7+)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Fake reviews inflate scores | Auto-approve only for returning reviewers; IP-based fraud detection |
| Moderation becomes bottleneck | Start with auto-approval tier; scale human review if queue > 100 |
| LGPD consent fields missing | **BLOCKER:** Add migration for user consent fields before Phase 5 code review |
| Reputation churn | Smooth weighting for < 5 reviews; cache recommendation scores (daily recalc) |

---

## Success Criteria (Preliminary)

**Functional:**
- ✅ Review form submits with rating + optional comment/criteria
- ✅ Reviews moderated or auto-approved within 24h
- ✅ Trust score (0-100) displays with tier badge on profile
- ✅ Pro companies can reply + see analytics
- ✅ Reputation impacts ranking (30% weight)

**Quality:**
- ✅ Zero PII in PostHog events
- ✅ 95% reviews moderated within 24h
- ✅ Mobile form abandonment < 40%

**Business:**
- ✅ 50% increase in review requests (via prompts)
- ✅ 20% increase in Essential-tier upgrades

---

## Next Steps

**Immediate:**
1. Create SPEC.md (requirements lock)
2. Run `/gsd-plan-phase 5`
3. Run `/gsd-ui-phase 5` (ReviewCaptureFlow form design)

**Parallel:**
4. LGPD consent migration (Phase 4 blocker)
5. Moderation queue UX design
6. Database performance optimization (reputation dashboard queries)

---

## Notes

**Language:** Portuguese (Brasil)  
**Mobile Target:** <1min completion on 4G  
**Moderation SLA:** 24h or auto-publish  
**Score Cache:** 1h (prevent real-time ranking churn)  
**Data Retention:** Reviews archived after 5 years; decision logs kept indefinitely


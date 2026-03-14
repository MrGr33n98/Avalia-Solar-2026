# Trust Dashboard Architecture — AvaliaSolar TaaS Platform

**Document Version:** 1.0  
**Date:** 2026-03-14  
**Author:** Architect Agent  
**Status:** Phase A — Architecture Analysis Complete  
**Phase:** A → B → C (Architecture → Backend Implementation → AGENTS.md Update)

---

## Executive Summary

This document defines the complete architecture redesign for the AvaliaSolar Trust Dashboard, repositioning the platform from a generic solar marketplace to a **Trust as a Service (TaaS)** business model. The Trust Score becomes the primary KPI, with all dashboard metrics orbiting around trust-building activities rather than lead conversion.

### Key Findings

1. **Two Different Trust Score Calculations** — Critical inconsistency between batch worker (Sidekiq) and inline widget calculation
2. **Intent Score Migrations Not Applied** — Sophisticated scoring service exists but tables don't exist in database
3. **TrustScoreRecalculationWorker is a Stub** — Reviews don't affect Trust Score in real-time
4. **CompetitorBenchmark Uses Mock Data** — Despite real backend API with RankingService

---

## 1. Business Context: Trust as a Service (TaaS)

### 1.1 Core Value Proposition

AvaliaSolar is NOT just a solar energy marketplace. It is a **trust verification platform** that:

- **Validates** solar companies through rigorous verification processes
- **Certifies** quality through badges and verifiable credentials
- **Ranks** companies based on transparent, algorithm-driven trust scores
- **Generates qualified leads** as a byproduct of trust signals

### 1.2 Dashboard Hierarchy Redesign

The current dashboard prioritizes leads and conversions. The new TaaS-oriented hierarchy should be:

| Priority | Metric Category | Description |
|----------|-----------------|-------------|
| 1 | **Trust Score** | Central KPI — composite score 0-100 |
| 2 | **Reputation/Reviews** | Aggregate ratings, review count, criteria breakdown |
| 3 | **Badges/Certifications** | Verifiable credentials, certification progress |
| 4 | **Buyer Intent** | Lead scoring, intent signals, engagement tracking |
| 5 | **Commercial Performance** | Leads, conversions, CTA clicks |
| 6 | **Market Position** | Rankings, percentiles, Magic Quadrant |

---

## 2. Current Architecture Analysis

### 2.1 Trust Score: Two Sources of Truth (CRITICAL BUG)

#### Source 1: Analytics::TrustScoreWorker (Sidekiq Batch)

**File:** `AB0-1-back/app/workers/analytics/trust_score_worker.rb`

```ruby
# Formula: (leads * 0.3) + (engagement * 0.1) - (anomalies * 5)
# Data source: company_feature_rolling_30d view + company_anomaly_daily table
# Output: company_trust_score table (score 0-100, components jsonb)
```

- Runs as scheduled Sidekiq job
- Uses advisory lock for concurrency
- Stores result in `company_trust_score` table
- Components: `{ leads, engagement, penalty }`

#### Source 2: WidgetDataController (Inline Calculation)

**File:** `AB0-1-back/app/controllers/api/v1/widget_data_controller.rb`

```ruby
# Formula: 50 + (verified? 20 : 0) + (rating/5 * 20) + min(reviews/100 * 10, 10)
# Calculated on-the-fly per request
# NOT stored — different result than batch worker
```

**Problem:** These two formulas produce different Trust Scores for the same company. Widget displays a different score than dashboard.

**Solution:** Unify to single source of truth using the stored `company_trust_score` table, enhanced with verification and rating components.

### 2.2 TrustScoreRecalculationWorker: Stub Implementation

**File:** `AB0-1-back/app/workers/trust_score_recalculation_worker.rb`

```ruby
def perform(review_id)
  review = Review.find_by(id: review_id)
  return unless review
  Rails.logger.info "[TrustScoreRecalculationWorker] Recalculating for review #{review_id}"
  # Logic will be implemented in future stories  ← STUB
end
```

**Problem:** Triggered after review creation but does nothing. Reviews don't update Trust Score in real-time.

**Solution:** Implement actual recalculation logic that incorporates review metrics into Trust Score.

### 2.3 Intent Score: Sophisticated Service, No Database Tables

**Service:** `AB0-1-back/app/services/intent_scoring_service.rb`

- 4 signal categories: micro_interaction, research_intent, financial_intent, contact_intent
- Decay half-life: 7 days (score halves every week)
- Confidence scoring: signal count, diversity, recency, consistency
- 6 intent levels: cold → warm → hot → boiling → immediate → declared
- SLA windows per level
- Top 10 signals extraction

**Model:** `AB0-1-back/app/models/intent_score.rb`

- 6 intent levels with helper methods
- Recommended action per level
- SLA window per level
- Thermometer emoji representation
- History tracking

**Migrations (NOT APPLIED):**

| Migration File | Status |
|---------------|--------|
| `20260310051917_create_buyer_intent_activities.rb` | NOT MIGRATED |
| `20260310160000_create_intent_scores.rb` | NOT MIGRATED |
| `20260310160200_create_intent_score_histories.rb` | NOT MIGRATED |
| `20260310160201_add_intent_subscription_to_companies.rb` | NOT MIGRATED |

**Schema Missing:** `intent_scores`, `intent_score_histories`, `buyer_intent_activities` tables don't exist in database.

### 2.4 CompetitorBenchmark: Mock Data Despite Real API

**Frontend:** `AB0-1-front/app/dashboard/components/CompetitorBenchmark.tsx` (368 lines)

- Uses hardcoded mock data array
- Frontend manually constructs competitor list

**Backend:** `AB0-1-back/app/services/company_dashboard/ranking_service.rb`

- `competitors_for_quadrant` method returns real company data
- Calculates vision score (Trust + Rating weighted)
- Calculates execution score (Leads + Clicks + Views weighted)
- Returns top 15 companies with real metrics

**Problem:** Frontend ignores backend and uses mock data.

---

## 3. Target Architecture

### 3.1 Unified Trust Score Calculation

**Single Source of Truth:** `company_trust_score` table

**Enhanced Formula (New):**

```
Trust Score = Base(50) + Verification(20) + Rating(20) + Reviews(10) + Engagement(10) + LeadVolume(10) - AnomalyPenalty
```

**Components Stored:**

```json
{
  "base": 50,
  "verification": 20,
  "rating": 15,
  "reviews": 8,
  "engagement": 7,
  "leads": 5,
  "penalty": 0,
  "total": 105  // capped at 100
}
```

**Implementation:**

1. Create `TrustScore::CalculationService` — unified calculation logic
2. Use in both `TrustScoreWorker` (batch) and `WidgetDataController` (real-time)
3. Store all components in `company_trust_score.components` jsonb

### 3.2 Real-Time Trust Score Updates

**Enhanced TrustScoreRecalculationWorker:**

```ruby
class TrustScoreRecalculationWorker
  def perform(company_id, trigger: 'review')
    company = Company.find(company_id)
    service = TrustScore::CalculationService.new(company)
    result = service.calculate!
    
    CompanyTrustScore.upsert!(
      company_id: company.id,
      score: result[:score],
      components: result[:components],
      computed_at: Time.current
    )
    
    # Trigger webhook if score changed significantly
    notify_score_change(company, result) if result[:score_changed]
  end
end
```

**Triggers:**

- Review created/approved (primary)
- Company verification status changed
- Badge awarded/revoked
- Manual recalculation requested

### 3.3 Intent Score Database Migration

**Required Migrations:**

```ruby
# 1. buyer_intent_activities
create_table :buyer_intent_activities do |t|
  t.references :company, null: false
  t.bigint :user_id
  t.string :anonymous_id
  t.string :session_id
  t.string :signal_type
  t.string :signal_category
  t.float :intent_weight
  t.string :page_path
  t.integer :duration_ms
  t.datetime :tracked_at
  t.boolean :hot_signal, default: false
  t.timestamps
end

# 2. intent_scores
create_table :intent_scores do |t|
  t.references :company, null: false
  t.references :lead, foreign_key: { to_table: :users }
  t.string :anonymous_id
  t.integer :total_score, default: 0
  t.string :intent_level
  t.integer :micro_interaction_score, default: 0
  t.integer :research_intent_score, default: 0
  t.integer :financial_intent_score, default: 0
  t.integer :contact_intent_score, default: 0
  t.integer :total_signals_count, default: 0
  t.integer :hot_signals_count, default: 0
  t.integer :unique_sessions_count, default: 0
  t.integer :unique_pages_count, default: 0
  t.datetime :first_interaction_at
  t.datetime :last_interaction_at
  t.datetime :last_hot_signal_at
  t.integer :days_active, default: 0
  t.float :decay_factor, default: 1.0
  t.float :confidence_score, default: 0.0
  t.jsonb :score_breakdown
  t.jsonb :top_signals, array: true
  t.timestamps
end

# 3. intent_score_histories
create_table :intent_score_histories do |t|
  t.references :intent_score, null: false
  t.integer :score_before
  t.integer :score_after
  t.string :level_before
  t.string :level_after
  t.string :change_reason
  t.jsonb :score_breakdown
  t.string :triggered_by
  t.timestamps
end
```

### 3.4 Dashboard API Endpoints (New/Modified)

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/company_dashboard/trust_health` | GET | Trust Score breakdown with health indicators | NEW |
| `/api/v1/company_dashboard/intent_summary` | GET | Intent score aggregate + top leads | NEW |
| `/api/v1/company_dashboard/certification_progress` | GET | Badge progress, pending verifications | NEW |
| `/api/v1/company_dashboard/reputation` | GET | Already exists — add criteria breakdown | ENHANCE |
| `/api/v1/company_dashboard/ranking` | GET | Already exists — connect Magic Quadrant to real data | FIX |

### 3.5 Frontend Dashboard Component Mapping

| Component | Data Source | Status |
|-----------|-------------|--------|
| TrustScoreCard | `trust_health` endpoint | NEW |
| ReputationOverview | `reputation` endpoint | EXISTS — enhance |
| BadgesPanel | `certification_progress` endpoint | EXISTS — enhance |
| BuyerIntentWidget | `intent_summary` endpoint | NEW |
| MagicQuadrantChart | `ranking` → `magic_quadrant_competitors` | FIX — use real data |
| CompetitorBenchmark | `ranking` → `magic_quadrant_competitors` | FIX — use real data |
| LeadsConversionCard | `analytics_overview` → `leads` | EXISTS |
| MarketPositionCard | `ranking` → `percentile` | EXISTS |

---

## 4. Implementation Roadmap

### Phase B: Backend Implementation

#### B.1 Unify Trust Score Calculation

- [ ] Create `TrustScore::CalculationService`
- [ ] Update `TrustScoreWorker` to use service
- [ ] Update `WidgetDataController` to query stored score
- [ ] Add tests for calculation consistency

#### B.2 Implement TrustScoreRecalculationWorker

- [ ] Add real recalculation logic
- [ ] Connect to Review approval callbacks
- [ ] Add significant change detection
- [ ] Add webhook notification trigger

#### B.3 Run Intent Score Migrations

- [ ] Run pending migrations: `20260310051917`, `20260310160000`, `20260310160200`, `20260310160201`
- [ ] Verify tables in schema.rb
- [ ] Add model validations
- [ ] Test IntentScoringService with real data

#### B.4 Create New Endpoints

- [ ] `GET /api/v1/company_dashboard/trust_health`
- [ ] `GET /api/v1/company_dashboard/intent_summary`
- [ ] `GET /api/v1/company_dashboard/certification_progress`
- [ ] Enhance existing `/reputation` with criteria breakdown

#### B.5 Fix CompetitorBenchmark

- [ ] Remove mock data from CompetitorBenchmark.tsx
- [ ] Connect to `ranking` → `magic_quadrant_competitors`
- [ ] Add loading/error states

### Phase C: Documentation Update

- [ ] Rewrite `AGENTS.md` with TaaS context
- [ ] Include AS-EDS design system rules
- [ ] Document API patterns and conventions
- [ ] Add dashboard component standards

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Trust Score formula change breaks existing scores | High | Version the score, maintain backward compatibility |
| Intent migrations conflict with existing data | Medium | Run in staging first, backup production |
| Magic Quadrant performance with 100+ companies | Medium | Add pagination, limit to top 50 |
| Webhook spam on score fluctuations | Low | Add threshold for notifications (>5 points) |

---

## 6. Appendix: Existing Assets Reference

### Backend Services

| Service | File | Purpose |
|---------|------|---------|
| ReputationService | `app/services/company_dashboard/reputation_service.rb` | Total reviews, avg rating, trust score |
| RankingService | `app/services/company_dashboard/ranking_service.rb` | Position, percentile, Magic Quadrant |
| StatsService | `app/services/company_dashboard/stats_service.rb` | Profile views, CTA clicks, leads |
| MetricsSource | `app/services/company_dashboard/metrics_source.rb` | Dual source (daily_stats + events) |
| IntentScoringService | `app/services/intent_scoring_service.rb` | 4-category scoring with decay |

### Backend Controllers

| Controller | Endpoint | Purpose |
|------------|----------|---------|
| TrustController | `/api/v1/trust/profile` | Authenticated trust data |
| WidgetDataController | `/api/v1/widget/:id` | Public widget data with inline score |
| CompanyDashboardController | `/api/v1/company_dashboard/*` | Main dashboard API (20+ endpoints) |
| BadgesController | `/api/v1/badges/*` | Badge management |

### Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| EnterpriseDashboard | `app/dashboard/components/EnterpriseDashboard.tsx` | Main dashboard (723 lines) |
| TrustWidgetDashboard | `app/dashboard/components/TrustWidgetDashboard.tsx` | Widget configuration |
| MagicQuadrant | `app/dashboard/components/MagicQuadrant.tsx` | Scatter chart (172 lines) |
| CompetitorBenchmark | `app/dashboard/components/CompetitorBenchmark.tsx` | Uses MOCK data |
| BadgesManagement | `app/dashboard/components/BadgesManagement.tsx` | Badge management |

### Database Tables (Trust-Related)

| Table | Schema Line | Purpose |
|-------|-------------|---------|
| company_trust_score | 720 | Trust score storage |
| reviews | ~850 | Review records |
| badges | — | Badge definitions |
| company_badges | — | Company-badge associations |
| company_feature_rolling_30d | — | Materialized view for analytics |
| company_anomaly_daily | — | Anomaly tracking |

---

## 7. Conclusion

This architecture positions AvaliaSolar as a true **Trust as a Service** platform by:

1. **Single source of truth** for Trust Score
2. **Real-time updates** when reviews are approved
3. **Functional Intent Score** with database backing
4. **Connected Magic Quadrant** using real competitive data
5. **New trust-focused endpoints** enabling TaaS dashboard hierarchy

The implementation in Phase B will resolve all critical bugs and enable the dashboard to reflect trust as the primary business metric.

---

*Document generated by Architect Agent. For questions, @architect.*

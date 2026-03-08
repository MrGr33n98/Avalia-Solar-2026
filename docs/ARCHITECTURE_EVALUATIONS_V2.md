# Architecture: Multi-Vertical & Editorial Evaluations (V2)

## Context & Objectives
This document defines the architectural evolution from MVP 1.1 (Granular Scores) to Phase 2 (Multi-Vertical & Editorial). The goal is to transform "Solar Reviews" into a high-trust, editorial-grade reputation system (B2B Stack style), allowing for segment-specific rankings (Residential vs. Commercial vs. Industrial).

## 1. Data Schema Evolution

### Table: `reviews` (Expansion)
We are adding semantic depth and structural categorization to the review model.
- `category_id`: Foreign Key to `categories`. This segments the review's context.
- `headline`: `string(120)`. The summary of the user's experience.
- `pros`: `jsonb` array. List of positive aspects.
- `cons`: `jsonb` array. List of negative aspects/opportunities.
- `buyer_tip`: `text`. Advice for future customers.
- `project_context`: `jsonb`. Metadata like `power_kwp`, `installation_date`, `status`.
- `granular_scores_snapshot`: `jsonb`. A flattened copy of the scores at creation time for performance and history preservation.

### Table: `review_criterion_scores` (Immutability Layer)
While `rating_criteria` can change over time (titles/weights), the review must remain truthful to the criteria presented at the time of submission.
- `title_snapshot`: `string`. The title of the criterion when the review was made.
- `weight_snapshot`: `decimal`. The weight assigned to the criterion when the review was made.

### Table: `review_aggregates` (Read Model / Cache)
To avoid heavy JOINs and weighted average calculations on every page load (critical for SEO/LCP).
- `company_id`: FK.
- `category_id`: FK (null for global).
- `average_rating`: `decimal(3,2)`.
- `total_reviews`: `integer`.
- `scores_distribution`: `jsonb` (e.g., `{"1": 2, "2": 0, "3": 5, "4": 15, "5": 20}`).
- `criteria_breakdown`: `jsonb` (averages per criterion title).

---

## 2. The Snapshot & Immutability Logic
**Why?** If an Administrator changes the weight of "Atendimento" from 1.0 to 2.0 in 2027, reviews from 2024 should *not* have their scores re-calculated automatically, as the user rated the company based on the 2024 standards.

**Mechanism:**
1. During `Reviews::CreateService`:
   - Fetch active criteria for the category.
   - For each score, persist the current `title` and `weight` into `review_criterion_scores`.
   - Store a summarized `granular_scores_snapshot` in the `Review` record for quick UI rendering without JOINing multiple tables.

---

## 3. Services & Contracts

### `Reviews::AggregationService`
Executed **asynchronously** after a `Review` is approved (status: `published`).
- **Input:** `review_id`.
- **Logic:**
  1. Recalculate the `average_rating` for the specific `company_id` + `category_id`.
  2. Recalculate the Global `average_rating` for the `company_id`.
  3. Update `review_aggregates`.
- **Trigger:** Dispatched via `AfterReviewPublicationJob`.

### `Reviews::UniquenessValidator`
Prevents review bombing while allowing legitimate multi-service evaluations.
- **Rule:** `[user_id || email, company_id, category_id]`.
- **Constraint:** A user can only submit one review per company *per category* every 12 months.
- **Legacy Fallback:** Existing reviews (V1) will be associated with the Company's Primary Category.

---

## 4. API Payload Design (Contract)

### GET /api/v1/companies/:id/reviews
```json
{
  "company_score": {
    "global_avg": 4.8,
    "categories": [
      { "id": 1, "name": "Residencial", "avg": 4.9, "count": 45 },
      { "id": 2, "name": "Comercial", "avg": 4.2, "count": 10 }
    ]
  },
  "reviews": [
    {
      "id": 123,
      "category_name": "Residencial",
      "headline": "Instalação rápida e suporte excelente",
      "pros": ["Prazos cumpridos", "Equipe técnica"],
      "cons": ["Preço acima da média"],
      "rating": 4.5,
      "granular_scores": [
        { "title": "Atendimento", "score": 5, "weight": 1.0 },
        { "title": "Qualidade Técnica", "score": 4, "weight": 1.5 }
      ],
      "project_metadata": { "power": 5.2, "status": "operando" }
    }
  ],
  "seo_metadata": {
    "@context": "https://schema.org/",
    "@type": "AggregateRating",
    "itemReviewed": { "@type": "LocalBusiness", "name": "Empresa X" },
    "ratingValue": "4.8",
    "reviewCount": "55"
  }
}
```

---

## 5. MCP Alignment (Micro Component Pattern)
- **Frontend:** `ReviewForm` component is now dynamic. It first asks for `category_id`, then fetches the specific criteria via `GET /api/v1/categories/:id/evaluation_context`.
- **Backend:** `ReviewSubmissionService` decouples validation, creation, and notification.
- **Approval Flow:** Fields like `headline`, `pros`, and `cons` are subject to the `PendingChange` approval flow before affecting the `review_aggregates`.

---
*Document Version: 2.0 (Phase 2)*
*Author: Aria (Architect)*

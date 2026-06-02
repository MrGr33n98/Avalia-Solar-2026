---
phase: 05-phase-5-reviews-premium-reputacao
plan: 02
type: execute
wave: 2
depends_on: ["05-01"]
files_modified:
  - db/migrate/20260602_add_capture_flow_source_to_reviews.rb
  - app/models/review.rb
  - app/controllers/api/v1/reviews_controller.rb
  - app/services/reviews/moderation_service.rb
  - app/services/reviews/decision_service.rb
  - app/controllers/api/v1/admin/reviews_controller.rb
  - config/routes.rb
autonomous: true
requirements: [REV-02, REV-03]
user_setup: []

must_haves:
  truths:
    - "Users can submit reviews via API with capture source tracking"
    - "New reviews enter a pending state by default"
    - "Trusted/returning reviewers have their reviews auto-approved"
    - "Admins can view pending reviews and approve, reject, or flag them"
  artifacts:
    - path: "db/migrate/20260602_add_capture_flow_source_to_reviews.rb"
      provides: "Schema update for capture flow tracking"
      contains: "capture_flow_source"
    - path: "app/controllers/api/v1/reviews_controller.rb"
      provides: "Review submission endpoint"
      exports: ["create"]
    - path: "app/services/reviews/moderation_service.rb"
      provides: "Auto-approval and fraud detection logic"
      exports: ["auto_approve_if_trusted?", "flag_suspicious?"]
    - path: "app/services/reviews/decision_service.rb"
      provides: "Moderation actions"
      exports: ["approve!", "reject!", "flag!"]
    - path: "app/controllers/api/v1/admin/reviews_controller.rb"
      provides: "Admin moderation endpoints"
      exports: ["index", "approve", "reject", "flag"]
  key_links:
    - from: "ReviewsController"
      to: "ModerationService"
      via: "after_create hook or explicit call"
      pattern: "ModerationService.new"
---

<objective>
**Wave 2: ReviewCaptureFlow MVP & Basic Moderation (Backend)**

Purpose: Implement the backend infrastructure for capturing reviews from multiple entry points (profile, lead, chat) and the moderation system to automatically approve trusted reviews while queuing others for admin review.

Output: API endpoints for review submission and moderation, state management, and fraud detection services.
</objective>

<execution_context>
@.planning/phases/05-phase-5-reviews-premium-reputacao/05-COMPLETE-PLAN.md
</execution_context>

<context>
## Scope Overview
This plan implements Etapa 2 and Etapa 3 of Phase 5 in parallel:
- **Etapa 2 (ReviewCaptureFlow MVP):** API endpoint to capture reviews, tracking the source (`capture_flow_source`), and ensuring basic validation.
- **Etapa 3 (Basic Moderation & Anti-fraud):** Services to evaluate incoming reviews. Trusted users get auto-approved. Others remain pending. Admins get endpoints to manually approve/reject/flag.

## Constraints & Environment
- **CRITICAL:** The local environment DOES NOT use Docker. All tasks must use native Rails commands (`rails db:migrate`, `rails test` or `rspec`) running directly in the backend folder (`AB0-1-back`).
- All new reviews should default to a `pending` state (if a status enum exists, or a boolean/string representation of state).
- Moderation relies on checking if a user has previously approved reviews (returning reviewer).
</context>

<tasks>

<task type="auto">
  <name>Task 2.1: Add capture_flow_source to reviews</name>
  <files>AB0-1-back/db/migrate/20260602_add_capture_flow_source_to_reviews.rb, AB0-1-back/app/models/review.rb</files>
  <action>
1. Create a migration to add `capture_flow_source` (string) and `status` (integer or string depending on existing schema patterns) to the `reviews` table. If `status` already exists, just add `capture_flow_source`.
2. `capture_flow_source` should allow values: 'profile', 'lead', 'chat'.
3. In `Review` model, add enumerations for `capture_flow_source` and `status` (pending, approved, rejected, flagged).
4. Set default `status` to `pending`.
5. Add validation to ensure `capture_flow_source` is present.
  </action>
  <verify>
    <automated>cd AB0-1-back && rails db:migrate && rails runner "puts Review.new.status == 'pending' ? 'pass' : 'fail'" | grep pass</automated>
  </verify>
  <done>
    - Migration executed successfully without Docker.
    - `Review` model has enums for source and status.
    - Default status for new reviews is pending.
  </done>
</task>

<task type="auto">
  <name>Task 2.2: Implement POST /api/v1/reviews</name>
  <files>AB0-1-back/config/routes.rb, AB0-1-back/app/controllers/api/v1/reviews_controller.rb</files>
  <action>
1. Add `POST /api/v1/reviews` to `config/routes.rb` under API namespace.
2. Create `Api::V1::ReviewsController` with a `create` action.
3. The endpoint should accept `company_id`, `rating`, `comment`, `capture_flow_source`, and consent flags.
4. It must authenticate the user (using the existing authentication pattern).
5. On successful creation, it should trigger the moderation service (to be built next) or queue a background job for it. For now, inline synchronous call is fine for the MVP.
  </action>
  <verify>
    <automated>cd AB0-1-back && rails routes | grep "api/v1/reviews" && rails runner "require 'action_controller'; puts defined?(Api::V1::ReviewsController) ? 'pass' : 'fail'" | grep pass</automated>
  </verify>
  <done>
    - Routes configured correctly.
    - Controller created with standard strong parameters.
    - Endpoint requires authentication.
  </done>
</task>

<task type="auto">
  <name>Task 2.3: Create Moderation and Decision Services</name>
  <files>AB0-1-back/app/services/reviews/moderation_service.rb, AB0-1-back/app/services/reviews/decision_service.rb</files>
  <action>
1. Create `Reviews::ModerationService`:
   - `def evaluate(review)`: Evaluates the review.
   - Auto-approval logic: If the `reviewer_user` has > 0 previously approved reviews, set status to `approved`.
   - Fraud detection (basic): Check for self-review (user belongs to company). Check for PII in comment (basic regex for CPF or email as a placeholder). If suspicious, set status to `flagged`.
2. Create `Reviews::DecisionService`:
   - Methods: `approve!(review)`, `reject!(review)`, `flag!(review)`.
   - Each method updates the review's status and saves it.
   - (Optional placeholder) Write to an audit log table if it exists, or just Rails.logger.
  </action>
  <verify>
    <automated>cd AB0-1-back && rails runner "puts (defined?(Reviews::ModerationService) && defined?(Reviews::DecisionService)) ? 'pass' : 'fail'" | grep pass</automated>
  </verify>
  <done>
    - Services are created in `app/services/reviews/`.
    - Auto-approval and basic fraud detection logic implemented.
  </done>
</task>

<task type="auto">
  <name>Task 2.4: Implement Admin Moderation Endpoints</name>
  <files>AB0-1-back/config/routes.rb, AB0-1-back/app/controllers/api/v1/admin/reviews_controller.rb</files>
  <action>
1. Add admin routes for reviews in `config/routes.rb`:
   - `GET /api/v1/admin/reviews/pending`
   - `PATCH /api/v1/admin/reviews/:id/approve`
   - `PATCH /api/v1/admin/reviews/:id/reject`
   - `PATCH /api/v1/admin/reviews/:id/flag`
2. Create `Api::V1::Admin::ReviewsController`.
3. Ensure these endpoints are gated by admin authentication (use existing admin auth filters).
4. The PATCH endpoints should use `Reviews::DecisionService` to change the status.
  </action>
  <verify>
    <automated>cd AB0-1-back && rails routes | grep "admin/reviews" && rails runner "puts defined?(Api::V1::Admin::ReviewsController) ? 'pass' : 'fail'" | grep pass</automated>
  </verify>
  <done>
    - Admin routes are active.
    - Controller utilizes `DecisionService`.
    - Admin authentication is enforced.
  </done>
</task>

</tasks>

<verification>
**Local Native Verification:**
```bash
cd AB0-1-back
rails db:migrate
rails test test/controllers/api/v1/reviews_controller_test.rb # (If created)
rails runner "puts Review.new.status" # Should output 'pending'
```
</verification>

<success_criteria>
- [ ] Schema updated natively with `rails db:migrate`.
- [ ] `Review` model tracks capture flow source and status.
- [ ] Users can submit reviews via the new API endpoint.
- [ ] The `ModerationService` can automatically approve trusted reviewers.
- [ ] The `DecisionService` handles manual state transitions.
- [ ] Admin endpoints for moderation are created and secured.
</success_criteria>

<output>
After completion, create `.planning/phases/05-phase-5-reviews-premium-reputacao/05-WAVE2-SUMMARY.md` documenting the endpoints created and the auto-approval criteria configured.
</output>

# Etapa 2 & 3 (Wave 2) Summary: ReviewCaptureFlow MVP & Basic Moderation

## Overview
This document summarizes the execution of Wave 2 (Etapas 2 and 3) of Phase 5. The backend infrastructure for review capture and moderation has been implemented.

## Changes Implemented

### 1. Schema & Models
- Created migration `20260602004519_add_capture_flow_source_to_reviews.rb` to add `capture_flow_source` and set the default `status` to `0` (pending) on the `reviews` table.
- Updated `Review` model with:
  - `enum capture_flow_source: { profile: 'profile', lead: 'lead', chat: 'chat' }`
  - Added `flagged` to the existing `status` enum.
  - Added validation `validates :capture_flow_source, presence: true`.

### 2. Services
- **`Reviews::ModerationService`**:
  - Implements `evaluate(review)`.
  - Auto-approves reviews from trusted users (users with previously approved reviews).
  - Flags reviews containing basic PII (emails, CPFs) or self-reviews.
- **`Reviews::DecisionService`**:
  - Implements `approve!`, `reject!`, and `flag!` for state transitions and saving.

### 3. API Endpoints
- **Review Submission**:
  - Added `POST /api/v1/reviews` in `Api::V1::ReviewsController`.
  - Endpoint accepts `capture_flow_source`, `rating`, `comment`, etc.
  - Triggers `Reviews::ModerationService.new.evaluate(@review)` upon successful review creation.
- **Admin Moderation**:
  - Added routes: `GET /api/v1/admin/reviews/pending`, `PATCH /api/v1/admin/reviews/:id/approve`, `PATCH /api/v1/admin/reviews/:id/reject`, `PATCH /api/v1/admin/reviews/:id/flag`.
  - Implemented `Api::V1::Admin::ReviewsController` integrating `Reviews::DecisionService` to handle moderation actions.

## Blockers & Next Steps
- The database migration for `capture_flow_source` was generated but **could not be executed locally** because the local PostgreSQL instance was unreachable at the time of execution.
- **Action Required**: Start the local PostgreSQL server and run `rails db:migrate` in `AB0-1-back`.
- Once migrated and verified, we can proceed to Wave 3 (Etapa 4 and 5).

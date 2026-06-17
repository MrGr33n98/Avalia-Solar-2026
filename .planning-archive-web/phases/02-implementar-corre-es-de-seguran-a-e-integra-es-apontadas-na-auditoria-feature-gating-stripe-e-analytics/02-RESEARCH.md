# Phase 02 Research

## 1. Feature Access Endpoint & Backend Security
- **Current State**: The backend API for companies (`app/controllers/api/v1/companies_controller.rb`) doesn't currently expose the `feature_access` boolean in its JSON responses.
- **Requirement**: We need to expose `feature_access` (boolean) dynamically via `GET /api/v1/companies/:id/feature_access`. 
- **Security Policy**: The endpoint must be protected by Pundit (`CompanyPolicy`). Currently, there might be a flaw where any user can query this, or bypass it. We need to create the endpoint and the corresponding policy to authorize that ONLY the company owner can read this flag or it must be public only for public profiles, but wait, `feature_access` dictates if the profile displays premium data. If it's for public display, it should be safe to return, but we shouldn't leak other private data.

## 2. Stripe Webhook Fallbacks
- **Current State**: `SubscriptionSyncService` (`app/services/billing/subscription_sync_service.rb`) checks if `company.nil?` and probably throws an error or fails silently when Stripe sends events for unrecognized company IDs (or missing metadata).
- **Requirement**: Add a fallback to gracefully handle unknown companies in webhooks (e.g. logging an alert instead of a fatal error) to prevent Stripe retry loops.

## 3. Analytics & Revenue Tracking
- **Current State**: `PricingPage` frontend calls `billingApi.createCheckoutSession` but lacks conversion events.
- **Requirement**: We need to use `analytics.track` from `lib/analytics` or `lib/analytics/lazy` to emit events like `checkout_started` in `PricingPage` when the session is successfully created. On the backend, we need to track `checkout.session.completed`.

## Validation Architecture
- Feature Gate: `curl` or specs to ensure `/api/v1/companies/:id/feature_access` returns 200 with `{ "feature_access": true|false }`.
- Stripe: RSpec test simulating a Stripe webhook without a valid company to ensure no 500 error is thrown.
- Analytics: Jest tests mocking `analytics.track` to verify `checkout_started` is called.

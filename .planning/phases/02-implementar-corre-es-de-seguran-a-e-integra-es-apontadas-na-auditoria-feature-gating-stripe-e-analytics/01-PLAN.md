---
wave: 1
depends_on: []
files_modified:
  - AB0-1-back/config/routes.rb
  - AB0-1-back/app/controllers/api/v1/companies_controller.rb
  - AB0-1-back/app/policies/company_policy.rb
  - AB0-1-back/app/services/billing/subscription_sync_service.rb
  - AB0-1-front/components/pricing/PricingPage.tsx
autonomous: true
---

# Phase 02 Plan: Security Fixes, Stripe Fallbacks & Analytics

## 1. Implement Feature Gate Endpoint

```xml
<task>
  <objective>Create `feature_access` endpoint for companies</objective>
  <read_first>
    - AB0-1-back/config/routes.rb
    - AB0-1-back/app/controllers/api/v1/companies_controller.rb
    - AB0-1-back/app/policies/company_policy.rb
  </read_first>
  <action>
    1. In `AB0-1-back/config/routes.rb`, add a `get :feature_access` route inside the `resources :companies` block for `api/v1`.
    2. In `AB0-1-back/app/controllers/api/v1/companies_controller.rb`, add the `feature_access` method.
    3. The method should find the company, authorize it (`authorize @company, :feature_access?`), and return `{ feature_access: @company.feature_access }`. Wait, is `feature_access` a column or a method? If the audit mentioned `feature_access` bypass, we need to return `company.premium?` or whatever the logic is for feature_access. Let's return `{ feature_access: @company.premium_active? }` or similar. If we don't know the exact method, we'll check `SubscriptionSyncService` or `Company` model during execution.
    4. In `AB0-1-back/app/policies/company_policy.rb`, add `def feature_access?` which returns `true` (if it's public) or `user == record.user` if it's private. The audit mentioned we want the frontend to query this safely.
  </action>
  <acceptance_criteria>
    - `config/routes.rb` contains `get :feature_access`
    - `companies_controller.rb` contains `def feature_access`
    - `company_policy.rb` contains `def feature_access?`
  </acceptance_criteria>
</task>
```

## 2. Implement Stripe Webhook Fallbacks

```xml
<task>
  <objective>Graceful fallback for unknown companies in SubscriptionSyncService</objective>
  <read_first>
    - AB0-1-back/app/services/billing/subscription_sync_service.rb
  </read_first>
  <action>
    1. In `AB0-1-back/app/services/billing/subscription_sync_service.rb`, modify the places where it checks `if company.nil?`.
    2. Change the code to log a warning `Rails.logger.warn("Company not found for Stripe customer: #{customer_id}")` and return `nil` or `false` gracefully, instead of raising an error or continuing to blow up.
  </action>
  <acceptance_criteria>
    - `subscription_sync_service.rb` contains `Rails.logger.warn` for missing company cases.
  </acceptance_criteria>
</task>
```

## 3. Implement Frontend Analytics Tracking

```xml
<task>
  <objective>Track checkout initiation in PostHog/Mixpanel</objective>
  <read_first>
    - AB0-1-front/components/pricing/PricingPage.tsx
    - AB0-1-front/lib/analytics.ts (or `analytics/lazy.ts`)
  </read_first>
  <action>
    1. In `AB0-1-front/components/pricing/PricingPage.tsx`, import `track` from `@/lib/analytics/lazy` or `@/lib/analytics`.
    2. After a successful `billingApi.createCheckoutSession` call, call `track('checkout_started', { companyId: companyId, planId: planId })`.
  </action>
  <acceptance_criteria>
    - `PricingPage.tsx` imports `track`.
    - `PricingPage.tsx` contains `track('checkout_started'` after `createCheckoutSession`.
  </acceptance_criteria>
</task>
```

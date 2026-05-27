# GSD Execution Plan: Revenue System Remediation
## Avalia Solar - Phase 1-4 Implementation Roadmap

**Created:** 2026-05-27  
**Status:** Ready for Execution  
**Priority:** P0 (Revenue-blocking issues)  
**Estimated Duration:** 4 weeks (3 days hotfix + 3 weeks optimization)

---

## Executive Summary

The revenue/billing system is **80% wired** but has **critical gaps** preventing revenue visibility, feature enforcement, and system reliability:

**3 Critical Issues Blocking Revenue:**
1. 🔴 Feature gates computed by backend but NOT exposed to frontend API
2. 🔴 Frontend uses hardcoded plan checks instead of backend truth
3. 🔴 Zero revenue events tracked (cannot measure conversion funnel)

**3 High-Risk Issues:**
4. 🟡 Users can bypass feature gates via direct API calls
5. 🟡 Checkout errors shown as `alert()` (poor UX)
6. 🟡 No audit trail for billing actions

**Outcome:** Complete feature gate enforcement, enable revenue metrics, improve checkout UX.

**Financial Impact:** 12-30% potential revenue lift + risk mitigation.

---

## Phase 0: Technical Validation (30 minutes)

**Goal:** Confirm audit findings still accurate before implementation begins.

### Task 0.1: Verify Feature Access Implementation
- **File to inspect:** `AB0-1-back/app/services/company_feature_access_resolver.rb`
- **Verify:**
  - [ ] `CompanyFeatureAccessResolver#call` method exists and returns feature state hash
  - [ ] `Company#feature_access` method exists and calls resolver
  - [ ] Hash format: `{ feature_name: { state: 'enabled'|'locked'|'hidden', reason?: string } }`
  - [ ] Backend tests exist in `spec/services/company_feature_access_resolver_spec.rb`
- **Expected:** ✅ All backend logic exists, just not exposed via API

### Task 0.2: Verify Frontend State
- **Files to inspect:**
  - `AB0-1-front/components/pricing/PricingPage.tsx` (line ~220 for error handling)
  - `AB0-1-front/app/dashboard/page.tsx` (line ~100 for plan check)
  - `AB0-1-front/lib/api/billing.ts` (for existing API clients)
- **Verify:**
  - [ ] `createCheckoutSession()` exists in API client
  - [ ] Error handling uses `try/catch` + `alert()` (not user-friendly)
  - [ ] Feature visibility checks use hardcoded `company.plan === 'pro'` or similar
  - [ ] NO endpoint calls to `GET /api/v1/companies/:id/feature_access` (will be missing)
- **Expected:** ✅ Frontend implements fallback logic, no API consumption

### Task 0.3: Verify Stripe Integration
- **File to inspect:** `AB0-1-back/app/services/billing/stripe_webhook_handler.rb` (line ~86)
- **Verify:**
  - [ ] `SubscriptionSyncService` is imported and called from webhook handler
  - [ ] Idempotency check via `Billing::StripeEvent` table
  - [ ] Stripe signature verification in place
- **Expected:** ✅ Service exists (audit initially said missing, but it's there)

### Task 0.4: Check Analytics Setup
- **File to inspect:** `AB0-1-front/lib/analytics/index.ts`
- **Verify:**
  - [ ] `analytics.track()` function exists
  - [ ] PostHog or similar provider configured
  - [ ] BUT: No revenue-specific events fired yet
- **Expected:** ✅ Analytics library ready, just needs events

**Success Criteria for Phase 0:**
- ✅ All findings in INTEGRATION_CHECK and PHASE_2 AUDIT reports still match code
- ✅ No surprises that would invalidate plan
- ✅ Ready to proceed with Phase 1 hotfixes

---

## Phase 1: Hotfix - Feature Access & Revenue Events (Day 1 - 7 hours)

**Goal:** Enable backend-driven feature enforcement and start measuring revenue.

**Why this order:** Feature gates fix security hole + revenue events enable business metrics. Both prerequisite for subsequent optimization.

### Wave 1.A: Feature Access API Endpoint (Backend) - 2.5 hours

#### Task 1.A.1: Add Feature Access Controller Endpoint
- **Files:**
  - `AB0-1-back/app/controllers/api/v1/companies_controller.rb` (create action)
  - `AB0-1-back/config/routes.rb` (add route)
  - `AB0-1-back/app/serializers/company_serializer.rb` (optional - if using serializer pattern)
- **Action:**
  - Add route: `get 'companies/:id/feature_access', to: 'companies#feature_access'` in `/api/v1` namespace
  - Add controller action:
    ```ruby
    def feature_access
      company = Company.find(params[:id])
      authorize company, :show?, policy_class: CompanyPolicy
      
      render json: {
        features: company.feature_access,
        plan: company.plan_tier,
        subscription_status: company.current_subscription&.status,
        metadata: {
          timestamp: Time.current,
          version: 1
        }
      }, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Company not found' }, status: :not_found
    rescue Pundit::NotAuthorizedError
      render json: { error: 'Unauthorized' }, status: :forbidden
    end
    ```
  - No external dependencies needed (uses existing Company model + CompanyPolicy)
- **Verify:**
  ```bash
  # In backend directory:
  # 1. Endpoint syntax check
  grep -n "feature_access" AB0-1-back/app/controllers/api/v1/companies_controller.rb
  
  # 2. Route check
  grep -n "feature_access" AB0-1-back/config/routes.rb
  
  # 3. Manual test when server running:
  # curl -H "Authorization: Bearer $JWT" http://localhost:3000/api/v1/companies/123/feature_access
  ```
- **Done:** Endpoint returns 200 with features hash; 403 if not authorized; 404 if company missing.

#### Task 1.A.2: Add Backend Feature Gate Enforcement
- **Files:**
  - `AB0-1-back/app/controllers/concerns/feature_gate_enforceable.rb` (create concern)
  - Update any premium endpoints (TBD from code review - at minimum: analytics, intent_scores, webhooks endpoints)
- **Action:**
  - Create concern that provides `enforce_feature_access(feature_name)` method
  - Concern fetches company.feature_access and checks state
  - If state != 'enabled': render 403 Forbidden
  - Add `before_action :enforce_feature_access, only: [...]` to premium endpoints
  - Identify which endpoints need this:
    - POST/GET `/api/v1/companies/:id/analytics/intent_scores` → requires intent_scores feature
    - POST `/api/v1/companies/:id/webhooks` → requires webhooks feature
    - GET `/api/v1/companies/:id/social_proof` → requires social_proof feature
- **Verify:**
  ```bash
  # Check concern exists:
  test -f AB0-1-back/app/controllers/concerns/feature_gate_enforceable.rb && echo "✓ Concern exists"
  
  # Check endpoint includes concern:
  grep -n "include.*FeatureGateEnforceable" AB0-1-back/app/controllers/api/v1/analytics_controller.rb
  grep -n "enforce_feature_access" AB0-1-back/app/controllers/api/v1/analytics_controller.rb
  ```
- **Done:** Unauthenticated request to premium endpoint → 403 Forbidden with clear error message.

#### Task 1.A.3: Add Backend Tests
- **Files:**
  - `AB0-1-back/spec/requests/api/v1/companies/feature_access_spec.rb` (create)
  - `AB0-1-back/spec/controllers/concerns/feature_gate_enforceable_spec.rb` (create)
- **Action:**
  - Test 1: GET /api/v1/companies/:id/feature_access returns correct feature state for Free plan
  - Test 2: GET /api/v1/companies/:id/feature_access returns correct feature state for Pro plan
  - Test 3: GET /api/v1/companies/:id/feature_access returns 403 if not authorized
  - Test 4: Premium endpoint rejects Free user with 403 if feature locked
  - Test 5: Premium endpoint allows Pro user with 200
- **Verify:**
  ```bash
  cd AB0-1-back
  bundle exec rspec spec/requests/api/v1/companies/feature_access_spec.rb
  bundle exec rspec spec/controllers/concerns/feature_gate_enforceable_spec.rb
  # All tests should pass
  ```
- **Done:** 5+ tests passing, code coverage >80% for new code.

**Wave 1.A Duration:** 2.5 hours  
**Checkpoint:** Backend feature access working end-to-end, tested, safe to deploy.

---

### Wave 1.B: Feature Access Frontend Hook (Frontend) - 2 hours

#### Task 1.B.1: Create useCompanyFeatures Hook
- **Files:**
  - `AB0-1-front/hooks/useCompanyFeatures.ts` (create)
  - `AB0-1-front/lib/api/companies.ts` (create if not exists, or add to existing)
- **Action:**
  - Create hook that:
    - Fetches `/api/v1/companies/:id/feature_access` on mount
    - Handles loading, error, success states
    - Returns `{ features, loading, error }`
  - Create API client function `companiesApi.getFeatureAccess(companyId)`
  - Use existing `fetchApiSafe` pattern from codebase (check `lib/api/billing.ts` for pattern)
  - No external dependencies
- **Example structure:**
  ```typescript
  export const useCompanyFeatures = (companyId: number) => {
    const [features, setFeatures] = useState<Record<string, FeatureState>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      if (!companyId) {
        setLoading(false);
        return;
      }
      
      companiesApi.getFeatureAccess(companyId)
        .then(data => setFeatures(data.features))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }, [companyId]);
    
    return { features, loading, error };
  };
  ```
- **Verify:**
  ```bash
  # Check hook file exists and exports
  grep -n "export.*useCompanyFeatures" AB0-1-front/hooks/useCompanyFeatures.ts
  
  # Check API client exists
  grep -n "getFeatureAccess" AB0-1-front/lib/api/companies.ts
  ```
- **Done:** Hook compiles, TypeScript clean, returns correct shape.

#### Task 1.B.2: Replace Hardcoded Checks in Dashboard
- **Files:**
  - `AB0-1-front/app/dashboard/page.tsx` (update)
  - Any other dashboard components that check `company.plan` (find with `grep -r "company\.plan ===" AB0-1-front/`)
- **Action:**
  - Replace hardcoded checks:
    - OLD: `if (company.plan === 'pro')` render IntentScores
    - NEW: `const { features } = useCompanyFeatures(company.id); if (features.intent_scores?.state === 'enabled')` render IntentScores
  - For each feature (intent_scores, social_proof, webhooks, leads_tracking, custom_ctas):
    - Find where it's checked
    - Replace with hook-based check
    - Add fallback: if loading, show skeleton; if error, show "Unable to load features" with retry
- **Verify:**
  ```bash
  # Check for remaining hardcoded checks (should be minimal):
  grep -n "company\.plan ===" AB0-1-front/app/dashboard/page.tsx AB0-1-front/app/dashboard/components/*.tsx
  # Should return 0 results or only legitimate non-feature-check cases
  ```
- **Done:** No hardcoded plan checks in dashboard; all feature visibility via backend hook.

#### Task 1.B.3: Update Pricing Page to Use Feature Access
- **Files:**
  - `AB0-1-front/components/pricing/PricingPage.tsx` (update line ~300-400 where features displayed)
  - `AB0-1-front/components/pricing/FeatureComparisonTable.tsx` (update if shows feature availability)
- **Action:**
  - In PricingPage, add hook call to fetch feature access for current company
  - Pass features to FeatureComparisonTable as prop
  - In table, instead of hardcoded "Pro: ✓", show actual backend state
  - Display "Locked" with upgrade CTA for locked features
- **Verify:**
  ```bash
  # Check pricing page imports and uses hook:
  grep -n "useCompanyFeatures" AB0-1-front/components/pricing/PricingPage.tsx
  grep -n "features\." AB0-1-front/components/pricing/PricingPage.tsx
  ```
- **Done:** Pricing page shows actual backend feature state, not hardcoded.

**Wave 1.B Duration:** 2 hours  
**Checkpoint:** Frontend consuming feature access API, dashboard updated.

---

### Wave 1.C: Revenue Event Tracking (Frontend + Backend) - 2.5 hours

#### Task 1.C.1: Add Revenue Events to PricingPage (Frontend)
- **Files:**
  - `AB0-1-front/components/pricing/PricingPage.tsx` (update)
- **Action:**
  - Add event on mount: `analytics.track('pricing_viewed', { user_id, company_id, timestamp })`
  - Add event before checkout redirect:
    ```typescript
    analytics.track('checkout_started', {
      company_id: user.company_id,
      plan_id: plan.id,
      plan_name: plan.name,
      price_cents: plan.price_cents,
      user_id: user.id,
      previous_plan: subscription?.plan.slug || 'free'
    });
    ```
  - Add event after enterprise lead submit:
    ```typescript
    analytics.track('enterprise_lead_created', {
      company_id: user.company_id,
      plan_id: enterprisePlan.id,
      justification_length: justification.length,
      estimated_mrr: estimatedMrr,
      user_id: user.id
    });
    ```
  - Add event when portal opens: `analytics.track('portal_opened', { company_id, user_id });`
- **Verify:**
  ```bash
  # Check events are in code:
  grep -n "analytics.track.*pricing_viewed" AB0-1-front/components/pricing/PricingPage.tsx
  grep -n "analytics.track.*checkout_started" AB0-1-front/components/pricing/PricingPage.tsx
  grep -n "analytics.track.*enterprise_lead_created" AB0-1-front/components/pricing/PricingPage.tsx
  
  # Check syntax (if using PostHog):
  # Navigate to /pricing, check browser console for analytics events fired
  ```
- **Done:** Events fired on correct user actions; console shows no errors.

#### Task 1.C.2: Add Revenue Events to Webhook Processing (Backend)
- **Files:**
  - `AB0-1-back/app/services/billing/subscription_sync_service.rb` (update ~line 20)
- **Action:**
  - After subscription status updates:
    ```ruby
    if old_status != company_sub.status
      Analytics.track('subscription_status_changed', {
        company_id: company_sub.company_id,
        old_status: old_status,
        new_status: company_sub.status,
        plan: company_sub.plan.name,
        stripe_subscription_id: @stripe_sub.id,
        timestamp: Time.current
      })
    end
    
    # If moving to 'active':
    if company_sub.status == 'active' && old_status != 'active'
      Analytics.track('subscription_activated', {
        company_id: company_sub.company_id,
        plan: company_sub.plan.name,
        stripe_subscription_id: @stripe_sub.id,
        timestamp: Time.current
      })
    end
    ```
  - Find Analytics provider: check if PostHog, Segment, or custom (look in `config/initializers/`)
  - Use appropriate tracking method
- **Verify:**
  ```bash
  # Check events in code:
  grep -n "Analytics.track" AB0-1-back/app/services/billing/subscription_sync_service.rb
  
  # When webhook fires, check logs:
  tail -f AB0-1-back/log/development.log | grep "subscription_status_changed"
  ```
- **Done:** Backend fires analytics on webhook processing.

#### Task 1.C.3: Add Checkout Success Page Event
- **Files:**
  - `AB0-1-front/app/dashboard/page.tsx` (or wherever checkout success redirect lands)
- **Action:**
  - On mount, check URL params for `checkout=success`
  - If true, fire: `analytics.track('checkout_completed', { company_id, plan_id, timestamp })`
  - Remove URL param after tracking (optional, for cleanliness)
- **Verify:**
  ```bash
  # After completing checkout, verify redirect URL has checkout=success:
  # http://localhost:3000/dashboard?company_id=123&checkout=success
  
  # Check event fired in analytics backend (PostHog/Segment dashboard)
  ```
- **Done:** Checkout completion tracked end-to-end.

**Wave 1.C Duration:** 2.5 hours  
**Checkpoint:** All critical revenue events firing.

---

### Phase 1 Success Criteria
- ✅ `GET /api/v1/companies/:id/feature_access` endpoint exists and returns correct state
- ✅ Backend enforces feature gates on premium endpoints (403 if locked)
- ✅ Frontend calls feature access API instead of hardcoding checks
- ✅ Dashboard and Pricing page show backend-driven feature state
- ✅ All 7+ critical revenue events being tracked and visible in analytics
- ✅ All new backend code has tests (>80% coverage)
- ✅ No breaking changes to existing API contracts
- ✅ Can be deployed independently as hotfix

**Phase 1 Duration:** ~7 hours (2.5 + 2 + 2.5)  
**Can Deploy:** YES - Hotfix ready, low risk

---

## Phase 2: Checkout UX & Reliability (Days 2-3 - 8 hours)

**Goal:** Improve checkout error handling, prevent duplicate sessions, add audit trail.

### Task 2.1: Replace `alert()` with In-App Error UI
- **Files:**
  - `AB0-1-front/components/billing/ErrorBanner.tsx` (create reusable component)
  - `AB0-1-front/components/pricing/PricingPage.tsx` (update error handling)
  - `AB0-1-front/app/company-dashboard/billing/page.tsx` (update error handling)
- **Action:**
  - Create ErrorBanner component:
    ```typescript
    export const ErrorBanner = ({ error, onRetry, onDismiss }) => (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <h3 className="font-semibold text-red-900">Error</h3>
        <p className="text-sm text-red-800">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 bg-red-600 text-white px-4 py-2 rounded">
            Retry
          </button>
        )}
      </div>
    );
    ```
  - Update PricingPage error catch:
    ```typescript
    catch (err: any) {
      setCheckoutError(err?.message || 'Failed to start checkout');
      setActionLoadingPlanId(null);
    }
    ```
  - Add ErrorBanner JSX in render
  - Same pattern for billing page portal and enterprise lead errors
- **Verify:**
  ```bash
  # Test in browser:
  # 1. Kill backend server
  # 2. Try to upgrade to Pro
  # 3. Should see ErrorBanner with Retry button, not alert()
  # 4. Fix backend, click Retry → should work
  ```
- **Done:** All billing errors show friendly in-app messages with retry option.

### Task 2.2: Add Idempotency to Checkout Session Creation
- **Files:**
  - `AB0-1-back/app/services/billing/checkout_service.rb` (update)
  - `AB0-1-back/config/initializers/redis.rb` or `config/cache_stores.rb` (ensure caching configured)
- **Action:**
  - In CheckoutService, add cache key logic:
    ```ruby
    def create_checkout_session(stripe_customer_id)
      cache_key = "checkout_session:#{@company.id}:#{@plan.id}"
      
      # Return cached session if exists (valid for 30 minutes)
      cached_url = Rails.cache.read(cache_key)
      return cached_url if cached_url.present?
      
      # Create new session
      session = Stripe::Checkout::Session.create(...)
      
      # Cache for 30 minutes
      Rails.cache.write(cache_key, session.url, expires_in: 30.minutes)
      
      session.url
    end
    ```
  - Ensure Redis/Memcached configured in `config/cache_stores.rb`
- **Verify:**
  ```bash
  # Test idempotency:
  # 1. Create checkout session
  # 2. Create another immediately after (within 30 min)
  # 3. Both return same Stripe session URL
  
  # In rails console:
  # session_url_1 = Billing::CheckoutService.new(company, plan).call
  # session_url_2 = Billing::CheckoutService.new(company, plan).call
  # session_url_1 == session_url_2  # should be true
  ```
- **Done:** Multiple checkout attempts within 30 minutes return same session.

### Task 2.3: Add Billing Audit Logging
- **Files:**
  - `AB0-1-back/app/models/billing_audit_log.rb` (create model)
  - `AB0-1-back/db/migrate/XXXXX_create_billing_audit_logs.rb` (create migration)
  - `AB0-1-back/app/controllers/api/v1/billing/checkout_controller.rb` (update)
  - `AB0-1-back/app/controllers/api/v1/billing/portal_controller.rb` (update)
  - `AB0-1-back/app/controllers/api/v1/billing/enterprise_leads_controller.rb` (update)
- **Action:**
  - Create BillingAuditLog model:
    ```ruby
    class BillingAuditLog < ApplicationRecord
      belongs_to :user
      belongs_to :company
      
      enum action: {
        checkout_initiated: 0,
        portal_opened: 1,
        enterprise_lead_created: 2,
        subscription_synced: 3
      }
      
      # Tracks: user_id, company_id, action, plan_id, metadata (IP, User-Agent, timestamp)
    end
    ```
  - In each billing controller, log the action:
    ```ruby
    def create
      # ... existing code ...
      
      BillingAuditLog.create!(
        user_id: current_user.id,
        company_id: company.id,
        action: :checkout_initiated,
        plan_id: params[:plan_id],
        metadata: {
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          timestamp: Time.current.iso8601
        }
      )
      
      # ... rest of code ...
    end
    ```
- **Verify:**
  ```bash
  # Create billing action:
  # curl -X POST /api/v1/billing/checkout -H "Authorization: Bearer $JWT" -d '...'
  
  # Check audit log:
  # BillingAuditLog.where(action: :checkout_initiated).last
  # Should have user_id, company_id, metadata with IP + timestamp
  ```
- **Done:** All billing actions logged with user, company, IP, action, timestamp.

### Task 2.4: Add Email Notification on Plan Change
- **Files:**
  - `AB0-1-back/app/services/billing/subscription_sync_service.rb` (update)
  - `AB0-1-back/app/mailers/billing_mailer.rb` (create if not exists)
- **Action:**
  - After subscription status changes, send email to company owner/admins:
    ```ruby
    if old_status != company_sub.status
      BillingMailer.subscription_changed(
        company_sub,
        old_status,
        current_user: nil  # Webhook, no user context
      ).deliver_later
    end
    ```
  - Create BillingMailer:
    ```ruby
    class BillingMailer < ApplicationMailer
      def subscription_changed(subscription, old_status)
        @subscription = subscription
        @old_status = old_status
        @company = subscription.company
        
        recipients = @company.users.where(role: ['owner', 'editor']).pluck(:email)
        mail(to: recipients, subject: "Plano alterado para #{@subscription.plan.name}")
      end
    end
    ```
  - Create template: `app/views/billing_mailer/subscription_changed.html.erb`
- **Verify:**
  ```bash
  # Manually trigger webhook:
  # rails console:
  event = Stripe::Event.construct_from(...) 
  Billing::StripeWebhookHandler.new(event).call
  
  # Check email in test environment:
  # ActionMailer::Base.deliveries.last.subject should match
  ```
- **Done:** Company admins notified via email when plan changes.

**Phase 2 Duration:** ~8 hours (2 + 2 + 2 + 2)  
**Can Deploy:** YES - Follows Phase 1, no blocking dependencies

---

## Phase 3: Subscription Lifecycle & Reliability (Week 2 - 6 hours)

**Goal:** Handle edge cases, improve observability, add fallback logic.

### Task 3.1: Fix SubscriptionSyncService Edge Case (Company Not Found)
- **Files:**
  - `AB0-1-back/app/services/billing/subscription_sync_service.rb` (update line ~50)
- **Action:**
  - Replace hard error with graceful fallback:
    ```ruby
    if company.nil?
      # Instead of raising:
      # Log the event for manual investigation
      Billing::SlackNotifier.notify_unknown_company(
        stripe_sub_id: @stripe_sub.id,
        stripe_customer_id: @stripe_sub.customer,
        error: "Company lookup failed"
      )
      
      # Track in error logging system
      Sentry.capture_exception(
        "SubscriptionSyncService: Company not found for Stripe subscription #{@stripe_sub.id}"
      )
      
      # Return nil (webhook processed, but company lookup failed)
      return nil
    end
    ```
  - Ensure Slack notifier includes Stripe subscription ID, customer ID, error details
- **Verify:**
  ```bash
  # Trigger webhook with unknown company:
  # (Create fake Stripe event with invalid customer ID)
  
  # Check Slack notification received
  # Check Sentry shows error (if configured)
  # Check webhook handler completes without crashing
  ```
- **Done:** Webhook processes safely even if company lookup fails; error logged, team notified.

### Task 3.2: Add Webhook Failure Alerting
- **Files:**
  - `AB0-1-back/app/controllers/api/v1/billing/webhooks_controller.rb` (update)
- **Action:**
  - Wrap webhook handler in try/catch, log and alert on failure:
    ```ruby
    def stripe
      # ... existing signature verification ...
      
      begin
        Billing::StripeWebhookHandler.new(event).call
        render json: { status: 'success' }, status: 200
      rescue => e
        Sentry.capture_exception(e)
        Billing::SlackNotifier.notify_webhook_failure(
          event_id: event.id,
          event_type: event.type,
          error: e.message,
          backtrace: e.backtrace.first(10)
        )
        
        # Still return 200 to Stripe (don't retry failed webhooks)
        render json: { status: 'error', error: e.message }, status: 200
      end
    end
    ```
- **Verify:**
  ```bash
  # Force webhook failure:
  # Comment out company lookup in SubscriptionSyncService
  
  # Trigger webhook:
  # Should see Slack alert with error details
  # Should return 200 to Stripe
  ```
- **Done:** Webhook failures logged and alerted; team can fix before revenue lost.

### Task 3.3: Add Dashboard Billing Health Indicator
- **Files:**
  - `AB0-1-front/app/company-dashboard/billing/page.tsx` (or relevant billing page)
  - `AB0-1-front/components/billing/SubscriptionStatusBanner.tsx` (create or update)
- **Action:**
  - Display subscription status clearly:
    - active → "✓ Your subscription is active"
    - trialing → "ℹ Trial ends on {date}. Upgrade required."
    - past_due → "⚠ Payment failed. Click to retry or update payment method."
    - canceled → "✗ Your subscription was canceled. Reactivate?"
    - enterprise_lead → "ℹ Your request is pending. Sales team will contact you."
  - For past_due, show retry button linking to Stripe portal
  - For canceled, show "Reactivate Plan" button
- **Verify:**
  ```bash
  # Test each subscription state:
  # 1. Set subscription to each state in test DB
  # 2. View billing page
  # 3. Verify correct banner shown with appropriate CTA
  ```
- **Done:** Users can see their billing status clearly.

**Phase 3 Duration:** ~6 hours (2 + 2 + 2)  
**Can Deploy:** YES - Follows Phase 2

---

## Phase 4: Backlog (Post-Hotfix, Week 3-4 - Lower Priority)

**These are valuable but not blocking. Can be deferred after Phase 1-3 are live.**

### Task 4.1: Self-Serve Subscription Cancellation
- **Endpoint:** POST `/api/v1/billing/subscription/:id/cancel`
- **Behavior:** Cancel at period end (not immediate)
- **Files:** New endpoint + tests
- **Priority:** P2 - UX nice-to-have, reduces support tickets
- **Effort:** 3 hours

### Task 4.2: Invoice History Endpoint
- **Endpoint:** GET `/api/v1/billing/subscription/:id/invoices`
- **Behavior:** List invoices from Stripe
- **Files:** New endpoint + tests
- **Priority:** P2 - Support tool
- **Effort:** 2 hours

### Task 4.3: Payment Retry Endpoint
- **Endpoint:** POST `/api/v1/billing/subscription/:id/retry_payment`
- **Behavior:** Retry failed payment via Stripe
- **Files:** New endpoint + tests
- **Priority:** P2 - Reduces support load
- **Effort:** 2 hours

### Task 4.4: Analytics Dashboard for Revenue Metrics
- **Dashboard:** Internal dashboard showing:
  - Pricing funnel (viewed → checkout started → completed)
  - Enterprise leads (created → qualified)
  - Churn rate
  - MRR trend
- **Priority:** P2 - Business intelligence
- **Effort:** 6-8 hours
- **Tools:** Use PostHog/Segment API or internal analytics DB

### Task 4.5: Checkout Abandonment Recovery
- **Behavior:** Track users who start checkout but abandon; send recovery email after 15 min
- **Priority:** P2 - Conversion optimization
- **Effort:** 4 hours
- **Tools:** Use existing email system + background jobs (Sidekiq)

---

## Not Doing Now (Scope Boundary)

**These are out-of-scope for this revenue remediation plan:**

- ❌ **Banner monetization audit** - Requires separate detailed analysis
- ❌ **Mobile app billing** - Out of scope (web-only for now)
- ❌ **Advanced pricing models** (usage-based, seats-based) - Design decision deferred
- ❌ **Payment method management UI** - Users can manage in Stripe portal
- ❌ **Trial logic changes** - Existing trial flow sufficient for now
- ❌ **Dunning management** - Standard Stripe retry logic sufficient
- ❌ **Regional pricing** - Out of scope for MVP
- ❌ **Multi-currency support** - Out of scope for MVP

---

## Execution Sequence & Agent Assignment

**Recommended order of execution by agent type:**

### Wave 1: Planning & Architecture Review (Architect)
**Duration:** 2 hours  
**Agent:** `gsd-architect`  
**Tasks:**
- Review Phase 1 plan with team
- Validate feature access API design
- Confirm authorization patterns
- Identify any breaking changes
- Sign off on analytics event schema

**Checkpoint:** Architect approval before dev starts

---

### Wave 2: Phase 1 Backend Implementation (Dev)
**Duration:** 3 hours  
**Agent:** Dev (backend specialist)  
**Tasks:**
- 1.A.1: Feature access controller + route
- 1.A.2: Backend feature gate enforcement concern
- 1.A.3: Add tests
- 1.C.2: Analytics events in webhook
- 3.1: Fix SubscriptionSyncService edge case

**Output:** Backend ready for frontend integration

**Checkpoint:** `bundle exec rspec` passes, all tests green

---

### Wave 3: Phase 1 Frontend Implementation (Dev)
**Duration:** 2.5 hours  
**Agent:** Dev (frontend specialist)  
**Tasks:**
- 1.B.1: useCompanyFeatures hook
- 1.B.2: Update dashboard hardcoded checks
- 1.B.3: Update pricing page
- 1.C.1: Revenue events (pricing, checkout, enterprise, portal)
- 1.C.3: Checkout success tracking

**Output:** Frontend consuming backend feature access, events firing

**Checkpoint:** `npm run build` succeeds, no TypeScript errors, events visible in console

---

### Wave 4: Phase 1 Integration Testing (QA)
**Duration:** 2 hours  
**Agent:** QA or `gsd-integration-checker`  
**Tasks:**
- Test feature access end-to-end (Free user cannot access Pro feature)
- Test revenue funnel (pricing_viewed → checkout_started → checkout_completed)
- Test authorization (unauthorized user gets 403)
- Test with different plan types (Free, Pro, Enterprise)

**Output:** Integration test report

**Checkpoint:** All critical paths passing manual and automated tests

---

### Wave 5: Deployment & Verification (DevOps + Verifier)
**Duration:** 1 hour + monitoring  
**Agents:** DevOps, `gsd-verifier`  
**Tasks:**
- Deploy Phase 1 to staging
- Smoke tests:
  - Feature access API returns correct state
  - Dashboard shows backend-driven features
  - Revenue events appearing in analytics backend
- Deploy to production
- Monitor for errors/regressions (24 hours)

**Checkpoint:** Live in production, no critical errors, revenue events flowing

---

### Wave 6: Phase 2 Implementation (Dev)
**Duration:** 4 hours (after Phase 1 verified stable)  
**Agent:** Dev  
**Tasks:**
- 2.1: ErrorBanner component + replace alerts
- 2.2: Idempotency on checkout
- 2.3: Audit logging
- 2.4: Email notifications

**Checkpoint:** Staging tests pass

---

### Wave 7: Phase 2 Testing & Deployment (QA + DevOps)
**Duration:** 2 hours + monitoring  
**Agents:** QA, DevOps  
**Tasks:**
- Test error UI (kill backend, verify friendly error shown)
- Test idempotency (click checkout twice, same session)
- Test audit logs (billing action creates log entry)
- Test emails (plan change triggers email to owner)
- Deploy to production
- Monitor

**Checkpoint:** Live, errors friendly, audit trail working

---

### Wave 8: Phase 3 Implementation (Dev)
**Duration:** 3 hours (after Phase 2 stable)  
**Agent:** Dev  
**Tasks:**
- 3.1: SubscriptionSyncService edge case fix
- 3.2: Webhook failure alerting
- 3.3: Dashboard billing health indicator

**Checkpoint:** All edge cases handled gracefully

---

### Wave 9: Phase 3 Testing & Deployment (QA + DevOps)
**Duration:** 1.5 hours  
**Agents:** QA, DevOps  
**Tasks:**
- Test webhook failure recovery (simulate failure, check Slack alert)
- Test billing health display (each subscription state)
- Deploy to production
- Monitor error logs

**Checkpoint:** Live, edge cases handled, team alerted on failures

---

### Wave 10: Phase 4 Planning & Backlog (Architect + PM)
**Duration:** 1 hour  
**Agents:** Architect, PM  
**Tasks:**
- Prioritize Phase 4 items
- Estimate effort
- Schedule for subsequent sprints
- Create stories for backlog

**Checkpoint:** Backlog groomed, ready for future sprints

---

## Risk & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Feature access API breaks existing clients | MEDIUM | No breaking changes - new endpoint only. Test with existing clients. |
| Authorization policy too strict | MEDIUM | Phase 0 validation. Code review by architect. |
| Analytics events not firing | MEDIUM | Console logging + backend logging during Phase 1. |
| Webhook failure causes revenue loss | HIGH | Phase 3.2 fixes. Slack alerts + Sentry tracking. |
| Deployment breaks checkout | HIGH | Staging tests first. Zero-downtime deployment. |
| Database migration locks (audit logs) | MEDIUM | Run migration in low-traffic window. Test on staging first. |
| Cache coherence (idempotency) | LOW | Redis/Memcached well-established. Clear cache if needed. |

---

## Success Metrics (Post-Deployment)

**Week 1 (Phase 1 live):**
- ✅ Feature access API returning correct state for all plans
- ✅ 100% of pricing-view events tracked
- ✅ 80%+ of checkout-started events tracked
- ✅ No regression in checkout success rate

**Week 2 (Phase 2 live):**
- ✅ 0 users seeing browser alerts (all replaced with friendly errors)
- ✅ 100% of checkout attempts logged in audit trail
- ✅ 100% of admins receiving plan change notifications

**Week 3 (Phase 3 live):**
- ✅ 0 failed webhooks without team notification
- ✅ Subscription health dashboard clear to users
- ✅ No revenue data loss from failed lookups

**Week 4 (Phase 4 prioritized):**
- ✅ Phase 4 backlog estimated and scheduled
- ✅ Team has visibility into revenue funnel

---

## Files Summary

### Phase 1 Files (Create/Modify)
**Backend:**
- `AB0-1-back/app/controllers/api/v1/companies_controller.rb` - Add feature_access action
- `AB0-1-back/config/routes.rb` - Add route
- `AB0-1-back/app/controllers/concerns/feature_gate_enforceable.rb` - Create concern
- `AB0-1-back/app/services/billing/subscription_sync_service.rb` - Add analytics events
- `spec/requests/api/v1/companies/feature_access_spec.rb` - Create tests
- `spec/controllers/concerns/feature_gate_enforceable_spec.rb` - Create tests

**Frontend:**
- `AB0-1-front/hooks/useCompanyFeatures.ts` - Create hook
- `AB0-1-front/lib/api/companies.ts` - Create/update API client
- `AB0-1-front/app/dashboard/page.tsx` - Update feature checks
- `AB0-1-front/components/pricing/PricingPage.tsx` - Add analytics events, update checks
- `AB0-1-front/components/pricing/FeatureComparisonTable.tsx` - Update feature display

### Phase 2 Files
**Backend:**
- `AB0-1-back/app/services/billing/checkout_service.rb` - Add idempotency
- `AB0-1-back/app/models/billing_audit_log.rb` - Create model
- `AB0-1-back/db/migrate/XXXXX_create_billing_audit_logs.rb` - Create migration
- `AB0-1-back/app/controllers/api/v1/billing/checkout_controller.rb` - Log action
- `AB0-1-back/app/controllers/api/v1/billing/portal_controller.rb` - Log action
- `AB0-1-back/app/controllers/api/v1/billing/enterprise_leads_controller.rb` - Log action
- `AB0-1-back/app/mailers/billing_mailer.rb` - Create mailer
- `app/views/billing_mailer/subscription_changed.html.erb` - Create email template

**Frontend:**
- `AB0-1-front/components/billing/ErrorBanner.tsx` - Create component
- `AB0-1-front/components/pricing/PricingPage.tsx` - Use ErrorBanner
- `AB0-1-front/app/company-dashboard/billing/page.tsx` - Use ErrorBanner

### Phase 3 Files
**Backend:**
- `AB0-1-back/app/services/billing/subscription_sync_service.rb` - Edge case handling
- `AB0-1-back/app/controllers/api/v1/billing/webhooks_controller.rb` - Failure alerting

**Frontend:**
- `AB0-1-front/app/company-dashboard/billing/page.tsx` - Billing status banner
- `AB0-1-front/components/billing/SubscriptionStatusBanner.tsx` - Create/update component

---

## Dependencies & Prerequisites

**Before starting:**
- ✅ Phase 0 validation complete (audit findings confirmed)
- ✅ Team reviewed and approved Phase 1 plan
- ✅ Dev environment has:
  - [ ] Ruby 3.2+ (check with `ruby -v`)
  - [ ] Node 18+ (check with `node -v`)
  - [ ] Redis/Memcached running (for caching)
  - [ ] Stripe test credentials configured
  - [ ] Analytics (PostHog/Segment) test setup
- ✅ CI/CD pipeline configured for testing
- ✅ Staging environment available for testing before production

**External Service Dependencies:**
- Stripe API (already configured)
- Analytics provider (PostHog or Segment - already configured)
- Email service (Rails Action Mailer - already configured)
- Slack API for webhooks (check `.env` for SLACK_WEBHOOK_URL)

---

## Timeline & Effort Estimate

| Phase | Duration | Effort | When |
|-------|----------|--------|------|
| Phase 0 (Validation) | 30 min | Architect | Day 1 morning |
| Phase 1 (Hotfix) | 7 hours | Dev + QA | Day 1 afternoon → Day 2 morning |
| Phase 1 (Testing) | 2 hours | QA | Day 2 morning |
| Phase 1 (Deploy) | 1 hour | DevOps | Day 2 morning |
| Phase 2 (Implementation) | 4 hours | Dev | Day 2 afternoon |
| Phase 2 (Testing) | 2 hours | QA | Day 3 morning |
| Phase 2 (Deploy) | 1 hour | DevOps | Day 3 morning |
| Phase 3 (Implementation) | 3 hours | Dev | Day 3 afternoon |
| Phase 3 (Testing) | 1.5 hours | QA | Day 4 morning |
| Phase 3 (Deploy) | 1 hour | DevOps | Day 4 morning |
| Phase 4 (Backlog) | 1 hour | Architect + PM | Day 4 afternoon |
| **TOTAL** | **~24 hours** | **Dev: 14h, QA: 5.5h, DevOps: 3h, Architect: 1.5h** | **4 business days** |

---

## Communication Plan

**Daily standup:**
- Dev: "Completed {task}, blocked by {issue}, starting {next}"
- QA: "Testing {task}, found {bug}, ready to verify {task}"
- DevOps: "Deployed {version}, monitoring {issue}"

**Phase sign-off:**
- Architect signs off on design before dev starts phase
- QA signs off on testing before deploy
- DevOps signs off on monitoring post-deploy

**Weekly review:**
- Review completion % against timeline
- Adjust subsequent phases if needed
- Celebrate wins (feature gates working, revenue events flowing)

---

## Notes for Executor

1. **Use the audit reports as reference:** Both `INTEGRATION_CHECK_REVENUE_FLOWS.md` and `PHASE_2_REVENUE_AUDIT_REPORT.md` contain detailed evidence and code locations. Reference them when implementing.

2. **Start with Phase 0:** Don't skip validation. Takes 30 min, confirms audit still accurate.

3. **Deploy Phase 1 as hotfix:** Once complete and tested, deploy immediately. It's low-risk and unblocks subsequent work.

4. **Measure as you go:** After each phase deployment, check:
   - Are features accessible to right plans?
   - Are events flowing to analytics?
   - Are errors friendly?
   - Any regressions?

5. **Adjust if needed:** If you find the actual code significantly different from audit assumptions, update this plan. Don't force-fit.

6. **Phase 4 is optional:** If Phases 1-3 take longer, Phase 4 can wait. Revenue fundamentals are solid after Phase 3.

---

**Plan Ready for Execution**

Start with Phase 0 validation. Architect reviews and approves plan. Then proceed with Phase 1 hotfixes.

Questions? Refer to INTEGRATION_CHECK_REVENUE_FLOWS.md and PHASE_2_REVENUE_AUDIT_REPORT.md for detailed findings.


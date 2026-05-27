# Revenue System Architecture: Design & Decisions
## Avalia Solar - Feature Gates, Billing & Analytics Architecture

**Date:** 2026-05-27  
**Author:** Architect Review  
**Status:** ✅ Ready for Implementation  
**Audience:** Tech Lead, Backend Dev, Frontend Dev, QA  

---

## Overview

This document defines the authoritative architecture for:
- Feature gate computation, exposure & enforcement
- Revenue/billing analytics events
- Billing audit trail
- Checkout idempotency & reliability
- Backend enforcement for paid features
- Elimination of multiple sources of truth

**Guiding Principle:** Single Source of Truth (SSOT) at the backend. Frontend consumes it via API. Policies enforce it at request time.

---

## 1. Feature Gates: Single Source of Truth

### 1.1 Current State Analysis

**What Exists:**
- ✅ `Company#feature_access` - computed correctly, returns `{ feature_key: { state: 'enabled'/'locked', reason: '...' } }`
- ✅ `CompanyFeatureAccessResolver` - logic that computes state from plan + subscription
- ✅ `FeatureGateService` - wrapper around resolver (partially used in dashboard)
- ✅ `PlanFeatureCatalog` - defines which features exist in which plans
- ✅ `Plan#feature_flags` - stores feature config per plan

**What's Broken:**
- 🔴 No API endpoint exposes `feature_access` to frontend
- 🔴 Frontend hardcodes plan checks instead of consuming backend state
- 🔴 Paid endpoints may not enforce feature gates (direct API bypass possible)
- 🔴 Multiple sources of truth: policy logic, frontend checks, service logic may diverge

### 1.2 Architecture Decision: Feature Gate SSOT

**Decision:**

1. **Backend is the single source of truth for feature state.**
   - `Company#feature_access` becomes the authoritative method
   - All feature decisions flow from this one place
   - Recomputed on every request (no stale cache)

2. **Expose via API endpoint:** `GET /api/v1/companies/:id/feature_access`
   - Frontend calls this to know what user can do
   - Response cached client-side (with TTL)
   - Fallback to safe defaults if API fails

3. **Enforce at backend with concern:** `FeatureGateEnforceable`
   - Protect paid endpoints with `before_action :enforce_feature_access, only: [:paid_action]`
   - Consistent pattern across all controllers
   - Blocks access (403 Forbidden) if feature not enabled

4. **Frontend uses feature state, not hardcoded checks**
   - Call `useCompanyFeatures()` hook on mount
   - Check `features.feature_name.state === 'enabled'`
   - Never hardcode plan checks (e.g., `company.plan === 'pro'`)

5. **Deprecate/Eliminate:**
   - `FeatureGateService` → becomes thin wrapper (optional, keep for backward compat)
   - Frontend hardcoded checks → replace all with API consumption
   - Plan-based frontend logic → move to backend feature state

### 1.3 Implementation Pattern

**Backend:**
```ruby
# Source of truth:
company.feature_access
# => {
#   "intent_scores": { state: "enabled", reason: nil },
#   "social_proof": { state: "locked", reason: "upgrade_required" },
#   "webhooks": { state: "enabled", reason: nil },
#   "leads_tracking": { state: "locked", reason: "subscription_inactive" }
# }

# Enforcement in controller:
class Api::V1::AnalyticsController < ApplicationController
  include FeatureGateEnforceable
  before_action :enforce_feature_access, only: [:intent_scores, :webhooks]
  
  def intent_scores
    # Guaranteed feature is enabled
    @company = Company.find(params[:company_id])
    # ... fetch and return intent scores
  end
end

# Audit enforcement failures:
FeatureGateEnforceable#enforce_feature_access should log:
# - user_id, company_id, feature_name, reason for blocking
# - can be added to audit log later
```

**Frontend:**
```typescript
// Never do:
if (company.plan === 'pro') { render Feature; }

// Always do:
const { features } = useCompanyFeatures(company.id);
if (features.intent_scores?.state === 'enabled') {
  render Feature;
} else if (features.intent_scores?.state === 'locked') {
  render UpgradeCTA;
}
```

### 1.4 What Gets Removed

| Component | Action | Reason |
|-----------|--------|--------|
| Frontend plan checks | Remove all hardcoded `company.plan === 'pro'` | Backend is SSOT |
| `FeatureGateService` (if unused) | Deprecate or remove | Redundant wrapper |
| `Plan#feature_flags` direct use | Remove from frontend | Exposing too much |
| Divergent permission logic | Consolidate into `Company#feature_access` | Single source |

### 1.5 Backward Compatibility

- `Company#feature_access` remains unchanged (public API)
- `FeatureGateService` kept for 1 release (marked deprecated)
- Frontend feature access endpoint is new, no breaking changes
- Policies continue to work as-is

---

## 2. Feature Access API Contract

### 2.1 Endpoint Definition

**Route:** `GET /api/v1/companies/:id/feature_access`

**Authorization:**
- User must be logged in
- User must be active member or owner of company
- Use existing `CompanyPolicy#show?` (already validates company membership)

**Response Format (JSON):**
```json
{
  "features": {
    "intent_scores": {
      "state": "enabled" | "locked" | "limited" | "trial",
      "reason": null | "upgrade_required" | "subscription_inactive" | "trial_expired",
      "expires_at": null | "2026-06-30T23:59:59Z",
      "limit": null | { requests_per_month: 1000 }
    },
    "social_proof": { "state": "locked", "reason": "upgrade_required" },
    "webhooks": { "state": "enabled", "reason": null },
    "leads_tracking": { "state": "locked", "reason": "upgrade_required" },
    "custom_ctas": { "state": "enabled", "reason": null },
    "api_access": { "state": "locked", "reason": "upgrade_required" }
  },
  "plan": "free" | "pro" | "enterprise",
  "subscription": {
    "status": "active" | "trialing" | "past_due" | "canceled" | "incomplete",
    "current_period_start": "2026-01-01T00:00:00Z",
    "current_period_end": "2026-02-01T00:00:00Z",
    "trial_end": null | "2026-06-27T00:00:00Z",
    "canceled_at": null | "2026-05-20T00:00:00Z"
  },
  "metadata": {
    "timestamp": "2026-05-27T11:57:14Z",
    "version": 1,
    "cache_ttl_seconds": 300
  }
}
```

**State Meanings:**
- `enabled`: Feature fully accessible, no restrictions
- `locked`: Feature not accessible for this plan/subscription
- `limited`: Feature accessible with usage limits (e.g., 1000 API calls/month)
- `trial`: Feature available during trial period only

**Reason Codes:**
- `null`: No special reason (feature is enabled)
- `upgrade_required`: Feature available in higher plan
- `subscription_inactive`: Subscription past due, canceled, or incomplete
- `trial_expired`: Trial period ended
- `free_tier_limit`: Free plan has reached usage limit
- `company_archived`: Company is archived/deleted

**Optional Fields (for Pro+):**
- `limit`: Usage limits if applicable (e.g., API calls, monthly bandwidth)
- `expires_at`: When feature access expires (e.g., trial end date)

### 2.2 Error Handling

**404 Not Found:**
```json
{ "error": "Company not found" }
```

**403 Forbidden:**
```json
{ 
  "error": "Unauthorized",
  "reason": "User is not a member of this company"
}
```

**500 Internal Server Error (fallback safe):**
```json
{
  "error": "Unable to determine feature access",
  "features": null,
  "metadata": { "fallback_timestamp": "2026-05-27T11:57:14Z" }
}
```

Frontend should treat `null` features as "unknown, don't render paid features."

### 2.3 Performance Considerations

- **No N+1 queries:** Use includes/joins to fetch Company → Plan → Subscription in one query
- **Cache client-side:** TTL 300 seconds (5 minutes) after fetch
- **Invalidate on:** Subscription change webhook, manual cache clear endpoint
- **Endpoint should respond in <100ms** on cached paths

---

## 3. Backend Enforcement Pattern

### 3.1 The Concern: FeatureGateEnforceable

**Location:** `app/controllers/concerns/feature_gate_enforceable.rb`

**Pattern:**
```ruby
module FeatureGateEnforceable
  def enforce_feature_access(feature_name, company_id = nil)
    company_id ||= params[:company_id]
    company = Company.find(company_id)
    feature_state = company.feature_access[feature_name.to_s]
    
    unless feature_state&.dig('state') == 'enabled'
      reason = feature_state&.dig('reason') || 'unknown'
      log_feature_enforcement_block(company, feature_name, reason)
      
      render json: {
        error: 'Feature not available in your plan',
        plan: company.plan_tier,
        feature: feature_name,
        reason: reason,
        suggestion: 'Upgrade your plan to unlock this feature'
      }, status: :forbidden
    end
  end
  
  private
  
  def log_feature_enforcement_block(company, feature, reason)
    # Log to audit log (Phase 2)
    Rails.logger.warn(
      "Feature enforcement: company=#{company.id}, feature=#{feature}, reason=#{reason}"
    )
  end
end
```

**Usage in Controllers:**
```ruby
class Api::V1::AnalyticsController < ApplicationController
  include FeatureGateEnforceable
  
  before_action :enforce_feature_access, only: [:intent_scores, :webhooks, :social_proof]
  
  def intent_scores
    # If we reach here, feature is guaranteed enabled
    @company = Company.find(params[:company_id])
    render json: @company.intent_scores, status: :ok
  end
  
  def webhooks
    @company = Company.find(params[:company_id])
    render json: @company.webhooks, status: :ok
  end
end

class Api::V1::LeadsController < ApplicationController
  include FeatureGateEnforceable
  
  before_action :enforce_feature_access, only: [:create]
  
  def create
    # Feature guaranteed enabled
    @lead = @company.leads.create!(lead_params)
    render json: @lead, status: :created
  end
end
```

### 3.2 Protected Endpoints (Initial Phase 1)

| Endpoint | Feature | Policy | Status |
|----------|---------|--------|--------|
| `GET /api/v1/analytics/intent_scores` | intent_scores | Pro+ | Add enforcement |
| `GET /api/v1/analytics/webhooks` | webhooks | Pro+ | Add enforcement |
| `GET /api/v1/analytics/social_proof` | social_proof | Pro+ | Add enforcement |
| `POST /api/v1/leads` | leads_tracking | Pro+ | Add enforcement |
| `GET /api/v1/ctas` | custom_ctas | Pro+ | Add enforcement |
| `GET /api/v1/api_keys` | api_access | Enterprise | Add enforcement |

### 3.3 Audit Logging (Phase 2)

When feature enforcement blocks:
- Log to `BillingAuditLog` table
- Include: user_id, company_id, feature_name, reason, timestamp
- Can query later: "Who tried to access intent_scores without Pro?"

---

## 4. Frontend Feature Gate Consumption

### 4.1 Hook: useCompanyFeatures

**Location:** `hooks/useCompanyFeatures.ts`

**Behavior:**
```typescript
export const useCompanyFeatures = (companyId: number | null) => {
  const [features, setFeatures] = useState<Record<string, FeatureState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: any; timestamp: number }>({ data: {}, timestamp: 0 });
  
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    
    // Check client-side cache (5 min TTL)
    const cached = cacheRef.current;
    if (cached.data && Date.now() - cached.timestamp < 300000) {
      setFeatures(cached.data);
      setLoading(false);
      return;
    }
    
    // Fetch from API
    companiesApi.getFeatureAccess(companyId)
      .then(resp => {
        const featureData = resp.features || {};
        setFeatures(featureData);
        cacheRef.current = { data: featureData, timestamp: Date.now() };
      })
      .catch(err => {
        console.error('Failed to fetch feature access:', err);
        setError(err.message);
        // Fallback: assume no paid features
        setFeatures({});
      })
      .finally(() => setLoading(false));
  }, [companyId]);
  
  return { features, loading, error };
};
```

**Type Definition:**
```typescript
interface FeatureState {
  state: 'enabled' | 'locked' | 'limited' | 'trial';
  reason?: string;
  expires_at?: string;
  limit?: { requests_per_month: number };
}

interface CompanyFeaturesResponse {
  features: Record<string, FeatureState>;
  plan: 'free' | 'pro' | 'enterprise';
  subscription: {
    status: string;
    current_period_end?: string;
    trial_end?: string;
  };
  metadata: { timestamp: string; version: number; cache_ttl_seconds: number };
}
```

### 4.2 Component Pattern

**Before (Hardcoded):**
```tsx
// Bad: Hardcoded check
if (company.plan === 'pro') {
  return <IntentScoresWidget />;
}
```

**After (Backend-Driven):**
```tsx
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';

export const DashboardPage = () => {
  const { company } = useUser();
  const { features, loading, error } = useCompanyFeatures(company?.id);
  
  if (error) {
    return <ErrorBanner message="Unable to load features" />;
  }
  
  const intentScoresState = features.intent_scores?.state;
  
  return (
    <div>
      {intentScoresState === 'enabled' && <IntentScoresWidget />}
      {intentScoresState === 'locked' && (
        <UpgradeCTA 
          feature="Intent Scores"
          plan="Pro"
          reason={features.intent_scores?.reason}
        />
      )}
      {intentScoresState === 'limited' && (
        <IntentScoresWidget limited={true} />
      )}
      {!intentScoresState && loading && <Spinner />}
    </div>
  );
};
```

### 4.3 Invalidation Strategy

**Cache is invalidated when:**
1. User manually upgrades plan (redirect to dashboard, clear cache)
2. Subscription webhook received (post message to all tabs via Service Worker)
3. User manually clicks "Refresh" button
4. 5 minutes elapsed (TTL)

**Invalidation Implementation:**
```typescript
// In API client after checkout success:
export const invalidateCompanyFeaturesCache = (companyId: number) => {
  // Clear hook cache
  sessionStorage.removeItem(`company_features_${companyId}`);
  
  // Broadcast to all tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('features-changed', { detail: { companyId } }));
  }
};

// In useCompanyFeatures hook:
useEffect(() => {
  const handler = (e: Event) => {
    if ((e as CustomEvent).detail.companyId === companyId) {
      refetch();
    }
  };
  window.addEventListener('features-changed', handler);
  return () => window.removeEventListener('features-changed', handler);
}, [companyId]);
```

---

## 5. Revenue/Analytics Events Architecture

### 5.1 Event Types & Triggers

| Event | Triggered By | Fired In | Payload | P0 |
|-------|--------------|----------|---------|-----|
| `pricing_viewed` | User visits `/pricing` | Frontend onMount | user_id, company_id, timestamp | ✅ |
| `checkout_started` | User clicks "Upgrade" button | Frontend checkout click | company_id, plan_id, plan_name, price_cents | ✅ |
| `checkout_completed` | Webhook: `checkout.session.completed` | Backend webhook | company_id, stripe_session_id, plan_id, amount_paid_cents | ✅ |
| `checkout_failed` | Stripe checkout fails (user closes) | Frontend on error | company_id, reason | ✅ |
| `subscription_activated` | Webhook: `customer.subscription.created` | Backend webhook | company_id, stripe_subscription_id, plan_id | ✅ |
| `subscription_canceled` | Webhook: `customer.subscription.deleted` | Backend webhook | company_id, stripe_subscription_id, plan_id, cancellation_reason | ✅ |
| `subscription_past_due` | Webhook: `invoice.payment_failed` | Backend webhook | company_id, stripe_subscription_id, amount_cents | ✅ |
| `enterprise_lead_created` | User submits enterprise form | Backend create | company_id, estimated_mrr, user_email, user_name | ✅ |
| `portal_opened` | User clicks "Manage subscription" | Frontend/redirect | company_id, stripe_customer_id | ✅ |
| `feature_gate_blocked` | User tries locked feature | Backend enforcement | company_id, feature_name, reason | 🟡 |
| `feature_upgrade_clicked` | User clicks "Upgrade" from locked feature | Frontend click | company_id, feature_name, target_plan | 🟡 |

### 5.2 Analytics Architecture

**Decision: Dual-Channel Analytics**

1. **Frontend Events** → PostHog/Segment/GA4 (user behavior tracking)
2. **Backend Events** → Logging + Server-Side Tracking (revenue-critical events)

**Pattern:**

**Frontend:**
```typescript
import { analytics } from '@/lib/analytics';

// Page view
useEffect(() => {
  analytics.track('pricing_viewed', {
    user_id: user?.id,
    company_id: user?.company_id
  });
}, [user?.id]);

// Button click
const handleCheckout = async (plan) => {
  analytics.track('checkout_started', {
    company_id: user.company_id,
    plan_id: plan.id,
    plan_name: plan.name,
    price_cents: plan.price_cents
  });
  
  try {
    const session = await billingApi.createCheckoutSession(plan.id);
    window.location.href = session.checkout_url;
  } catch (err) {
    analytics.track('checkout_failed', {
      company_id: user.company_id,
      reason: err.message
    });
  }
};
```

**Backend:**
```ruby
# app/services/analytics/revenue_events.rb
module Analytics
  class RevenueEvents
    def self.track(event_name, properties = {})
      # Write to database
      AnalyticsEvent.create!(
        event_name: event_name,
        company_id: properties[:company_id],
        user_id: properties[:user_id],
        payload: properties,
        timestamp: Time.current
      )
      
      # Also send to PostHog if available
      PostHog.capture(
        distinct_id: properties[:user_id] || properties[:company_id],
        event: event_name,
        properties: properties.except(:user_id, :company_id)
      )
    rescue => e
      Rails.logger.error("Analytics event failed: #{e.message}")
    end
  end
end

# In webhook handler:
class Billing::StripeWebhookHandler
  def handle_checkout_session_completed(session)
    company = Company.find_by(stripe_customer_id: session.customer)
    
    Analytics::RevenueEvents.track('checkout_completed', {
      company_id: company.id,
      stripe_session_id: session.id,
      plan_id: Plan.find_by(stripe_price_id: session.line_items.data[0].price.id).id,
      amount_paid_cents: session.amount_total
    })
  end
end
```

### 5.3 What NOT to Track (Privacy & Security)

**Forbidden Fields:**
- Credit card numbers (never, ever)
- Stripe secret keys
- Customer names or emails in analytics (use IDs only)
- IP addresses unless needed for fraud detection
- Full request bodies

**Allowed Fields:**
- company_id, user_id
- plan_id, stripe_subscription_id
- amounts in cents (anonymized)
- timestamps
- feature names
- reason codes (not free-text errors)

---

## 6. Billing Audit Log Architecture

### 6.1 Model: BillingAuditLog

**Location:** `app/models/billing_audit_log.rb`

**Schema:**
```ruby
class CreateBillingAuditLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :billing_audit_logs do |t|
      t.references :user, foreign_key: true, null: true  # Who did it
      t.references :company, foreign_key: true           # Which company
      t.integer :action, null: false                      # checkout_initiated, portal_opened, etc.
      t.references :plan, foreign_key: true, null: true  # Which plan
      t.references :billing_company_subscription, foreign_key: true, null: true
      
      # Stripe IDs for correlation
      t.string :stripe_customer_id
      t.string :stripe_subscription_id
      t.string :stripe_session_id
      t.string :request_id  # Idempotency key or correlation ID
      
      # Request context
      t.string :ip_address, null: true
      t.string :user_agent, null: true
      t.string :referer, null: true
      
      # Outcome
      t.integer :status_code  # 200, 403, 500, etc.
      t.jsonb :metadata, default: {}  # Custom data: error message, reason codes, etc.
      
      t.timestamps
    end
    
    # Indexes for querying
    add_index :billing_audit_logs, [:company_id, :created_at]
    add_index :billing_audit_logs, [:user_id, :created_at]
    add_index :billing_audit_logs, :stripe_customer_id
    add_index :billing_audit_logs, :stripe_subscription_id
    add_index :billing_audit_logs, :request_id
  end
end

class BillingAuditLog < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :company
  belongs_to :plan, optional: true
  belongs_to :billing_company_subscription, optional: true
  
  enum action: {
    checkout_initiated: 0,
    checkout_completed: 1,
    checkout_failed: 2,
    portal_opened: 3,
    enterprise_lead_created: 4,
    webhook_processed: 5,
    subscription_updated: 6,
    subscription_canceled: 7,
    feature_gate_blocked: 8,
    plan_changed: 9
  }
  
  # Scopes for operations
  scope :for_company, ->(id) { where(company_id: id) }
  scope :for_user, ->(id) { where(user_id: id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_action, ->(action) { where(action: action) }
end
```

### 6.2 Recording Audit Events

**In Controllers:**
```ruby
class Api::V1::BillingController < ApplicationController
  def create_checkout_session
    company = Company.find(params[:company_id])
    authorize company, :create_checkout?, policy_class: BillingPolicy
    
    begin
      session = Billing::CheckoutService.new(company, plan).create
      
      BillingAuditLog.create!(
        user_id: current_user.id,
        company_id: company.id,
        plan_id: plan.id,
        action: :checkout_initiated,
        stripe_customer_id: company.stripe_customer_id,
        request_id: request.request_id,
        ip_address: request.remote_ip,
        user_agent: request.user_agent,
        status_code: 200,
        metadata: { checkout_url: session.url }
      )
      
      render json: { checkout_url: session.url }, status: :ok
    rescue => e
      BillingAuditLog.create!(
        user_id: current_user.id,
        company_id: company.id,
        plan_id: plan.id,
        action: :checkout_initiated,
        request_id: request.request_id,
        status_code: 500,
        metadata: { error: e.message }
      )
      
      raise
    end
  end
end
```

**In Webhooks:**
```ruby
class Billing::StripeWebhookHandler
  def handle_checkout_session_completed(session)
    company = Company.find_by(stripe_customer_id: session.customer)
    subscription_id = session.subscription
    
    BillingAuditLog.create!(
      company_id: company.id,
      action: :checkout_completed,
      stripe_customer_id: session.customer,
      stripe_session_id: session.id,
      stripe_subscription_id: subscription_id,
      request_id: session.client_reference_id,
      status_code: 200,
      metadata: {
        amount_paid_cents: session.amount_total,
        currency: session.currency
      }
    )
  end
end
```

### 6.3 Audit Log Retention & Privacy

- **Retention:** 24 months (SaaS standard)
- **PII:** Only user_id and company_id stored, not email/name
- **Access:** Only ops team and admins (add policy later)
- **Export:** For compliance, query by company_id and date range

---

## 7. Checkout Idempotency

### 7.1 Problem

User clicks "Upgrade" twice in quick succession → Two checkout sessions created → Confusion, double charges possible.

### 7.2 Solution: Cache-Based Idempotency

**Pattern:**
```ruby
# app/services/billing/checkout_service.rb
class Billing::CheckoutService
  def create_checkout_session(plan)
    cache_key = "checkout_session:#{@company.id}:#{plan.id}:#{current_user_id}"
    
    # Check cache first (5-minute TTL)
    cached_url = Rails.cache.read(cache_key)
    return cached_url if cached_url.present?
    
    # Create new session
    stripe_session = Stripe::Checkout::Session.create(
      customer: @company.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: "#{ENV['FRONTEND_URL']}/billing/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "#{ENV['FRONTEND_URL']}/pricing",
      client_reference_id: "#{@company.id}:#{current_user_id}:#{Time.current.to_i}"
    )
    
    # Cache the URL
    Rails.cache.write(cache_key, stripe_session.url, expires_in: 5.minutes)
    
    # Audit
    BillingAuditLog.create!(
      user_id: current_user_id,
      company_id: @company.id,
      action: :checkout_initiated,
      stripe_session_id: stripe_session.id,
      status_code: 200
    )
    
    stripe_session.url
  end
end
```

**Frontend:**
```typescript
const [isCheckingOut, setIsCheckingOut] = useState(false);

const handleCheckout = async (plan: Plan) => {
  if (isCheckingOut) return; // Prevent double-click
  
  setIsCheckingOut(true);
  try {
    const { checkout_url } = await billingApi.createCheckoutSession(plan.id);
    window.location.href = checkout_url;
  } catch (err) {
    setError(err.message);
  } finally {
    setIsCheckingOut(false);
  }
};
```

**Behavior:**
- First click: Creates session, caches URL
- Second click (within 5 min): Returns cached URL (same session)
- After 5 min: Creates new session (user probably gave up)

### 7.3 Stripe Idempotency Key

**Also use Stripe's native idempotency:**
```ruby
Stripe::Checkout::Session.create(
  # ... params ...
  idempotency_key: "checkout:#{company.id}:#{plan.id}:#{current_user_id}"
)
```

This ensures Stripe also deduplicates if our cache fails.

---

## 8. SubscriptionSyncService Edge Cases

### 8.1 Problem

Webhook arrives: `customer.subscription.created`  
Company lookup fails: `Company.find_by(stripe_customer_id: '...')` → nil  
Service raises error → Webhook fails (Stripe retries forever)  
Silent revenue loss

### 8.2 Solution: Graceful Degradation

**Pattern:**
```ruby
# app/services/billing/subscription_sync_service.rb
class Billing::SubscriptionSyncService
  def sync(stripe_event)
    stripe_sub = stripe_event.data.object
    company = Company.find_by(stripe_customer_id: stripe_sub.customer)
    
    if company.nil?
      # Don't crash. Log and alert ops.
      handle_unknown_company(stripe_event, stripe_sub)
      return { status: :unmatched, reason: 'company_not_found' }
    end
    
    # ... normal sync logic ...
    update_company_subscription(company, stripe_sub)
    
    { status: :synced, company_id: company.id }
  end
  
  private
  
  def handle_unknown_company(stripe_event, stripe_sub)
    # Create pending/unmatched record for manual reconciliation
    UnmatchedStripeEvent.create!(
      event_id: stripe_event.id,
      event_type: stripe_event.type,
      stripe_customer_id: stripe_sub.customer,
      stripe_subscription_id: stripe_sub.id,
      stripe_data: stripe_event.data.object.to_hash,
      status: 'pending_investigation'
    )
    
    # Alert ops
    Billing::SlackNotifier.alert(
      "Unmatched Stripe event",
      {
        event_id: stripe_event.id,
        event_type: stripe_event.type,
        stripe_customer_id: stripe_sub.customer,
        link: "https://dashboard.stripe.com/customers/#{stripe_sub.customer}"
      }
    )
    
    # Log for debugging
    Rails.logger.warn(
      "Subscription sync: company not found for stripe_customer=#{stripe_sub.customer}"
    )
  end
end

# In webhook controller:
class Api::V1::Billing::WebhooksController < ApplicationController
  def create
    event = Stripe::Event.construct_from(JSON.parse(request.body.read))
    
    result = Billing::SubscriptionSyncService.new.sync(event)
    
    # Return 200 to Stripe either way (successful processing)
    render json: { status: 'received', sync_result: result }, status: 200
  end
end
```

**Behavior:**
- Webhook arrives
- Company lookup fails → Create `UnmatchedStripeEvent` record
- Alert Slack with link to Stripe dashboard
- Return 200 to Stripe (Stripe stops retrying)
- Ops can manually investigate via dashboard

### 8.3 UnmatchedStripeEvent Model

```ruby
class UnmatchedStripeEvent < ApplicationRecord
  enum status: { pending_investigation: 0, resolved: 1, archived: 2 }
  
  validates :event_id, uniqueness: true
  validates :stripe_customer_id, presence: true
  
  scope :unresolved, -> { where(status: :pending_investigation) }
  scope :recent, -> { order(created_at: :desc) }
  
  # Admin can manually resolve:
  def resolve_with_company(company_id)
    company = Company.find(company_id)
    sync_result = Billing::SubscriptionSyncService.new.sync_from_data(
      self.stripe_data,
      company
    )
    update!(status: :resolved, resolved_at: Time.current)
    sync_result
  end
end
```

---

## 9. Future Endpoints (Backlog)

### 9.1 Self-Serve Cancellation

**Endpoint:** `POST /api/v1/companies/:id/subscriptions/cancel`

**Status:** P2 (post-launch, backlog)

**Design Sketch:**
```ruby
# Authorization: Company owner/admin only
# Policy: BillingPolicy#cancel_subscription?

# Payload:
{ feedback: "Feature doesn't fit our use case", immediate: false }

# Behavior:
# - immediate: true → cancel now
# - immediate: false → cancel at period end
# - Send cancellation email to owner
# - Log to audit log
# - Update company status to 'pending_cancellation'

# Response:
{
  subscription: { status: 'canceled', canceled_at: '...' },
  next_billing_date: null | '2026-06-30'
}
```

### 9.2 Invoice History

**Endpoint:** `GET /api/v1/companies/:id/invoices`

**Status:** P2 (post-launch)

**Design Sketch:**
```ruby
# Fetch from Stripe or local cache
# Return last 24 months
# Include paid, draft, void statuses

# Response:
{
  invoices: [
    {
      stripe_invoice_id: 'inv_...',
      number: 'INV-001',
      date: '2026-05-27',
      amount_cents: 50000,
      status: 'paid' | 'draft' | 'void',
      pdf_url: '...'
    }
  ]
}
```

### 9.3 Retry Payment

**Endpoint:** `POST /api/v1/companies/:id/invoices/:invoice_id/retry`

**Status:** P3 (low priority)

**Design:** Retry failed payment for past-due invoice

---

## 10. Architecture Decision Record (ADR)

### ADR-1: Single Source of Truth for Feature Access

**Decision:** Backend `Company#feature_access` is the single source of truth. All feature decisions flow from this method.

**Rationale:**
- Eliminates multiple sources of truth (policy logic, frontend checks, services)
- Allows plan changes to propagate instantly (no cache stale issues)
- Makes auditing/debugging easier (one method to inspect)
- Enforces feature gates at backend (frontend is untrusted)

**Consequences:**
- Frontend must make API call to know feature state (minimal latency impact, cached)
- Changes to feature logic require backend code change + API versioning
- Requires robust error handling (fallback to safe defaults if API fails)

**Alternatives Considered:**
1. Token-based feature flags sent at login → Would require re-login for plan changes
2. Feature flags in localStorage → Stale data, security risk
3. Compute on frontend from plan → Duplicates logic, unmaintainable

**Implementation Guidance:**
1. Add `GET /api/v1/companies/:id/feature_access` endpoint
2. Frontend calls on mount, caches 5 minutes
3. Invalidate on subscription change webhook
4. Remove all hardcoded plan checks from frontend

**Test Guidance:**
- Test free, pro, enterprise plans
- Test during trial vs. after trial expires
- Test subscription canceled state
- Test API error handling (should fallback to safe)

---

### ADR-2: Dual-Channel Analytics (Frontend + Backend)

**Decision:** Track revenue events in two channels:
- Frontend → PostHog/GA4 (user behavior)
- Backend → Database + PostHog (revenue-critical)

**Rationale:**
- Frontend events give UX insights (where do users drop off?)
- Backend events are authoritative for revenue (webhook source of truth)
- Decouple user analytics from financial events
- Allows server-side tracking without JS

**Consequences:**
- Need to maintain two event taxonomies (frontend events vs. revenue events)
- Requires schema documentation (what fields are required for each event)
- Analytics queries need to be careful not to double-count

**Alternatives Considered:**
1. Only frontend events → Loss of server-side revenue truth
2. Only backend events → No UX visibility
3. Firebase Analytics → Unnecessary lock-in

**Implementation Guidance:**
1. Create `Analytics::RevenueEvents.track` service
2. Define event types in enum or constant
3. Separate frontend tracking (PostHog SDK) from backend tracking
4. Test with staging webhook events

**Test Guidance:**
- Verify events reach database
- Verify events reach PostHog
- Verify no double-tracking
- Test webhook events are recorded

---

### ADR-3: Graceful Degradation for Webhook Failures

**Decision:** When webhook processing fails (e.g., company not found), create unmatched record, alert ops, return 200 to Stripe.

**Rationale:**
- Prevents Stripe from retrying forever (hammer Stripe API)
- Allows manual reconciliation later
- Doesn't break user experience (they're already charged)
- Provides audit trail for investigation

**Consequences:**
- Unmatched events must be monitored (ops burden)
- Manual reconciliation process needed
- Requires `UnmatchedStripeEvent` table + admin UI

**Alternatives Considered:**
1. Raise error, let Stripe retry → Infinite retries, noisy
2. Silently ignore → Revenue loss, no audit trail
3. Queue for later retry → Complexity, failure modes

**Implementation Guidance:**
1. Create `UnmatchedStripeEvent` model
2. Add Slack alert on unmatched events
3. Create admin dashboard to view/resolve
4. Document manual reconciliation process

**Test Guidance:**
- Simulate company_id mismatch
- Verify Slack alert sent
- Verify webhook returns 200
- Verify record created for reconciliation

---

### ADR-4: Feature Gate Enforcement via Concern

**Decision:** Use `FeatureGateEnforceable` concern for consistent enforcement across controllers.

**Rationale:**
- DRY principle (don't repeat check in every controller)
- Consistent error messages
- Audit logging in one place
- Easy to test

**Consequences:**
- Controllers must include concern and use before_action
- Requires mapping of endpoints to feature names
- Feature name changes require updating multiple before_action calls

**Alternatives Considered:**
1. Policy-based enforcement → More complex, less straightforward
2. Middleware → Can't easily map to specific actions
3. Decorator pattern → Overkill for this use case

**Implementation Guidance:**
1. Create `app/controllers/concerns/feature_gate_enforceable.rb`
2. Include in controllers that have paid endpoints
3. Use `before_action :enforce_feature_access, only: [:paid_action]`
4. Log enforcement blocks to audit log

**Test Guidance:**
- Test that paid endpoint rejects free user with 403
- Test that paid endpoint accepts pro user with 200
- Test error message includes feature name
- Test audit log records the block

---

### ADR-5: Checkout Idempotency via Cache

**Decision:** Use Rails.cache with 5-minute TTL to deduplicate checkout sessions.

**Rationale:**
- Simple to implement (one cache read/write)
- Works across server instances (uses Redis)
- Expires automatically (doesn't clutter cache)
- Also use Stripe idempotency key as backup

**Consequences:**
- If cache is cleared, user might create duplicate session
- User can't change plan within 5 minutes (cached session for same plan)
- Requires Redis/Memcached in production

**Alternatives Considered:**
1. Database record with deduplication → Overkill, cache is enough
2. Stripe idempotency key only → Doesn't help on second click, still charges
3. Frontend state machine → Can't survive browser refresh

**Implementation Guidance:**
1. In `CheckoutService#create`, check cache before Stripe call
2. Write session URL to cache with 5-min TTL
3. Also include Stripe idempotency key
4. Audit log each checkout attempt (cached or new)

**Test Guidance:**
- Verify first click creates session
- Verify second click (within 5 min) returns same URL
- Verify click after 5 min creates new session
- Verify cache works across requests

---

## 11. Implementation Roadmap Summary

| Phase | Component | P0 | Status |
|-------|-----------|-----|--------|
| Phase 1 | Feature Access API | ✅ | Core hotfix |
| Phase 1 | Feature Gate Enforcement Concern | ✅ | Core hotfix |
| Phase 1 | Frontend useCompanyFeatures Hook | ✅ | Core hotfix |
| Phase 1 | Revenue Event Tracking | ✅ | Core hotfix |
| Phase 2 | Checkout UX (error messages) | 🟡 | After Phase 1 |
| Phase 2 | Audit Logging | 🟡 | After Phase 1 |
| Phase 2 | Idempotency Cache | 🟡 | After Phase 1 |
| Phase 3 | SubscriptionSyncService Graceful Degradation | 🟡 | After Phase 2 |
| Phase 4 | UnmatchedStripeEvent Admin Dashboard | 🔴 | Backlog |
| Phase 4 | Cancellation Self-Serve | 🔴 | Backlog |
| Phase 4 | Invoice History | 🔴 | Backlog |

---

## 12. Success Criteria

**Feature Access API:**
- ✅ Endpoint responds with feature state (enabled/locked/limited/trial)
- ✅ Authorization correctly restricts to company members
- ✅ 95%+ accuracy matching backend `company.feature_access`
- ✅ Responds in <100ms on average (cached path)

**Enforcement:**
- ✅ Free users cannot access Pro endpoints (403 response)
- ✅ Pro users can access Pro endpoints (200 response)
- ✅ All paid endpoints protected by before_action
- ✅ Audit log records all enforcement blocks

**Frontend Consumption:**
- ✅ No hardcoded plan checks remaining
- ✅ All feature gates consumed from API
- ✅ Components render correctly for each plan tier
- ✅ Cache invalidation works on subscription change

**Analytics:**
- ✅ All critical revenue events tracked
- ✅ Events flow to database + analytics provider
- ✅ No double-tracking
- ✅ PII not tracked (only IDs)

**Audit Logging:**
- ✅ All billing actions recorded
- ✅ Request context captured (IP, user-agent)
- ✅ Timestamps accurate
- ✅ No sensitive data stored

---

## 13. Validation Checklist Before Implementation

**Architect/Tech Lead Must Confirm:**

- [ ] Feature access endpoint contract approved
- [ ] Enforcement concern pattern acceptable
- [ ] Analytics event taxonomy agreed upon
- [ ] Audit log schema approved
- [ ] Idempotency approach acceptable
- [ ] Edge case handling (unmatched webhooks) approved
- [ ] No conflicts with existing code patterns
- [ ] Backward compatibility confirmed
- [ ] Performance assumptions validated (cache TTL, query count)

**Dev Team Must Confirm (Phase 0):**

- [ ] Read and understood all architecture decisions
- [ ] Confirmed all referenced files exist in codebase
- [ ] Identified any conflicting logic to remove
- [ ] Staging environment ready for testing
- [ ] CI/CD pipeline tested
- [ ] Ready to start Phase 1 implementation

---

## Conclusion

This architecture document provides:

1. **Single source of truth** for feature access (backend `Company#feature_access`)
2. **API contract** for frontend to consume feature state (`GET /api/v1/companies/:id/feature_access`)
3. **Enforcement pattern** to protect paid endpoints (FeatureGateEnforceable concern)
4. **Analytics architecture** for revenue tracking (dual-channel)
5. **Audit logging** for billing compliance (BillingAuditLog model)
6. **Idempotency** for checkout reliability (cache + Stripe keys)
7. **Edge case handling** for webhook failures (graceful degradation)
8. **Architecture decisions** with rationale and consequences (ADRs)

**This architecture eliminates multiple sources of truth, ensures feature enforcement at the backend, and provides comprehensive audit trails for revenue operations.**

Implementation can begin in Phase 1 (Day 1-2) with high confidence.


# Revenue Remediation - Quick Reference for Developers
## Avalia Solar - Billing & Feature Gates Fixes

**TL;DR:** 4-day plan. Phase 1 (hotfix) blocks on Day 1-2. Phases 2-3 follow. Phase 4 optional backlog.

---

## Phase 1 Tasks (Day 1-2) - DO FIRST

### Backend Dev: Feature Access API + Tests (3 hours)

**Task 1: Add endpoint `GET /api/v1/companies/:id/feature_access`**
```ruby
# Add to routes.rb (api/v1 namespace):
get 'companies/:id/feature_access', to: 'companies#feature_access'

# Add to app/controllers/api/v1/companies_controller.rb:
def feature_access
  company = Company.find(params[:id])
  authorize company, :show?, policy_class: CompanyPolicy
  
  render json: {
    features: company.feature_access,
    plan: company.plan_tier,
    subscription_status: company.current_subscription&.status,
    metadata: { timestamp: Time.current, version: 1 }
  }, status: :ok
rescue StandardError => e
  render json: { error: e.message }, status: e.is_a?(ActiveRecord::RecordNotFound) ? 404 : 500
end
```

**Task 2: Add feature gate enforcement**
```ruby
# Create app/controllers/concerns/feature_gate_enforceable.rb:
module FeatureGateEnforceable
  def enforce_feature_access(feature_name)
    company = Company.find(params[:company_id])
    feature_state = company.feature_access[feature_name.to_s]
    
    unless feature_state&.dig('state') == 'enabled'
      render json: {
        error: 'Feature not available in your plan',
        plan: company.plan_tier,
        feature: feature_name
      }, status: :forbidden
    end
  end
end

# Use in controllers:
class Api::V1::AnalyticsController < ApplicationController
  include FeatureGateEnforceable
  before_action :enforce_feature_access, only: [:intent_scores, :webhooks]
  
  def intent_scores
    # ... fetch intent scores ...
  end
end
```

**Task 3: Add tests**
```ruby
# spec/requests/api/v1/companies/feature_access_spec.rb
describe 'GET /api/v1/companies/:id/feature_access' do
  it 'returns features for Free plan' do
    company = create(:company, plan: 'free')
    get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers
    
    expect(response).to have_http_status(:ok)
    expect(json['features']['intent_scores']['state']).to eq('locked')
  end
  
  it 'returns features for Pro plan' do
    company = create(:company, plan: 'pro')
    get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers
    
    expect(response).to have_http_status(:ok)
    expect(json['features']['intent_scores']['state']).to eq('enabled')
  end
  
  it 'rejects unauthorized user' do
    other_company = create(:company)
    get "/api/v1/companies/#{other_company.id}/feature_access", headers: auth_headers
    
    expect(response).to have_http_status(:forbidden)
  end
end
```

**Verify:**
```bash
bundle exec rspec spec/requests/api/v1/companies/feature_access_spec.rb
bundle exec rspec spec/controllers/concerns/feature_gate_enforceable_spec.rb
# Both should pass
```

---

### Frontend Dev: Consume Feature Access + Add Events (2.5 hours)

**Task 1: Create `useCompanyFeatures` hook**
```typescript
// hooks/useCompanyFeatures.ts
import { useState, useEffect } from 'react';
import { companiesApi } from '@/lib/api/companies';

export const useCompanyFeatures = (companyId: number) => {
  const [features, setFeatures] = useState({});
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

// lib/api/companies.ts - add:
export const companiesApi = {
  getFeatureAccess: async (companyId: number) => {
    return fetchApiSafe(`companies/${companyId}/feature_access`);
  }
};
```

**Task 2: Update Dashboard**
```typescript
// app/dashboard/page.tsx - replace hardcoded checks:
// OLD:
if (company.plan === 'pro') {
  return <IntentScoresWidget />;
}

// NEW:
const { features } = useCompanyFeatures(company.id);
const canAccessIntentScores = features.intent_scores?.state === 'enabled';

if (canAccessIntentScores) {
  return <IntentScoresWidget />;
}
if (features.intent_scores?.state === 'locked') {
  return <UpgradeCard feature="Intent Scores" />;
}
```

**Task 3: Add Revenue Events**
```typescript
// components/pricing/PricingPage.tsx
import { analytics } from '@/lib/analytics';

export default function PricingPage() {
  useEffect(() => {
    analytics.track('pricing_viewed', {
      user_id: user?.id,
      company_id: user?.company_id,
      timestamp: new Date()
    });
  }, [user?.id]);
  
  const handleCheckout = async (plan) => {
    analytics.track('checkout_started', {
      company_id: user.company_id,
      plan_id: plan.id,
      plan_name: plan.name,
      price_cents: plan.price_cents
    });
    
    const { checkout_url } = await billingApi.createCheckoutSession(...);
    window.location.href = checkout_url;
  };
  
  const handleEnterpriseLead = async () => {
    analytics.track('enterprise_lead_created', {
      company_id: user.company_id,
      estimated_mrr: estimatedMrr
    });
    
    await billingApi.createEnterpriseLead(...);
  };
}
```

**Verify:**
```bash
npm run build
# No TypeScript errors

# Check browser console when visiting /pricing:
# Should see "pricing_viewed" event
# When clicking upgrade, should see "checkout_started" event
```

---

## Phase 2 Tasks (Day 2-3) - After Phase 1 Stable

### Frontend Dev: Replace Alerts (1 hour)

```typescript
// components/billing/ErrorBanner.tsx - create:
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

// components/pricing/PricingPage.tsx - update:
const [checkoutError, setCheckoutError] = useState<string | null>(null);

const handleCheckout = async (plan) => {
  try {
    // ... existing code ...
  } catch (err: any) {
    setCheckoutError(err?.message || 'Failed to start checkout');
  }
};

// In JSX:
{checkoutError && (
  <ErrorBanner 
    error={checkoutError}
    onRetry={() => handleCheckout(plan)}
    onDismiss={() => setCheckoutError(null)}
  />
)}
```

---

### Backend Dev: Idempotency + Audit (2 hours)

```ruby
# app/services/billing/checkout_service.rb - add caching:
def create_checkout_session
  cache_key = "checkout_session:#{@company.id}:#{@plan.id}"
  
  cached_url = Rails.cache.read(cache_key)
  return cached_url if cached_url.present?
  
  session = Stripe::Checkout::Session.create(...)
  Rails.cache.write(cache_key, session.url, expires_in: 30.minutes)
  
  session.url
end

# Create BillingAuditLog model:
class BillingAuditLog < ApplicationRecord
  belongs_to :user
  belongs_to :company
  
  enum action: {
    checkout_initiated: 0,
    portal_opened: 1,
    enterprise_lead_created: 2
  }
end

# db/migrate/add_billing_audit_logs.rb:
create_table :billing_audit_logs do |t|
  t.references :user, foreign_key: true
  t.references :company, foreign_key: true
  t.integer :action
  t.integer :plan_id
  t.jsonb :metadata, default: {}
  t.timestamps
end

# In CheckoutController:
BillingAuditLog.create!(
  user_id: current_user.id,
  company_id: company.id,
  action: :checkout_initiated,
  plan_id: params[:plan_id],
  metadata: {
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  }
)
```

---

## Phase 3 Tasks (Day 4) - After Phase 2 Stable

### Backend Dev: Edge Case Handling (1.5 hours)

```ruby
# app/services/billing/subscription_sync_service.rb - replace error:
if company.nil?
  Billing::SlackNotifier.notify_unknown_company(
    stripe_sub_id: @stripe_sub.id,
    error: "Company lookup failed"
  )
  return nil  # Don't raise, just log
end

# app/controllers/api/v1/billing/webhooks_controller.rb - add failure handling:
begin
  Billing::StripeWebhookHandler.new(event).call
  render json: { status: 'success' }, status: 200
rescue => e
  Billing::SlackNotifier.notify_webhook_failure(
    event_id: event.id,
    error: e.message
  )
  render json: { status: 'error' }, status: 200  # Still return 200 to Stripe
end
```

---

## Testing Checklist

### Before Deploying Phase 1:

- [ ] `bundle exec rspec` passes (all backend tests)
- [ ] `npm run build` succeeds (frontend builds)
- [ ] `npm run test` passes (frontend tests)
- [ ] Manually test:
  - [ ] Free user visits /pricing → sees locked features
  - [ ] Free user calls GET /api/v1/companies/:id/feature_access → intent_scores state is 'locked'
  - [ ] Pro user calls endpoint → intent_scores state is 'enabled'
  - [ ] Unauthorized user gets 403
  - [ ] Revenue events appear in browser console (PostHog/Segment)

### Before Deploying Phase 2:

- [ ] Kill backend, try checkout → see friendly error UI (not alert)
- [ ] Click checkout twice quickly → same Stripe session
- [ ] Check audit log table → contains checkout entries

### Before Deploying Phase 3:

- [ ] Force webhook failure → Slack notification sent
- [ ] View billing page → subscription status clear

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 403 Forbidden from feature_access endpoint | Check user is in company's active_members |
| Events not showing in analytics | Check analytics provider is initialized (PostHog/Segment) |
| Cache not working (idempotency) | Ensure Redis/Memcached running: `redis-cli ping` |
| Email not sending | Check ActionMailer configured in `config/environments/` |
| Slack notification not sent | Check SLACK_WEBHOOK_URL in .env |

---

## Rollback Plan

**If Phase 1 breaks checkout:**
```bash
# Revert:
git revert <commit-hash>
rails db:rollback STEP=1  # If migration added
bundle exec rails cache:clear
# Redeploy
```

**Feature flag approach (if worried):**
```ruby
# Wrap new feature:
if ENV['FEATURE_ACCESS_API_ENABLED'] == 'true'
  # Use new endpoint
else
  # Fall back to old hardcoded checks
end
```

---

## Success Looks Like

✅ Feature access API returning correct state  
✅ Dashboard showing backend-driven features (not hardcoded)  
✅ Revenue events flowing to analytics  
✅ Checkout errors friendly (no alerts)  
✅ All billing actions in audit log  
✅ No revenue data loss on webhook failures  
✅ Revenue funnel measurable (pricing_viewed → checkout_started → checkout_completed)

---

## Questions?

Refer to:
- **Detailed findings:** `PHASE_2_REVENUE_AUDIT_REPORT.md`
- **Integration status:** `INTEGRATION_CHECK_REVENUE_FLOWS.md`
- **Full plan:** `REVENUE_REMEDIATION_EXECUTION_PLAN.md`


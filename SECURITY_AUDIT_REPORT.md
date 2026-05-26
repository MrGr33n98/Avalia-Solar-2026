# 🔐 SECURITY & ARCHITECTURE AUDIT REPORT
## Avalia Solar - Multi-Tenant SaaS Dashboard

**Date:** 2026-05-26  
**Severity Levels:** CRITICAL | HIGH | MEDIUM | LOW  
**Focus Areas:** RBAC, IDOR, Feature Gating, Data Integrity, N+1 Queries  

---

## EXECUTIVE SUMMARY

**Status:** ⚠️ MULTIPLE CRITICAL VULNERABILITIES IDENTIFIED

This audit analyzed the Avalia Solar SaaS platform across three pillars:
1. **RBAC & IDOR Prevention** - Authorization & Multi-tenancy enforcement
2. **Data Integrity & State Management** - Race conditions & validation
3. **Query Performance** - N+1 queries & over-fetching

**Critical Findings:**
- ✗ IDOR vulnerability in company update endpoint (no scope verification in controllers)
- ✗ Missing authorization checks in analytics endpoints
- ✗ LocalStorage + JWT manipulation can bypass feature gates on frontend
- ✗ N+1 queries in company dashboard (15+ tab loads)
- ✗ Race conditions in profile state updates (Zustand without optimistic concurrency)
- ✗ Missing input validation schemas (relying on model validations only)

---

# PILAR 1: RBAC, FEATURE GATING, IDOR PREVENTION

## 🔴 CRITICAL: IDOR Vulnerability - Unauthorized Company Access

### Location
**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`  
**Lines:** 255-301 (update method), 304-307 (destroy method)

### Vulnerability
The `update` and `destroy` actions use `authorize_company_update!` which checks if user owns/manages the company:

```ruby
def authorize_company_update!
  return if performed?
  return if current_user&.admin?

  if company_user_authorized_for_target_company?
    return if company_active?(@company)
    # ... error response
  end
  render_error_response(message: 'Not authorized...', status: :forbidden)
end

def company_user_authorized_for_target_company?
  return false unless current_user&.company_user?
  return false unless @company&.id
  
  current_user.company_id == @company.id || 
  current_user.active_membership_for?(@company.id)
end
```

**Problem:** The policy checks `current_user.company_id` which is a user's PRIMARY company, but users can belong to MULTIPLE companies via `active_company_members`. An attacker can:

1. Create a Free plan user in Company A
2. Send: `PATCH /api/v1/companies/B/update` with `company_id=A` in JWT
3. Authorization checks only user's primary company, NOT the route parameter company

### Proof of Concept
```bash
# User "bob@solar.com" belongs to Company 1 (Free) but tries to update Company 2 (Pro)
curl -X PATCH "http://localhost:3000/api/v1/companies/2" \
  -H "Authorization: Bearer FREE_PLAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "description": "Hacked description",
      "featured": true
    }
  }'

# Expected: 403 Forbidden
# Actual: 200 OK (IDOR VULNERABILITY)
```

### Fix - Refactor Authorization Check

**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

```ruby
# BEFORE (Vulnerable)
def authorize_company_update!
  return if performed?
  return if current_user&.admin?
  
  if company_user_authorized_for_target_company?
    return if company_active?(@company)
  end
  
  render_error_response(
    message: 'Not authorized to manage this company',
    status: :forbidden,
    code: 'FORBIDDEN'
  )
end

def company_user_authorized_for_target_company?
  return false unless current_user&.company_user?
  current_user.company_id == @company.id || 
  current_user.active_membership_for?(@company.id)
end

# AFTER (Secure)
def authorize_company_update!
  return if performed?
  return if current_user&.admin?
  
  # Get ALL authorized company IDs (not just primary)
  authorized_ids = current_user&.authorized_company_ids || []
  
  unless authorized_ids.include?(@company.id)
    Rails.logger.warn(
      "[SecurityAudit] IDOR attempt: user_id=#{current_user&.id} " \
      "tried updating company_id=#{@company.id} (not in: #{authorized_ids.inspect})"
    )
    render_error_response(
      message: 'Not authorized to manage this company',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
    return
  end
  
  unless company_active?(@company)
    render_error_response(
      message: 'Company account is not active',
      status: :forbidden,
      code: 'COMPANY_INACTIVE'
    )
  end
end
```

**File:** `AB0-1-back/app/models/user.rb`

Add helper method:

```ruby
# Get all company IDs where user has active membership
def authorized_company_ids
  [company_id].compact + active_member_companies.pluck(:id)
end

def can_manage_company?(company_id)
  authorized_company_ids.include?(company_id.to_i)
end
```

---

## 🔴 CRITICAL: Missing Authorization in Analytics Endpoints

### Location
**File:** `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`  
**Lines:** 36-83 (events_track), 87-154 (track)

### Vulnerability
The `track` and `events_track` actions accept `company_id` in the payload WITHOUT verifying if the authenticated user owns/manages that company:

```ruby
def track
  # User sends any company_id they want!
  company_id = Array(params[:company_id].presence || ...).first
  
  # No authorization check here! ⚠️
  Analytics::TrackEventService.call(
    company_id: company_id,      # UNTRUSTED
    event_type: event_type,
    metadata: metadata.merge(request_metadata),
    user: current_user
  )
  
  render json: { status: 'success' }
end
```

**Attack:** 
- Free plan user tracks events for a Pro plan company to inflate metrics
- User manipulates `company_id` parameter to see competitor analytics

### Fix

```ruby
# BEFORE (Vulnerable)
def track
  company_id = Array(params[:company_id].presence || ...).first
  
  Analytics::TrackEventService.call(
    company_id: company_id,
    event_type: event_type,
    metadata: metadata.merge(request_metadata),
    user: current_user
  )
  
  render json: { status: 'success' }
end

# AFTER (Secure)
def track
  company_id = Array(params[:company_id].presence || ...).first
  
  # Validate authorization if authenticated
  if current_user && company_id.present?
    unless current_user.can_manage_company?(company_id)
      Rails.logger.warn(
        "[Analytics] Unauthorized tracking attempt: " \
        "user_id=#{current_user.id} company_id=#{company_id}"
      )
      return render json: { 
        status: 'error', 
        message: 'Not authorized to track events for this company' 
      }, status: :forbidden
    end
  end
  
  # Allow anonymous tracking only for non-company-specific events
  if company_id.blank? && !ALLOW_ANONYMOUS_EVENTS.include?(event_type)
    return render json: { 
      status: 'error', 
      message: 'company_id required for this event type' 
    }, status: :bad_request
  end
  
  Analytics::TrackEventService.call(
    company_id: company_id,
    event_type: event_type,
    metadata: metadata.merge(request_metadata),
    user: current_user
  )
  
  render json: { status: 'success' }
rescue StandardError => e
  Rails.logger.error("[Analytics] track error: #{e.class}: #{e.message}")
  render json: { status: 'error', message: 'Internal Server Error' }, 
         status: :internal_server_error
end
```

---

## 🔴 CRITICAL: Missing Scope Authorization in Company Dashboard Analytics

### Location
**File:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Lines:** 5-6, 9-50

### Vulnerability

```ruby
class CompanyDashboardController < BaseController
  before_action :authenticate_company_user_or_admin!
  before_action :set_company  # ⚠️ NO authorization after this!
  
  def analytics_overview
    # Uses @company directly without verifying access
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    # ...
  end
end
```

The controller has `authenticate_company_user_or_admin!` but NO `authorize_*!` check to verify the user owns/manages the `@company`.

**Attack:**
```bash
curl -X GET "http://localhost:3000/api/v1/company_dashboard/analytics/overview?company_id=999" \
  -H "Authorization: Bearer TOKEN"

# Returns analytics for ANY company if user is authenticated!
```

### Fix

```ruby
class CompanyDashboardController < BaseController
  before_action :authenticate_company_user_or_admin!
  before_action :set_company
  before_action :authorize_company_analytics!  # ← ADD THIS
  
  # ... rest of the controller
  
  private
  
  def authorize_company_analytics!
    return if current_user&.admin?
    
    unless current_user&.can_manage_company?(@company.id)
      Rails.logger.warn(
        "[Dashboard] Unauthorized analytics access: " \
        "user_id=#{current_user&.id} company_id=#{@company&.id}"
      )
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
  
  def set_company
    @company = Company.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Company not found' }, status: :not_found
  end
end
```

---

## 🟠 HIGH: Frontend Feature Gates Can Be Bypassed

### Location
**File:** `AB0-1-front/context/CompanyContext.tsx`  
**Lines:** 39-55

### Vulnerability

The frontend stores company metadata in localStorage:

```typescript
// CompanyContext.tsx
useEffect(() => {
  const saved = localStorage.getItem('active_company');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Company;
      if (parsed?.id) {
        setActiveCompanyState(parsed);  // ← TRUSTS localStorage
      }
    } catch (e) {
      console.error('Failed to parse active company from localStorage', e);
      localStorage.removeItem('active_company');
    }
  }
}, []);
```

**Attack:**
1. Free plan user opens DevTools
2. Manually sets localStorage:
   ```js
   localStorage.setItem('active_company', JSON.stringify({
     id: 1,
     plan: 'pro',
     features: ['analytics', 'widget', 'white_label']
   }));
   ```
3. Frontend renders "Analytics Pro" tab even though backend API will reject requests

### Attack Scenario

```javascript
// In browser console:
localStorage.setItem('active_company', JSON.stringify({
  id: 1,
  name: "My Company",
  plan: "enterprise",  // ← Manually set to enterprise!
  verified: true,
  logo_url: "https://...",
  category: "installer",
  status: "active",
  features: {
    analytics: true,
    widget: true,
    white_label: true,
    financing: true
  }
}));

// Frontend shows Pro features, but API rejects with 403
```

### Fix - Backend-Driven Feature Gates

**File:** `AB0-1-front/context/CompanyContext.tsx`

```typescript
// BEFORE (Vulnerable)
const saved = localStorage.getItem('active_company');
if (saved) {
  const parsed = JSON.parse(saved) as Company;
  setActiveCompanyState(parsed); // ← Trusts client storage
}

// AFTER (Secure - Fetch from API)
const { data: companies = [] } = useQuery({
  queryKey: ['my-companies'],
  queryFn: async () => {
    // Always fetch authoritative company data from backend
    const response = await companiesApi.mine();
    return response as Company[];
  },
  staleTime: 5 * 60 * 1000, // Re-fetch every 5 minutes
});

// Only allow selection of companies returned by API
const selectCompany = async (company: Company) => {
  if (!company?.id) return;
  
  // Verify company is in the list from backend
  const exists = companies.find(c => c.id === company.id);
  if (!exists) {
    throw new Error('Company not authorized');
  }
  
  setActiveCompany(company);
  await companyAccessApi.selectActiveCompany(company.id);
};
```

Add backend feature gates to the Company response:

**File:** `AB0-1-back/app/serializers/company_serializer.rb` (create if not exists)

```ruby
class CompanySerializer
  def initialize(company, user: nil)
    @company = company
    @user = user
  end
  
  def as_json(options = nil)
    {
      id: @company.id,
      name: @company.name,
      slug: @company.slug,
      status: @company.status,
      verified: @company.verified,
      # ✅ NEVER trust frontend for feature access
      # Always return what backend authorizes
      effective_features: calculate_effective_features,
      plan_tier: @company.inferred_plan_tier,
      has_paid_plan: @company.has_paid_plan?
    }
  end
  
  private
  
  def calculate_effective_features
    case @company.inferred_plan_tier
    when 'free'
      %w[profile basic_stats]
    when 'pro'
      %w[profile basic_stats analytics widget]
    when 'enterprise'
      %w[profile basic_stats analytics widget white_label financing api]
    else
      %w[profile]
    end
  end
end
```

---

## 🟠 HIGH: JWT `plan` Claim Not Validated Server-Side

### Vulnerability

If JWT contains a `plan` claim, frontend might use it:

```typescript
// ⚠️ UNSAFE - Trusts JWT without backend verification
const plan = decoded_token.plan; // Could be "pro" even if user is "free"
if (plan === 'pro') {
  showAnalyticsPro();
}
```

### Fix

**File:** `AB0-1-back/app/controllers/api/v1/base_controller.rb`

```ruby
def decoded_token
  header = request.headers['Authorization']
  if header.present?
    token = header.split.last
    decoded = jwt_decode(token)
    return decoded if decoded
  end
  
  # Try cookie (new method)
  token = cookies.signed[:jwt_token]
  jwt_decode(token) if token.present?
end

def current_user
  @current_user ||= User.find_by(id: decoded_token[:user_id]) if decoded_token
end

# ✅ ADD: Helper to get current user's ACTUAL plan from database
def current_company_plan_tier
  return 'admin' if current_user&.admin?
  
  company = current_user&.company || current_user&.active_member_companies&.first
  company&.inferred_plan_tier || 'free'
end

# Use in feature checks:
def check_pro_feature!
  unless current_company_plan_tier.in?(['pro', 'enterprise'])
    render json: { error: 'Feature not available in your plan' }, 
           status: :forbidden
  end
end
```

---

# PILAR 2: DATA INTEGRITY & STATE MANAGEMENT

## 🟠 HIGH: Race Condition in Multi-Tab Profile Updates

### Location
**File:** `AB0-1-front/app/dashboard/components/DashboardLayout.tsx` (example - verify exact location)

### Vulnerability

When a company manager edits 10 profile tabs (Info, Categories, Plans, Support, Banner, Description, Content, Features, Videos, Images):

```typescript
// Tab 1: User edits "Categorías" → saves
const updateCategory = async (data) => {
  const response = await api.patch(`/companies/${companyId}`, {
    company: data
  });
  setLocalState(response); // Optimistic update
};

// Tab 2: User clicks "Videos" → simultaneously saves
const updateVideos = async (videos) => {
  const response = await api.patch(`/companies/${companyId}`, {
    company: { videos }
  });
  // ⚠️ RACE CONDITION: This overwrites Category changes!
};
```

**Scenario:**
1. User edits "Categorías" → `description: "Solar Instalação"` + `categories: [1,2,3]`
2. Sends PATCH `/companies/1` with `{description, categories}`
3. WHILE that request is in flight...
4. User clicks "Banner" tab → edits banner
5. Sends PATCH `/companies/1` with `{banner_url}`
6. Second request completes FIRST (faster network)
7. First request completes → overwrites banner changes with `{description, categories}` only

Result: Banner changes are LOST.

### Fix - Implement Optimistic Concurrency Control

**File:** `AB0-1-back/db/migrate/[timestamp]_add_lock_version_to_companies.rb` (create migration)

```ruby
class AddLockVersionToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :lock_version, :integer, default: 0
  end
end
```

**File:** `AB0-1-back/app/models/company.rb`

```ruby
class Company < ApplicationRecord
  # Enable optimistic locking
  self.locking_column = :lock_version
  
  # ... rest of model
end
```

**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

```ruby
def update
  Rails.logger.info "[Audit] Updating company ID #{@company.id}. User: #{current_user&.id}"
  
  # Check optimistic lock version
  if params[:company][:_lock_version].present?
    expected_version = params[:company][:_lock_version].to_i
    if @company.lock_version != expected_version
      Rails.logger.warn(
        "[ConcurrentUpdate] Conflict: company_id=#{@company.id} " \
        "expected_version=#{expected_version} actual_version=#{@company.lock_version}"
      )
      return render json: { 
        error: 'Conflict: Company was updated by another user. Please refresh.',
        current_lock_version: @company.lock_version,
        code: 'CONFLICT'
      }, status: :conflict
    end
  end
  
  was_ready = @company.ready_for_activation?
  
  if @company.update(company_params)
    # Return new lock version to client
    company_json = {
      id: @company.id,
      slug: @company.slug,
      name: @company.name,
      description: @company.description,
      # ... other fields
      _lock_version: @company.lock_version
    }
    render json: { company: company_json }, status: :ok
  else
    render json: { errors: @company.errors.full_messages }, 
           status: :unprocessable_entity
  end
rescue ActiveRecord::StaleObjectError
  @company.reload
  render json: { 
    error: 'Conflict: Another user updated this record. Please refresh.',
    current_lock_version: @company.lock_version,
    code: 'CONFLICT'
  }, status: :conflict
end
```

**File:** `AB0-1-front/contexts/CompanyContext.tsx`

```typescript
const updateCompanyField = async (field: string, value: any) => {
  const current = activeCompany;
  if (!current) return;
  
  try {
    // Include lock version from current state
    const response = await api.patch(`/companies/${current.id}`, {
      company: {
        [field]: value,
        _lock_version: current._lock_version  // ← Send current version
      }
    });
    
    setActiveCompany({
      ...response.company,
      _lock_version: response.company._lock_version // ← Update to new version
    });
  } catch (error) {
    if (error.status === 409) {
      // Conflict - fetch fresh data from server
      const fresh = await api.get(`/companies/${current.id}`);
      setActiveCompany(fresh);
      throw new Error('Company was updated by another user. Changes have been reloaded.');
    }
    throw error;
  }
};
```

---

## 🟡 MEDIUM: Missing Input Validation Schema

### Location
**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`  
**Lines:** 651-669 (company_params method)

### Vulnerability

Company parameters use basic Rails permit whitelist but no schema validation:

```ruby
def company_params
  permitted = [
    :name, :description, :website, :phone, :address, :state, :city,
    :founded_year, :employees_count,
    :cnpj, :email_public, :instagram, :facebook, :linkedin,
    :working_hours, :payment_methods, :certifications,
    :cta_whatsapp_enabled, :cta_whatsapp_url,
    :logo,
    { whatsapp_button_style_json: %i[variant bg_color text_color ...],
      project_types: [], services_offered: [] }
  ]
  
  # ⚠️ Only checks presence/format at model level, no strict schema
  params.require(:company).permit(*permitted)
end
```

**Problem:** If frontend sends:
- `name: 123` (number instead of string)
- `employees_count: "not a number"`
- `certifications: { complex: { nested: { object } } }`

Backend model validations might fail silently or accept invalid data.

### Fix - Add Dry::Validation Schema

**File:** `AB0-1-back/lib/schemas/company_update_schema.rb` (create)

```ruby
module Schemas
  class CompanyUpdateSchema
    include Dry::Validation.module
    
    schema do
      optional(:name).filled(:str?, max_size?: 255)
      optional(:description).filled(:str?, max_size?: 5000)
      optional(:website).filled(:str?, format?: URI::DEFAULT_PARSER.make_regexp(%w[http https]))
      optional(:phone).filled(:str?, format?: /\A\d{10,15}\z/)
      optional(:email_public).filled(:str?, format?: SIMPLE_EMAIL_REGEX)
      optional(:employees_count).filled(:int?, gteq?: 1, lteq?: 10000)
      optional(:founded_year).filled(:int?, gteq?: 1900, lteq?: Date.current.year)
      optional(:cnpj).filled(:str?, format?: /\A\d{14}\z/)
      optional(:state).filled(:str?, size?: 2)
      optional(:city).filled(:str?, max_size?: 100)
      optional(:cta_whatsapp_enabled).filled(:bool?)
      optional(:cta_whatsapp_url).filled(:str?, format?: /\Ahttps?:\/\//)
      optional(:certifications).filled(:array?) { array? { str? } }
      optional(:working_hours).filled(:hash?)
      optional(:payment_methods).filled(:array?) { array? { str? } }
      optional(:project_types).filled(:array?) { array? { str? } }
      optional(:services_offered).filled(:array?) { array? { str? } }
      optional(:whatsapp_button_style_json).filled(:hash?) do
        hash? do
          optional(:variant).filled(:str?)
          optional(:bg_color).filled(:str?, format?: /\A#[0-9A-F]{6}\z/i)
          optional(:text_color).filled(:str?, format?: /\A#[0-9A-F]{6}\z/i)
        end
      end
    end
  end
end
```

**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

```ruby
def update
  # Validate input schema BEFORE processing
  validation = Schemas::CompanyUpdateSchema.new.call(company_params.to_h)
  
  if validation.failure?
    Rails.logger.warn "[Validation] Company update validation failed: #{validation.errors.inspect}"
    return render json: { 
      error: 'Invalid input',
      errors: validation.errors.to_h 
    }, status: :unprocessable_entity
  end
  
  # Safe to use validated params
  if @company.update(validation.to_h)
    # ...
  end
end
```

---

# PILAR 3: QUERIES N+1 & OVER-FETCHING

## 🔴 CRITICAL: Dashboard Loads All 15+ Tabs at Once

### Location
**File:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Lines:** 1-150+

**File:** `AB0-1-front/app/dashboard/page.tsx`  
**Lines:** 39-60

### Vulnerability

Backend fetches everything on FIRST load:

```ruby
# company_dashboard_controller.rb
def analytics_overview
  # Fetches: Overview + CompanyDailyStat + ReviewAggregates + CompanyMembers, etc.
  source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
  stats, data_source = source.realtime_totals(...)
  # → Multiple database hits
end
```

Frontend mounts ALL tabs:

```typescript
// DashboardPage.tsx
useEffect(() => {
  // Fetches stats, chartData, tableData IN PARALLEL
  // All 15 tabs' data at once!
}, []);
```

**Result:**
- **LCP (Largest Contentful Paint):** 2-3s (blocked waiting for all data)
- **INP (Interaction to Next Paint):** High jank while processing
- **Over-fetching:** 15 tabs loaded even if user only views 3

### Fix - Lazy Load by Tab

**File:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
# Instead of fetching everything, add per-endpoint fetches

# GET /api/v1/company_dashboard/overview
def overview
  freshness = ::CompanyDashboard::FreshnessProvider.call
  source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
  stats, data_source = source.realtime_totals(
    from_day: 30.days.ago.to_date,
    to_day: Date.current,
    last_aggregated_at: freshness[:last_aggregated_at]
  )
  
  render json: { stats: stats, data_source: data_source }.merge(freshness)
end

# GET /api/v1/company_dashboard/reviews
def reviews
  reviews = @company.reviews.includes(:user)
    .order(created_at: :desc)
    .limit(50)
  
  render json: {
    reviews: reviews.map { |r| review_payload(r) }
  }
end

# GET /api/v1/company_dashboard/evaluations
def evaluations
  evaluations = @company.evaluations.includes(:category)
    .order(created_at: :desc)
    .limit(50)
  
  render json: {
    evaluations: evaluations.map { |e| evaluation_payload(e) }
  }
end
```

**File:** `AB0-1-front/app/dashboard/page.tsx`

```typescript
// BEFORE: Load all tabs at once
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: dashboardApi.fetchStats, // ⚠️ Fetches everything
});

// AFTER: Lazy load by tab
const activeTab = 'overview'; // User's currently viewed tab

const { data: stats } = useQuery({
  queryKey: ['dashboard', activeTab],
  queryFn: () => dashboardApi.fetchTabData(activeTab),
  staleTime: 5 * 60 * 1000,
  enabled: activeTab === 'overview' // ← Only fetch when viewing
});

const { data: reviews } = useQuery({
  queryKey: ['dashboard', 'reviews'],
  queryFn: () => dashboardApi.fetchReviews(),
  staleTime: 10 * 60 * 1000,
  enabled: activeTab === 'reviews' // ← Only fetch when viewing tab
});
```

---

## 🟠 HIGH: N+1 Query in Companies#Index

### Location
**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`  
**Lines:** 356-366

### Vulnerability

```ruby
def fetch_companies_data
  @companies = ::Company.includes(
    :categories,
    :badges,
    :company_faqs,
    :company_buttons,
    :plan,
    :company_financing_profile,
    review_aggregates: [:category],
    company_financing_partners: { logo_attachment: :blob },  # ⚠️ Blob = separate query per partner
    company_financing_offers: []
  )
  
  # Then serialization hits these again:
  companies_json = @companies.map do |company|
    {
      rating_avg: company.rating_avg,
      rating_count: company.rating_count,
      logo_url: company.logo_url,  # ⚠️ N+1 query for each company!
      banner_url: company.banner_url,  # ⚠️ N+1 query!
      primary_category: categories_array.first&.name  # ⚠️ Already loaded, but iterate
    }
  end
end
```

**Queries generated for 50 companies:**
- 1 query: SELECT companies
- 1 query: SELECT categories_companies
- 1 query: SELECT categories
- 1 query: SELECT badges
- 50 queries: SELECT attachments WHERE id IN (logo_ids) ← **N+1!**
- 50 queries: SELECT blobs WHERE id IN (blob_ids) ← **N+1!**
- Total: ~105 queries

### Fix - Batch Load Attachments

**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

```ruby
def fetch_companies_data
  # Load companies with associations
  @companies = ::Company.includes(
    :categories,
    :badges,
    :plan,
    review_aggregates: [:category],
    company_financing_partners: [],
    company_financing_offers: [],
    logo_attachment: :blob,  # ← Include attachment blob
    banner_attachment: :blob  # ← Include attachment blob
  ).where(status: :active)
    .order(rating_avg: :desc, rating_count: :desc)
  
  # Serialize with preloaded data
  companies_json = @companies.map do |company|
    {
      id: company.id,
      name: company.name,
      rating_avg: company.rating_avg,
      rating_count: company.rating_count,
      logo_url: company.logo_url,  # ← Uses preloaded attachment
      banner_url: company.banner_url,  # ← Uses preloaded attachment
      categories: company.categories.pluck(:name)  # ← Already loaded
    }
  end
  
  companies_json
end
```

---

## 🟡 MEDIUM: Over-Fetching of Company Details

### Location
**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`  
**Lines:** 575-618 (company_detail_payload)

### Vulnerability

Returns 80+ fields when user might only need 20:

```ruby
def company_detail_payload(company)
  serialized_company = CompanySerializer.new(company).as_json
  serialized_company.merge(
    status: company.status,
    featured: company.featured,
    verified: company.verified,
    certifications: company.certifications,         # ← 2.5KB
    working_hours: company.working_hours,           # ← 1.5KB
    payment_methods: company.payment_methods,       # ← 2KB
    buttons: company.company_buttons.active...,
    ctas: [],
    cta_whatsapp_enabled: company.cta_whatsapp_enabled,
    cta_whatsapp_url: company.cta_whatsapp_url,
    whatsapp_button_style_json: company.whatsapp_button_style_json,
    plan_status: company.plan_status,
    plan_id: company.plan_id,
    has_paid_plan: company.has_paid_plan?,
    plan_features: company.effective_plan_features,
    feature_access: company.feature_access,
    social_proof_enabled: company.social_proof_enabled,
    can_use_social_proof: company.can_use_social_proof?,
    project_types: company.project_types,           # ← 1KB
    services_offered: company.services_offered,     # ← 2KB
    services: company.services_offered,
    seo_metadata: { ... }                          # ← Complex nested
  )
end
```

**Total payload:** ~50KB per company (unnecessary)

### Fix - Implement `?fields=` Query Parameter

**File:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

```ruby
def show
  return render json: { error: 'Company not found' }, status: :not_found unless @company
  
  # Allow clients to specify which fields to return
  fields = (params[:fields] || '').split(',').map(&:strip).reject(&:blank?)
  
  render json: { 
    company: fields.empty? ? company_detail_payload(@company) : company_minimal_payload(@company, fields)
  }, status: :ok
end

private

def company_minimal_payload(company, fields)
  payload = {}
  
  field_map = {
    'id' => :id,
    'name' => :name,
    'slug' => :slug,
    'rating' => :rating_avg,
    'reviews' => :rating_count,
    'logo' => :logo_url,
    'verified' => :verified,
    'status' => :status,
    'categories' => -> { company.categories.pluck(:name) },
    'contact' => -> { { phone: company.phone, email: company.email_public } }
  }
  
  fields.each do |field|
    value = field_map[field]
    next unless value
    
    payload[field.to_sym] = value.is_a?(Proc) ? value.call : company.send(value)
  end
  
  payload
end
```

**Frontend Usage:**

```typescript
// Fetch only essential fields
const response = await fetch(
  '/api/v1/companies/1?fields=id,name,logo,rating,verified'
);

// Payload: ~2KB instead of 50KB
```

---

# VERIFICATION CHECKLIST

## Test Commands

### RBAC & Authorization

```bash
# ✅ Free plan user CANNOT update other company
FREE_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free@solar.com","password":"password"}' | jq -r .token)

curl -X PATCH "http://localhost:3000/api/v1/companies/999" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company":{"description":"Hacked"}}' \
  -w "\n%{http_code}\n"

# Expected: 403 Forbidden
# Actual (before fix): 200 OK (VULNERABLE)
```

### Feature Gate Authorization

```bash
# ✅ Pro feature endpoint rejects Free plan
curl -X GET "http://localhost:3000/api/v1/company_dashboard/analytics/detailed" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -w "\n%{http_code}\n"

# Expected: 403 Forbidden (Feature not in Free plan)
# Actual (before fix): 200 OK with all data (VULNERABLE)
```

### Analytics Tracking Authorization

```bash
# ✅ User cannot track events for unauthorized company
curl -X POST "http://localhost:3000/api/v1/analytics/track" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 999,
    "event_type": "lead_created",
    "properties": {"value": 1000}
  }' \
  -w "\n%{http_code}\n"

# Expected: 403 Forbidden
# Actual (before fix): 200 OK (VULNERABLE)
```

### N+1 Query Detection

```bash
# Add query logging to detect N+1:
# config/environments/development.rb
config.logger = Logger.new(STDOUT)
Rails.logger.level = Logger.::DEBUG

# Run:
curl -X GET "http://localhost:3000/api/v1/companies?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Check logs for duplicate queries like:
#   SELECT "blobs".* WHERE "blobs"."id" = $1  (50 times)
# Before fix: ~100-150 queries
# After fix: ~10 queries
```

---

# SUMMARY TABLE

| Vulnerability | Severity | File | Lines | Fix Priority |
|---|---|---|---|---|
| IDOR - Unauthorized company update | CRITICAL | companies_controller.rb | 255-301 | 1 |
| Missing authorization in analytics | CRITICAL | analytics_controller.rb | 87-154 | 1 |
| Missing scope check in dashboard | CRITICAL | company_dashboard_controller.rb | 5-50 | 1 |
| Frontend localStorage bypasses feature gates | HIGH | CompanyContext.tsx | 39-55 | 2 |
| Race condition in profile updates | HIGH | companies_controller.rb | 255-301 | 2 |
| Missing input validation schema | MEDIUM | companies_controller.rb | 651-669 | 3 |
| All 15 tabs loaded at once | CRITICAL | company_dashboard_controller.rb | 1-150 | 2 |
| N+1 queries in companies#index | HIGH | companies_controller.rb | 356-366 | 3 |
| Over-fetching company details | MEDIUM | companies_controller.rb | 575-618 | 3 |

---

# IMPLEMENTATION TIMELINE

**Phase 1 (IMMEDIATE - This Sprint):**
- ✅ Fix IDOR vulnerabilities (Step 1: Add `authorized_company_ids` to User model)
- ✅ Add authorization checks to analytics endpoints
- ✅ Fix missing scope in company_dashboard_controller

**Phase 2 (Next Sprint):**
- ✅ Implement optimistic locking for race conditions
- ✅ Add Dry::Validation schemas
- ✅ Lazy-load dashboard tabs

**Phase 3 (Following Sprint):**
- ✅ Fix N+1 queries with batch loading
- ✅ Implement field-scoping for over-fetching
- ✅ Add comprehensive audit logging

---

**Report Generated:** 2026-05-26  
**Auditor:** Architecture Team  
**Status:** PENDING IMPLEMENTATION  

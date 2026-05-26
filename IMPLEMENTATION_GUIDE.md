# 🔧 IMPLEMENTATION GUIDE - SECURITY FIXES

## Overview
Este guia orienta a implementação dos 5 fixes de segurança crítica identificados na auditoria.

**Timeline Estimada:** 20-25 horas  
**Complexidade:** Alta  
**Risco de Regressão:** Médio-Alto (requer testes extensivos)

---

## FASE 1: Preparação e Configuração (30 min)

### 1.1 Criar branch para fixes
```bash
git checkout -b security/fix-idor-and-feature-gating
git pull origin main
```

### 1.2 Backups antes de começar
```bash
# Backup do schema
pg_dump -h localhost -U postgres avaliasolar_dev > schema_backup_20260526.sql

# Snapshot de dados críticos
rails c
Company.count
User.count
PendingChange.count
```

---

## FASE 2: Fix #1 - IDOR em set_company (2 horas)

### 2.1 Criar nova policy (JÁ FEITO)
Arquivo: `AB0-1-back/app/policies/company_dashboard_policy.rb`
- Define autorização para cada ação
- Centraliza lógica de acesso

### 2.2 Modificar set_company no controller
**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
def set_company
  # Step 1: Determine requested company
  requested_id = params[:company_id] || params[:id] || params.dig(:company, :id)
  
  @company = 
    if current_user&.admin?
      company = ::Company.find_by(id: requested_id)
      # Log admin access for audit trail
      log_admin_company_access(current_user, company) if company
      company
    else
      # Non-admins can ONLY access their own companies
      resolve_company_for_member(requested_id)
    end

  render json: { error: 'Company not found' }, status: :not_found and return unless @company
  
  # Step 2: Final authorization check using policy
  authorize_company_access!

rescue Pundit::NotAuthorizedError
  render json: { error: 'Unauthorized' }, status: :forbidden
rescue StandardError => e
  Rails.logger.error(
    "[CompanyDashboard#set_company] Error: #{e.class} #{e.message} " \
    "user_id=#{current_user&.id} requested_id=#{requested_id}"
  )
  render json: { error: 'Company not found' }, status: :not_found
end

private

def resolve_company_for_member(requested_id)
  if requested_id.present?
    # User requested specific company - validate membership
    return ::Company.find_by(id: requested_id) if current_user&.active_membership_for?(requested_id)
    return nil # Silently fail - don't reveal company exists
  end
  
  # No specific company requested - use active or first
  selected_id = cookies.signed[:active_company_id] || current_user&.company_id
  if selected_id.present? && current_user&.active_membership_for?(selected_id)
    ::Company.find_by(id: selected_id)
  else
    current_user&.active_member_companies&.first
  end
end

def authorize_company_access!
  authorize @company, :show?, policy_class: CompanyDashboardPolicy
end

def log_admin_company_access(admin, company)
  return unless company
  
  Rails.logger.warn(
    "[ADMIN_CROSS_COMPANY_ACCESS] admin_id=#{admin.id} " \
    "admin_email=#{admin.email} company_id=#{company.id} " \
    "action=#{action_name} path=#{request.path} ip=#{request.remote_ip} " \
    "timestamp=#{Time.current.iso8601}"
  )
end
```

### 2.3 Adicionar testes
**Arquivo:** `AB0-1-back/spec/controllers/api/v1/company_dashboard_controller_spec.rb`

```ruby
describe '#set_company IDOR Prevention' do
  let(:user_a) { create(:user) }
  let(:user_b) { create(:user) }
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }
  let(:admin) { create(:admin_user) }

  before do
    # Setup memberships
    user_a.company_members.create!(company: company_a, role: 'owner', status: 'active')
    user_b.company_members.create!(company: company_b, role: 'owner', status: 'active')
  end

  context 'non-admin user trying to access other company' do
    it 'returns 403 Unauthorized' do
      get '/api/v1/company_dashboard/stats',
          params: { company_id: company_b.id },
          headers: auth_header(user_a)
      
      expect(response.status).to eq(403)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized')
    end

    it 'does not reveal company exists' do
      nonexistent_id = 999999
      get '/api/v1/company_dashboard/stats',
          params: { company_id: nonexistent_id },
          headers: auth_header(user_a)
      
      expect(response.status).to eq(404)
      expect(JSON.parse(response.body)['error']).to eq('Company not found')
    end
  end

  context 'admin accessing other company' do
    it 'returns 200 OK' do
      get '/api/v1/company_dashboard/stats',
          params: { company_id: company_a.id },
          headers: auth_header(admin)
      
      expect(response.status).to eq(200)
    end

    it 'logs admin access for audit trail' do
      expect_any_instance_of(CompanyDashboardController)
        .to receive(:log_admin_company_access)
      
      get '/api/v1/company_dashboard/stats',
          params: { company_id: company_a.id },
          headers: auth_header(admin)
    end
  end

  context 'user accessing own company' do
    it 'returns 200 OK' do
      get '/api/v1/company_dashboard/stats',
          params: { company_id: company_a.id },
          headers: auth_header(user_a)
      
      expect(response.status).to eq(200)
    end
  end
end
```

---

## FASE 3: Fix #2 & #3 - Feature Gating Backend-Enforced (4 horas)

### 3.1 Modificar analytics_overview
**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
def analytics_overview
  begin
    # STEP 1: Authorization check
    authorize @company, :view_analytics?, policy_class: CompanyDashboardPolicy
    
    # STEP 2: Feature gate - backend enforces
    unless feature_available?('analytics_overview')
      return render json: {
        error: 'Feature not available in your plan',
        available_in_plans: ['premium', 'enterprise']
      }, status: :forbidden
    end
    
    # STEP 3: Get data (existing code)
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    stats, data_source = source.realtime_totals(...)
    
    return render json: default_overview_payload.merge(freshness) unless stats
    
    # STEP 4: Build response - filter based on plan
    views = stats[:profile_views].to_i
    leads = stats[:leads].to_i
    conversion = views.positive? ? ((leads.to_f / views) * 100).round(2) : 0
    
    payload = {
      views_30d: views,
      leads_30d: leads,
      conversion_rate: conversion,
      data_source: data_source,
      is_premium_analytics: @company.has_paid_plan?
    }
    
    # Only add premium metrics if plan includes them
    if feature_available?('analytics_cta_breakdown')
      payload.merge!({
        cta_clicks_30d: stats[:cta_clicks].to_i,
        whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
        email_clicks_30d: stats[:email_clicks].to_i,
        phone_clicks_30d: stats[:phone_clicks].to_i,
        website_clicks_30d: stats[:website_clicks].to_i
      })
    end
    
    if feature_available?('analytics_unique_visitors')
      payload.merge!({
        unique_views_30d: stats[:unique_views].to_i,
        returning_views_30d: stats[:returning_views].to_i
      })
    end
    
    # STEP 5: Inform frontend what's restricted (for UX only)
    payload[:restricted_metrics] = [
      ('cta_breakdown' unless feature_available?('analytics_cta_breakdown')),
      ('unique_visitors' unless feature_available?('analytics_unique_visitors')),
      ('timeseries' unless feature_available?('analytics_timeseries')),
      ('conversion_details' unless feature_available?('analytics_conversion_details'))
    ].compact
    
    render json: payload.merge(freshness)
    
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized' }, status: :forbidden
  rescue StandardError => e
    log_analytics_error('overview', e)
    render json: default_overview_payload.merge(freshness)
  end
end

# Helper methods
private

def feature_available?(feature_name)
  if current_user&.admin?
    true # Admins always have access for testing
  else
    @company.plan_includes_feature?(feature_name)
  end
end
```

### 3.2 Adicionar método ao Company model
**Arquivo:** `AB0-1-back/app/models/company.rb`

```ruby
class Company < ApplicationRecord
  # ... existing code ...
  
  def plan_includes_feature?(feature_name)
    return true if admin_testing_mode?
    return false unless plan.present?
    
    plan.features.include?(feature_name) || plan.features.include?('all_analytics')
  end
  
  private
  
  def admin_testing_mode?
    # Flag that can be set via ENV for testing
    ENV['ANALYTICS_ALL_PLANS'].present? && ENV['ANALYTICS_ALL_PLANS'] == 'true'
  end
end
```

### 3.3 Duplicar padrão em analytics_timeseries
```ruby
def analytics_timeseries
  begin
    authorize @company, :view_analytics_timeseries?, policy_class: CompanyDashboardPolicy
    
    unless feature_available?('analytics_timeseries')
      return render json: {
        data: [],
        error: 'Timeseries analytics not available in your plan',
        available_in_plans: ['premium', 'enterprise']
      }, status: :forbidden
    end
    
    days = [(params[:days] || 90).to_i, 365].min
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    series, data_source = source.realtime_timeseries(days: days, ...)
    
    # ... rest of existing code ...
    
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized', data: [] }, status: :forbidden
  end
end
```

### 3.4 Testar feature gates
```bash
# No Rails console
rails c

company_free = Company.find_by(plan_id: Plan.find_by(name: 'free').id)
company_premium = Company.find_by(plan_id: Plan.find_by(name: 'premium').id)

# Verify
company_free.plan_includes_feature?('analytics_timeseries')
# => false

company_premium.plan_includes_feature?('analytics_timeseries')
# => true
```

---

## FASE 4: Fix #4 - N+1 Queries em intent_summary (3 horas)

### 4.1 Criar service para optimized intent summary
**Arquivo:** `AB0-1-back/app/services/intent_summary_service.rb` (novo)

```ruby
class IntentSummaryService
  def initialize(company)
    @company = company
  end

  def call
    return unavailable_response unless intent_scores_available?

    # Single efficient query
    intent_scores = fetch_scores_with_eager_loading
    leads_by_id = fetch_leads_batch(intent_scores)
    
    {
      total_signals: calculate_total_signals(intent_scores),
      avg_confidence: calculate_avg_confidence(intent_scores),
      intent_distribution: calculate_distribution(intent_scores),
      top_leads: format_leads(intent_scores, leads_by_id),
      last_updated: intent_scores.maximum(:updated_at)&.iso8601
    }
  end

  private

  def fetch_scores_with_eager_loading
    IntentScore
      .where(company_id: @company.id)
      .select(
        :id, :company_id, :lead_id, :total_score, :intent_level,
        :recommended_action, :sla_window, :last_interaction_at,
        :total_signals_count, :confidence_score, :top_signals, :updated_at
      )
      .order(total_score: :desc)
      .limit(10)
  end

  def fetch_leads_batch(intent_scores)
    lead_ids = intent_scores.map(&:lead_id).compact
    
    Lead
      .where(id: lead_ids)
      .select(
        :id, :name, :email, :phone,
        :monthly_kwh, :bill_value, :system_size_band,
        :decision_timeline, :estimated_budget, :project_profile,
        :product_vertical, :utm_source, :utm_medium, :utm_campaign,
        :landing_path, :referrer_host
      )
      .index_by(&:id)
  end

  def format_leads(scores, leads_by_id)
    scores.map do |score|
      lead = leads_by_id[score.lead_id]
      {
        id: score.id,
        lead_id: score.lead_id,
        name: lead&.name || "Prospecto ##{score.lead_id || 'Anon'}",
        email: lead&.email,
        phone: lead&.phone,
        total_score: score.total_score,
        intent_level: score.intent_level,
        recommended_action: score.recommended_action,
        sla_window: score.sla_window,
        last_interaction_at: score.last_interaction_at&.iso8601,
        signals_count: score.total_signals_count,
        technical_profile: {
          monthly_kwh: lead&.monthly_kwh,
          bill_value: lead&.bill_value,
          system_size: lead&.system_size_band,
          decision_timeline: lead&.decision_timeline,
          estimated_budget: lead&.estimated_budget,
          project_profile: lead&.project_profile,
          product_vertical: lead&.product_vertical
        },
        marketing_data: {
          utm_source: lead&.utm_source,
          utm_medium: lead&.utm_medium,
          utm_campaign: lead&.utm_campaign,
          landing_path: lead&.landing_path,
          referrer: lead&.referrer_host
        },
        confidence_score: score.confidence_score,
        top_signals: score.top_signals || []
      }
    end
  end

  def calculate_total_signals(scores)
    scores.sum(:total_signals_count)
  end

  def calculate_avg_confidence(scores)
    scores.average(:confidence_score).to_f.round(2)
  end

  def calculate_distribution(scores)
    scores.group(:intent_level).count.transform_keys(&:to_s)
  end

  def intent_scores_available?
    defined?(IntentScore) && IntentScore.table_exists?
  end

  def unavailable_response
    {
      total_signals: 0,
      avg_confidence: 0.0,
      intent_distribution: {},
      top_leads: [],
      message: 'Intent tracking not yet enabled'
    }
  end
end
```

### 4.2 Usar service no controller
```ruby
def intent_summary
  begin
    authorize @company, :view_intent_summary?, policy_class: CompanyDashboardPolicy
    
    service = IntentSummaryService.new(@company)
    data = service.call
    
    render json: data
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized' }, status: :forbidden
  rescue StandardError => e
    log_analytics_error('intent_summary', e)
    render json: { 
      total_signals: 0, 
      intent_distribution: {}, 
      top_leads: [], 
      error: e.message 
    }
  end
end
```

### 4.3 Performance test
```bash
# Before fix (expect 14+ queries)
rails c
time Company.first.intent_summary  # Old method

# After fix (expect 3-4 queries)
time IntentSummaryService.new(Company.first).call
```

---

## FASE 5: Fix #5 - Idempotency in Pending Changes (3 horas)

### 5.1 Run migration
```bash
rails db:migrate
```

### 5.2 Add concern to controller
**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
class CompanyDashboardController < BaseController
  include PendingChangeIdempotency  # Add this line near top
  
  # ... rest of controller ...
end
```

### 5.3 Update all POST endpoints that create pending_changes
**Example for update_info:**

```ruby
def update_info
  if current_user&.role == 'admin'
    if @company.update(company_params)
      return render json: { message: 'Alterações aplicadas com sucesso' }, status: :ok
    end
    return render json: { errors: @company.errors }, status: :unprocessable_entity
  end

  pending_change = @company.pending_changes.create!(
    change_type: 'company_info',
    data: {
      attributes: company_params,
      previous_values: @company.attributes.slice(*company_params.keys)
    },
    user_id: current_user&.id,
    status: 'pending',
    idempotency_key: @idempotency_key  # ← ADD THIS
  )

  Analytics::TrackEventService.call(...)
  
  render json: {
    message: 'Alterações enviadas para aprovação',
    pending_change: pending_change
  }, status: :created
end
```

**Apply same pattern to:**
- add_categories
- remove_category
- update_ctas
- update_logo
- update_banner
- upload_media
- add_video
- remove_video

### 5.4 Test idempotency
```bash
# Create test script
cat > test_idempotency.sh << 'EOF'
#!/bin/bash

TOKEN="your_token_here"
IDEM_KEY="test-$(date +%s)"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"company":{"name":"Test Company"}}' \
  http://localhost:3000/api/v1/company_dashboard/update_info

echo "First request done"
sleep 1

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"company":{"name":"Test Company"}}' \
  http://localhost:3000/api/v1/company_dashboard/update_info

echo "Second request done (should be cached)"
EOF

chmod +x test_idempotency.sh
./test_idempotency.sh
```

---

## FASE 6: Frontend JWT Fix (1 hora)

### 6.1 Move JWT to HttpOnly Cookie
**Arquivo:** `AB0-1-front/lib/api-config.ts` (presumido)

```typescript
// BEFORE: JWT in localStorage (XSS-vulnerable)
export function getApiRequestHeaders(additionalHeaders = {}) {
  const token = localStorage.getItem('auth'); // ← VULNERABLE
  // ...
}

// AFTER: JWT in HttpOnly cookie (backend sets)
export function getApiRequestHeaders(additionalHeaders = {}) {
  // Browser automatically sends cookies with requests
  // No need to extract and attach manually
  // HttpOnly flag prevents JavaScript access
  
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}
```

### 6.2 Backend sets cookie (Rails)
```ruby
# In auth controller
def login
  user = authenticate_user(params[:email], params[:password])
  
  cookies.encrypted[:jwt_token] = {
    value: user.jwt_token,
    httponly: true,      # ← JavaScript cannot access
    secure: Rails.env.production?, # ← HTTPS only in production
    same_site: :strict,   # ← CSRF protection
    expires: 7.days.from_now
  }
  
  render json: { user: user }
end
```

### 6.3 Remove localStorage usage
```typescript
// Find and remove all instances of:
localStorage.getItem('auth')
localStorage.setItem('auth', token)
localStorage.removeItem('auth')

// Replace with cookie-based approach handled by browser
```

---

## FASE 7: Comprehensive Testing (5 horas)

### 7.1 Unit Tests
```bash
cd AB0-1-back
bundle exec rspec spec/controllers/api/v1/company_dashboard_controller_spec.rb -v
bundle exec rspec spec/policies/company_dashboard_policy_spec.rb -v
bundle exec rspec spec/services/intent_summary_service_spec.rb -v
```

### 7.2 Integration Tests
```bash
bundle exec rspec spec/integration/company_dashboard_integration_spec.rb -v
```

### 7.3 Security Tests
```bash
# Run Brakeman for security scanning
brakeman --run-all-checks --quiet

# Run Bundler-audit for dependency vulnerabilities
bundler-audit check --update
```

### 7.4 Performance Tests
```bash
# Compare query counts
rails c
ActiveRecord::Base.logger = Logger.new(STDOUT)

# Test intent_summary (monitor queries)
company = Company.first
service = IntentSummaryService.new(company)
service.call

# Should see: 1 IntentScore query + 1 Lead query = 2 total
# Before fix: 14+ queries
```

### 7.5 Manual Testing (Browser)
```bash
# Test suite with manual QA
1. Login as Free user → verify cannot access premium features
2. Login as Premium user → verify can access all features
3. Try double-click "Save Changes" → verify only 1 pending_change created
4. Open DevTools Network tab → verify JWT not in localStorage
5. Try double-click rapid requests → verify cached responses
```

---

## FASE 8: Deployment (2 horas)

### 8.1 Pre-deployment checklist
- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan completed
- [ ] Database backup taken
- [ ] Rollback plan documented

### 8.2 Deploy database changes
```bash
rails db:migrate RAILS_ENV=production
```

### 8.3 Deploy code changes
```bash
git push origin security/fix-idor-and-feature-gating
# Create PR, get approval, merge to main
# Deploy via CI/CD pipeline
```

### 8.4 Post-deployment verification
```bash
# Smoke tests
curl -H "Authorization: Bearer $FREE_TOKEN" \
  https://app.avaliasolar.com.br/api/v1/company_dashboard/analytics/timeseries \
  | jq .  # Should return 403

curl -H "Authorization: Bearer $PREMIUM_TOKEN" \
  https://app.avaliasolar.com.br/api/v1/company_dashboard/analytics/timeseries \
  | jq .  # Should return 200

# Monitor error rates
# Monitor query performance
# Monitor user reports
```

### 8.5 Rollback procedure (if needed)
```bash
# Immediate rollback
git revert <commit-hash>
git push origin main

# Database rollback
rails db:rollback STEP=1 RAILS_ENV=production
```

---

## MONITORING & MAINTENANCE

### Track admin access
```sql
-- Monitor admin cross-company accesses
SELECT admin_id, COUNT(*) as accesses
FROM admin_access_logs
WHERE created_at > NOW() - INTERVAL 7 day
GROUP BY admin_id;
```

### Monitor query performance
```ruby
# Add to Rails logger after each request
if response_time > 1.second
  Rails.logger.warn("Slow request: #{action} took #{response_time}ms")
end
```

### Audit pending_change duplicates
```sql
-- Check for any remaining duplicates (should be empty)
SELECT idempotency_key, COUNT(*) as count
FROM pending_changes
WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
```

---

## Success Criteria

✅ All fixes deployed  
✅ 0 IDOR vulnerabilities detected in pen testing  
✅ Free users cannot access premium analytics  
✅ All pending_changes are deduplicated  
✅ Average response time < 500ms for intent_summary  
✅ No regressions in existing functionality  
✅ Admin audit logs functional  

---

**Questions?** Refer to `SECURITY_AUDIT_DEEP_FINDINGS.md` for technical details.

# 🚨 CRITICAL FIXES - IMPLEMENTATION GUIDE

## Overview
This document provides exact code patches for the 3 CRITICAL IDOR vulnerabilities found in the Avalia Solar audit.

---

## FIX #1: Add Authorized Company IDs Helper to User Model

### File: `AB0-1-back/app/models/user.rb`

**Add after line 63 (after `active_status?` method):**

```ruby
# Returns all company IDs where this user has authorization
# Includes primary company + all active memberships
def authorized_company_ids
  companies = []
  companies << company_id if company_id.present?
  companies.concat(active_member_companies.pluck(:id))
  companies.compact.uniq
end

# Check if user can manage a specific company
def can_manage_company?(company_id)
  return false if company_id.blank?
  return true if admin?
  
  authorized_company_ids.include?(company_id.to_i)
end

# Check if user has specific role in a company
def role_in_company(company_id)
  return 'admin' if admin?
  
  membership = company_members.find_by(company_id: company_id, status: 'active')
  membership&.role
end
```

### Verification

```bash
# In Rails console:
user = User.find_by(email: 'bob@solar.com')
user.authorized_company_ids  # => [1, 2, 5]
user.can_manage_company?(1)  # => true
user.can_manage_company?(999)  # => false
```

---

## FIX #2: Secure Companies Controller - IDOR Prevention

### File: `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

**Replace the `authorize_company_update!` method (around line 884-904) with:**

```ruby
def authorize_company_update!
  return if performed?
  return if current_user&.admin?
  
  # Get all companies the user can manage
  authorized_ids = current_user&.authorized_company_ids || []
  
  unless authorized_ids.include?(@company.id)
    Rails.logger.warn(
      "[SecurityAudit-IDOR] Unauthorized update attempt: " \
      "user_id=#{current_user&.id} " \
      "attempted_company=#{@company.id} " \
      "authorized_companies=#{authorized_ids.inspect} " \
      "path=#{request.path} " \
      "timestamp=#{Time.current.iso8601}"
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

def authorize_company_scope!
  return if performed?
  return if current_user&.admin?
  
  # Get all companies the user can access
  authorized_ids = current_user&.authorized_company_ids || []
  
  unless authorized_ids.include?(@company.id)
    Rails.logger.warn(
      "[SecurityAudit-IDOR] Unauthorized read attempt: " \
      "user_id=#{current_user&.id} " \
      "attempted_company=#{@company.id} " \
      "path=#{request.path}"
    )
    
    render json: { error: 'Forbidden' }, status: :forbidden
    return
  end
  
  unless company_active?(@company)
    render json: { error: 'Company account is not active' }, status: :forbidden
  end
end
```

**Also replace the `company_user_authorized_for_target_company?` helper (around line 926-931) with:**

```ruby
def company_user_authorized_for_target_company?
  return false unless current_user&.company_user?
  return false unless @company&.id
  
  # Use the new centralized authorization check
  current_user.can_manage_company?(@company.id)
end
```

---

## FIX #3: Secure Analytics Controller - Prevent Company Spoofing

### File: `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`

**Replace the `track` method (around line 87-154) with:**

```ruby
def track
  # Parse event parameters (existing logic remains)
  raw_type = Array(params[:event_type].presence || params[:event].presence || params.dig(:analytic, :event_type).presence).first
  legacy_properties = normalize_hash_param(params[:properties]) || normalize_hash_param(params.dig(:analytic, :properties)) || {}
  
  company_id = Array(
    params[:company_id].presence ||
    params.dig(:company, :id).presence ||
    params.dig(:analytic, :company_id).presence ||
    legacy_properties['company_id'].presence ||
    legacy_properties[:company_id].presence
  ).first
  
  event_id = Array(params[:event_id].presence || params.dig(:analytic, :event_id).presence).first
  
  metadata = normalize_hash_param(params[:metadata]) || normalize_hash_param(params[:data]) || normalize_hash_param(params.dig(:analytic, :metadata)) || legacy_properties.presence || {}
  
  tracked_at = parse_tracked_at(
    params[:tracked_at].presence || params.dig(:analytic, :tracked_at).presence || metadata['tracked_at'].presence || metadata[:tracked_at].presence
  )

  unless raw_type.present?
    Rails.logger.warn("[Analytics] Rejecting event: event_type missing. Payload: #{params.to_unsafe_h.slice('event', 'event_type', 'analytic')}")
    return render json: { status: 'error', message: 'event_type ausente' }, status: :bad_request 
  end

  event_type = map_event_type(raw_type)
  log_legacy_alias_usage(raw_type: raw_type, canonical_event_type: event_type, company_id: company_id) if raw_type.to_s != event_type.to_s
  
  if company_id.blank? && !ALLOW_ANONYMOUS_EVENTS.include?(event_type)
    Rails.logger.warn("[Analytics] Rejecting event: company_id missing for non-anonymous event '#{event_type}'. Payload: #{params.to_unsafe_h.slice('company_id', 'company', 'properties')}")
    return render json: { status: 'error', message: 'company_id ausente' }, status: :bad_request
  end

  # ✅ SECURITY: Validate authorization if authenticated user + company specified
  if current_user && company_id.present?
    unless current_user.can_manage_company?(company_id)
      Rails.logger.warn(
        "[SecurityAudit-Analytics] Unauthorized tracking attempt: " \
        "user_id=#{current_user.id} " \
        "attempted_company=#{company_id} " \
        "event_type=#{event_type} " \
        "timestamp=#{Time.current.iso8601}"
      )
      
      return render json: { 
        status: 'error', 
        message: 'Not authorized to track events for this company',
        code: 'UNAUTHORIZED_COMPANY'
      }, status: :forbidden
    end
  end
  
  # If no authenticated user AND company is specified, reject
  # (prevent anonymous tracking for specific companies)
  if current_user.nil? && company_id.present? && !ALLOW_ANONYMOUS_EVENTS.include?(event_type)
    return render json: { 
      status: 'error', 
      message: 'Authentication required to track events for company' 
    }, status: :unauthorized
  end

  Analytics::TrackEventService.call(
    company_id: company_id,
    event_type: event_type,
    metadata: metadata.merge(request_metadata),
    user: current_user,
    tracked_at: tracked_at,
    event_id: event_id
  )

  render json: { status: 'success' }
rescue ActiveRecord::RecordNotFound
  render json: { status: 'error', message: 'Company not found' }, status: :not_found
rescue Pundit::NotAuthorizedError
  render json: { status: 'error', message: 'Forbidden' }, status: :forbidden
rescue StandardError => e
  Rails.logger.error("[Analytics] track error: #{e.class}: #{e.message}")
  render json: { status: 'error', message: 'Erro interno no servidor' }, status: :internal_server_error
end
```

**Also add the same authorization to `events_track` method (around line 36-83):**

```ruby
def events_track
  if request.raw_post.to_s.strip.blank?
    return head :no_content
  end

  event_type = Array(params[:event_name] || params[:event_type]).first
  company_id = Array(params[:company_id]).first
  metadata = normalize_hash_param(params[:properties]) || normalize_hash_param(params[:metadata]) || {}
  
  return render json: { error: 'event_type is required' }, status: :bad_request if event_type.blank?

  # ✅ SECURITY: Validate authorization if company specified
  if current_user && company_id.present?
    unless current_user.can_manage_company?(company_id)
      Rails.logger.warn(
        "[SecurityAudit-EventsTrack] Unauthorized tracking: " \
        "user_id=#{current_user.id} company_id=#{company_id}"
      )
      return render json: { 
        error: 'Not authorized to track events for this company' 
      }, status: :forbidden
    end
  end

  # Prevent anonymous tracking for specific companies
  if current_user.nil? && company_id.present?
    return render json: { error: 'Authentication required' }, status: :unauthorized
  end

  # Validate micro-interaction events
  if event_type == 'micro_interaction'
    validator = MicroInteractionValidator.new(params)
    unless validator.valid?
      return render json: { errors: validator.errors }, status: :unprocessable_entity
    end
  end

  # Handle session_id and anonymous_id persistence
  session_id = cookies.signed[:as_sid] || SecureRandom.uuid
  cookies.signed[:as_sid] = {
    value: session_id,
    expires: 1.year.from_now,
    httponly: true,
    same_site: :lax
  }

  anonymous_id = cookies[:anonymous_id] || generate_anonymous_id
  metadata['session_id'] ||= session_id
  metadata['anonymous_id'] ||= anonymous_id

  result = Analytics::TrackEventService.call(
    company_id: company_id,
    event_type: event_type,
    metadata: metadata.merge(request_metadata),
    user: current_user
  )

  if result.ok
    render json: { status: 'success', event_id: result.event&.id }
  else
    render json: { status: 'error', message: result.error }, status: :unprocessable_entity
  end
rescue StandardError => e
  Rails.logger.error("[EventsTrack] error: #{e.class}: #{e.message}")
  render json: { status: 'error', message: 'Internal Server Error' }, status: :internal_server_error
end
```

---

## FIX #4: Secure Company Dashboard - Missing Scope Authorization

### File: `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

**Add this before the `private` section (before line where `private` is declared):**

```ruby
private

def authenticate_company_user_or_admin!
  return if current_user&.admin?
  
  unless current_user&.company_user?
    render_error_response(
      message: 'Authentication required',
      status: :unauthorized,
      code: 'UNAUTHORIZED'
    )
  end
end

def authorize_dashboard_access!
  return if current_user&.admin?
  
  # Verify user has access to this specific company
  unless current_user&.can_manage_company?(@company.id)
    Rails.logger.warn(
      "[SecurityAudit-Dashboard] Unauthorized dashboard access: " \
      "user_id=#{current_user&.id} " \
      "attempted_company=#{@company&.id} " \
      "path=#{request.path}"
    )
    
    render json: { error: 'Forbidden' }, status: :forbidden
  end
end

def set_company
  @company = Company.find(params[:id])
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Company not found' }, status: :not_found
end
```

**Then update the `before_action` declarations (around line 4-6):**

```ruby
# BEFORE
before_action :authenticate_company_user_or_admin!
before_action :set_company

# AFTER - ADD the authorization check
before_action :authenticate_company_user_or_admin!
before_action :set_company
before_action :authorize_dashboard_access!  # ← ADD THIS LINE
```

---

## FIX #5: Test Suite for IDOR Prevention

### File: `AB0-1-back/spec/requests/api/v1/companies_controller_idor_spec.rb` (create)

```ruby
require 'rails_helper'

describe 'Api::V1::CompaniesController IDOR Prevention', type: :request do
  let(:free_plan_user) { create(:user, role: 'company') }
  let(:pro_plan_user) { create(:user, role: 'company') }
  
  let(:free_company) { create(:company, :free_plan) }
  let(:pro_company) { create(:company, :pro_plan) }
  
  before do
    # Assign users to companies
    create(:company_member, user: free_plan_user, company: free_company, role: :owner, status: :active)
    create(:company_member, user: pro_plan_user, company: pro_company, role: :owner, status: :active)
  end
  
  describe 'PATCH /api/v1/companies/:id' do
    it 'rejects update when user does not own the company' do
      # Free user tries to update Pro company
      token = encode_jwt(user_id: free_plan_user.id)
      
      patch "/api/v1/companies/#{pro_company.id}",
            headers: { 'Authorization' => "Bearer #{token}" },
            params: { 
              company: { description: 'Hacked description' }
            }
      
      expect(response).to have_http_status(:forbidden)
      expect(json_response['code']).to eq('FORBIDDEN')
      
      # Verify company was not updated
      expect(pro_company.reload.description).not_to eq('Hacked description')
    end
    
    it 'allows update when user owns the company' do
      token = encode_jwt(user_id: free_plan_user.id)
      
      patch "/api/v1/companies/#{free_company.id}",
            headers: { 'Authorization' => "Bearer #{token}" },
            params: { 
              company: { description: 'Valid update' }
            }
      
      expect(response).to have_http_status(:ok)
      expect(free_company.reload.description).to eq('Valid update')
    end
    
    it 'allows admin to update any company' do
      admin = create(:user, role: 'admin')
      token = encode_jwt(user_id: admin.id)
      
      patch "/api/v1/companies/#{free_company.id}",
            headers: { 'Authorization' => "Bearer #{token}" },
            params: { 
              company: { description: 'Admin update' }
            }
      
      expect(response).to have_http_status(:ok)
      expect(free_company.reload.description).to eq('Admin update')
    end
  end
  
  describe 'POST /api/v1/analytics/track' do
    it 'rejects event tracking for unauthorized company' do
      token = encode_jwt(user_id: free_plan_user.id)
      
      post '/api/v1/analytics/track',
           headers: { 'Authorization' => "Bearer #{token}" },
           params: {
             company_id: pro_company.id,
             event_type: 'lead_created',
             properties: { value: 1000 }
           }
      
      expect(response).to have_http_status(:forbidden)
      expect(json_response['code']).to eq('UNAUTHORIZED_COMPANY')
    end
    
    it 'allows event tracking for authorized company' do
      token = encode_jwt(user_id: free_plan_user.id)
      
      post '/api/v1/analytics/track',
           headers: { 'Authorization' => "Bearer #{token}" },
           params: {
             company_id: free_company.id,
             event_type: 'lead_created',
             properties: { value: 1000 }
           }
      
      expect(response).to have_http_status(:ok)
      expect(json_response['status']).to eq('success')
    end
  end
end

def encode_jwt(user_id:)
  payload = { user_id: user_id }
  JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
end

def json_response
  JSON.parse(response.body)
end
```

---

## Deployment Checklist

- [ ] Run all tests: `bundle exec rspec spec/requests/api/v1/companies_controller_idor_spec.rb`
- [ ] Add audit logging to production (Datadog/Sentry)
- [ ] Deploy to staging first
- [ ] Run OWASP ZAP security scan
- [ ] Verify no legitimate users are blocked
- [ ] Monitor logs for authorization attempts
- [ ] Update API documentation with security requirements
- [ ] Notify security team of changes

---

**Timeline:** These fixes should be applied immediately (this sprint)  
**Review:** Code review by security team required before merge  
**Testing:** 100% test coverage required for authorization paths  

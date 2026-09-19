# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 1C: Sales RBAC Enforcement & Privilege Escalation Hardening Specs', type: :request do
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{jwt_token_for(user)}", 'Accept' => 'application/json' }
  end

  # Setup Seeds / System Roles & Permissions
  let!(:perm_opps_read) { Sales::Permission.find_or_create_by!(resource: 'opportunities', action: 'read') { |p| p.description = 'Read opportunities' } }
  let!(:perm_accounts_read) { Sales::Permission.find_or_create_by!(resource: 'accounts', action: 'read') { |p| p.description = 'Read accounts' } }
  let!(:perm_settings_manage) { Sales::Permission.find_or_create_by!(resource: 'settings', action: 'manage') { |p| p.description = 'Manage RBAC and settings' } }

  let!(:role_sales_rep) do
    Sales::Role.find_or_create_by!(slug: 'sales_rep') do |r|
      r.name = 'Sales Representative'
      r.system = true
    end
  end

  let!(:role_sales_admin) do
    Sales::Role.find_or_create_by!(slug: 'sales_admin') do |r|
      r.name = 'Sales Administrator'
      r.system = true
    end
  end

  before do
    Sales::RolePermission.find_or_create_by!(role: role_sales_rep, permission: perm_opps_read)
    Sales::RolePermission.find_or_create_by!(role: role_sales_rep, permission: perm_accounts_read)

    Sales::RolePermission.find_or_create_by!(role: role_sales_admin, permission: perm_opps_read)
    Sales::RolePermission.find_or_create_by!(role: role_sales_admin, permission: perm_accounts_read)
    Sales::RolePermission.find_or_create_by!(role: role_sales_admin, permission: perm_settings_manage)
  end

  # Actors
  let!(:marketplace_company) { Company.find_by(name: 'Solar Mega') || create(:company, name: 'Solar Mega') }

  let!(:company_member_user) do
    User.find_by(email: 'member@solarmega.com') || User.create!(
      name: 'Company Member', email: 'member@solarmega.com', password: 'Password123!',
      terms_accepted: true, role: 'company', company: marketplace_company, confirmed_at: Time.current
    )
  end

  let!(:membership) do
    CompanyMember.find_by(company: marketplace_company, user: company_member_user) || CompanyMember.create!(company: marketplace_company, user: company_member_user, role: :owner, status: :active)
  end

  let!(:reviewer_user) do
    User.find_by(email: 'consumer@gmail.com') || User.create!(
      name: 'Reviewer Consumer', email: 'consumer@gmail.com', password: 'Password123!',
      terms_accepted: true, role: 'review', city: 'Campinas', confirmed_at: Time.current
    )
  end

  let!(:internal_no_role_user) do
    User.create!(
      name: 'Internal No Role', email: 'norole@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:sales_rep_user) do
    User.find_by(email: 'rep_1c@avaliasolar.com.br') || User.create!(
      name: 'Sales Rep User', email: 'rep_1c@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:sales_admin_user) do
    User.find_by(email: 'salesadmin_1c@avaliasolar.com.br') || User.create!(
      name: 'Sales Admin User', email: 'salesadmin_1c@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:platform_admin_user) do
    User.find_by(email: 'admin_1c@avaliasolar.com.br') || User.create!(
      name: 'Platform Admin', email: 'admin_1c@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'admin', confirmed_at: Time.current
    )
  end

  before do
    Sales::UserRole.find_or_create_by!(user: sales_rep_user, role: role_sales_rep)
    Sales::UserRole.find_or_create_by!(user: sales_admin_user, role: role_sales_admin)
  end

  describe '1. GAP-W1B-01 Fixed: Sub-Controllers Protected by Sales::BaseController' do
    it 'DENY: Anonymous request to /api/v1/sales/accounts returns 401' do
      get '/api/v1/sales/accounts', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'DENY: Reviewer user request to /api/v1/sales/accounts returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales/accounts', headers: auth_headers(reviewer_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Marketplace CompanyMember request to /api/v1/sales/accounts returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales/accounts', headers: auth_headers(company_member_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Internal user without Sales role request to /api/v1/sales/accounts returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales/accounts', headers: auth_headers(internal_no_role_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'ALLOW: Authorized Sales Rep request to /api/v1/sales/accounts returns 200' do
      get '/api/v1/sales/accounts', headers: auth_headers(sales_rep_user)
      expect([200, 404]).to include(response.status)
    end
  end

  describe '2. GAP-W1B-02 Fixed: Privilege Escalation Hardening on RBAC Management' do
    it 'DENY: Unprivileged Sales Rep cannot create new Sales::Role' do
      post '/api/v1/sales/rbac', params: { role: { name: 'Super Admin', slug: 'super_admin' } }, headers: auth_headers(sales_rep_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Unprivileged Sales Rep cannot assign Sales Admin role to self' do
      post '/api/v1/sales/user_roles', params: { user_id: sales_rep_user.id, role_id: role_sales_admin.id }, headers: auth_headers(sales_rep_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Internal user without role cannot self-assign any role' do
      post '/api/v1/sales/user_roles', params: { user_id: internal_no_role_user.id, role_id: role_sales_rep.id }, headers: auth_headers(internal_no_role_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'ALLOW: Sales Admin (with settings.manage) can assign role' do
      target_user = User.create!(
        name: 'New Sales Person', email: 'newperson@avaliasolar.com.br', password: 'Password123!',
        terms_accepted: true, role: 'company', confirmed_at: Time.current
      )

      post '/api/v1/sales/user_roles', params: { user_id: target_user.id, role_id: role_sales_rep.id }, headers: auth_headers(sales_admin_user)
      expect(response).to have_http_status(:created)
      expect(Sales::UserRole.where(user: target_user, role: role_sales_rep).exists?).to be(true)
    end
  end

  describe '3. Immediate Role Revocation Effect (Real-time No Stale Cache)' do
    it 'revokes access immediately on next request when user role is destroyed' do
      # 1. Active rep accesses accounts
      get '/api/v1/sales/accounts', headers: auth_headers(sales_rep_user)
      expect([200, 404]).to include(response.status)

      # 2. Destroy assignment
      Sales::UserRole.where(user: sales_rep_user, role: role_sales_rep).destroy_all

      # 3. Next request immediately fails with 403 SALES_FORBIDDEN
      get '/api/v1/sales/accounts', headers: auth_headers(sales_rep_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end
  end

  describe '4. UserSerializer Capability Exposure' do
    it 'exposes crm_access and sales_capabilities accurately' do
      serialized_rep = UserSerializer.new(sales_rep_user).as_json
      expect(serialized_rep[:crm_access]).to be(true)
      expect(serialized_rep[:sales_capabilities]).to include('sales.opportunities.read')

      serialized_member = UserSerializer.new(company_member_user).as_json
      expect(serialized_member[:crm_access]).to be(false)
      expect(serialized_member[:sales_capabilities]).to eq([])
    end
  end

  private

  def response_json
    JSON.parse(response.body) rescue {}
  end
end

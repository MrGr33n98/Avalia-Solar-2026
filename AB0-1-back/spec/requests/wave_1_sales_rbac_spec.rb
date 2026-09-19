# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 1: Canonical Internal Identity & Sales RBAC Specs', type: :request do
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{jwt_token_for(user)}", 'Accept' => 'application/json' }
  end

  # Setup Seeds / System Roles & Permissions
  let!(:perm_opps_read) { Sales::Permission.find_or_create_by!(resource: 'opportunities', action: 'read') { |p| p.description = 'Read opportunities' } }
  let!(:perm_opps_manage) { Sales::Permission.find_or_create_by!(resource: 'opportunities', action: 'manage') { |p| p.description = 'Manage opportunities' } }
  let!(:perm_accounts_read) { Sales::Permission.find_or_create_by!(resource: 'accounts', action: 'read') { |p| p.description = 'Read accounts' } }

  let!(:role_sales_rep) do
    Sales::Role.find_or_create_by!(slug: 'sales_rep') do |r|
      r.name = 'Sales Representative'
      r.system = true
    end
  end

  let!(:role_accounts_only) do
    Sales::Role.find_or_create_by!(slug: 'accounts_only') do |r|
      r.name = 'Accounts Only Representative'
      r.system = true
    end
  end

  before do
    Sales::RolePermission.find_or_create_by!(role: role_sales_rep, permission: perm_opps_read)
    Sales::RolePermission.find_or_create_by!(role: role_sales_rep, permission: perm_opps_manage)
    Sales::RolePermission.find_or_create_by!(role: role_accounts_only, permission: perm_accounts_read)
  end

  # Actors
  let!(:marketplace_company) { Company.find_by(name: 'Solar Tech') || create(:company, name: 'Solar Tech') }

  let!(:company_member_user) do
    User.find_by(email: 'member@solartech.com') || User.create!(
      name: 'Company Member', email: 'member@solartech.com', password: 'Password123!',
      terms_accepted: true, role: 'company', company: marketplace_company, confirmed_at: Time.current
    )
  end

  let!(:membership) do
    CompanyMember.find_by(company: marketplace_company, user: company_member_user) || CompanyMember.create!(company: marketplace_company, user: company_member_user, role: :owner, status: :active)
  end

  let!(:reviewer_user) do
    User.find_by(email: 'reviewer@consumer.com') || User.create!(
      name: 'Reviewer Consumer', email: 'reviewer@consumer.com', password: 'Password123!',
      terms_accepted: true, role: 'review', city: 'São Paulo', confirmed_at: Time.current
    )
  end

  let!(:internal_unauthorized_user) do
    User.find_by(email: 'internal_norole@avaliasolar.com.br') || User.create!(
      name: 'Internal No Role', email: 'internal_norole@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:internal_accounts_only_user) do
    User.find_by(email: 'accounts_only@avaliasolar.com.br') || User.create!(
      name: 'Accounts Only Rep', email: 'accounts_only@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:internal_sales_rep_user) do
    User.find_by(email: 'sales_rep@avaliasolar.com.br') || User.create!(
      name: 'Sales Rep User', email: 'sales_rep@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'company', confirmed_at: Time.current
    )
  end

  let!(:platform_admin_user) do
    User.find_by(email: 'admin@avaliasolar.com.br') || User.create!(
      name: 'Platform Admin', email: 'admin@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'admin', confirmed_at: Time.current
    )
  end

  before do
    Sales::UserRole.find_or_create_by!(user: internal_accounts_only_user, role: role_accounts_only)
    Sales::UserRole.find_or_create_by!(user: internal_sales_rep_user, role: role_sales_rep)
  end

  describe '1. Negative Tests: Strict Product Boundary Enforcement' do
    it 'DENY: Anonymous request to Sales CRM returns 401 Unauthorized' do
      get '/api/v1/sales', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'DENY: Reviewer user request to Sales CRM returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(reviewer_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Marketplace CompanyMember request to Sales CRM returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(company_member_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Internal user without any Sales role returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(internal_unauthorized_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Internal user with accounts_only role (lacking opportunities permission) returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(internal_accounts_only_user)
      expect(response).to have_http_status(:forbidden)
      expect(response_json['code']).to eq('SALES_FORBIDDEN')
    end
  end

  describe '2. Positive Tests: Canonical Internal Staff Capability' do
    it 'ALLOW: Authorized Sales Rep accesses Sales index and summary' do
      get '/api/v1/sales', headers: auth_headers(internal_sales_rep_user)
      expect(response).to have_http_status(:ok)
      expect(response_json).to have_key('opportunities')

      get '/api/v1/sales/summary', headers: auth_headers(internal_sales_rep_user)
      expect(response).to have_http_status(:ok)
      expect(response_json).to have_key('pipeline_value_cents')
    end

    it 'ALLOW: Platform Admin accesses Sales index and summary via documented admin bypass' do
      get '/api/v1/sales', headers: auth_headers(platform_admin_user)
      expect(response).to have_http_status(:ok)

      get '/api/v1/sales/summary', headers: auth_headers(platform_admin_user)
      expect(response).to have_http_status(:ok)
    end
  end

  describe '3. ActiveAdmin Boundary Isolation' do
    it 'DENY: Authorized Sales Rep cannot access /admin (ActiveAdmin is separate for AdminUser)' do
      get '/admin', headers: auth_headers(internal_sales_rep_user)
      expect([302, 401, 403, 404]).to include(response.status)
    end
  end

  describe '4. Sales::AuthorizationService Unit Contract' do
    it 'resolves dot-notation and direct resource/action correctly' do
      expect(Sales::AuthorizationService.can?(user: internal_sales_rep_user, permission: 'sales.opportunities.read')).to be(true)
      expect(Sales::AuthorizationService.can?(user: internal_sales_rep_user, resource: 'opportunities', action: 'read')).to be(true)
      expect(Sales::AuthorizationService.can?(user: internal_accounts_only_user, permission: 'sales.opportunities.read')).to be(false)
      expect(Sales::AuthorizationService.can?(user: internal_accounts_only_user, permission: 'sales.accounts.read')).to be(true)
      expect(Sales::AuthorizationService.can?(user: company_member_user, permission: 'sales.opportunities.read')).to be(false)
    end
  end

  private

  def response_json
    JSON.parse(response.body) rescue {}
  end
end

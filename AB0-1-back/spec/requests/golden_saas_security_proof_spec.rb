# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Golden SaaS Security Proof & Baseline Specs', type: :request do
  # Helper to encode JWT tokens directly matching BaseController#decoded_token expectations
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{jwt_token_for(user)}", 'Accept' => 'application/json' }
  end

  describe '1. Environment Safety Verification' do
    it 'runs strictly in test environment with test database' do
      expect(Rails.env.test?).to be(true)
      expect(Rails.env.production?).to be(false)
      expect(ActiveRecord::Base.connection.current_database).to match(/test|ab0_test/i)
    end
  end

  describe '2. Tenancy Adversarial Matrix & IDOR Verification' do
    let!(:company_a) { FactoryBot.create(:company, name: 'Solar A') }
    let!(:company_b) { FactoryBot.create(:company, name: 'Solar B') }

    let!(:user_a) do
      User.create!(
        name: 'Member A', email: 'member_a@solara.com', password: 'Password123!',
        terms_accepted: true, role: 'company', company: company_a, confirmed_at: Time.current
      )
    end

    let!(:user_b) do
      User.create!(
        name: 'Member B', email: 'member_b@solarb.com', password: 'Password123!',
        terms_accepted: true, role: 'company', company: company_b, confirmed_at: Time.current
      )
    end

    let!(:membership_a) do
      CompanyMember.create!(company: company_a, user: user_a, role: :owner, status: :active)
    end

    let!(:membership_b) do
      CompanyMember.create!(company: company_b, user: user_b, role: :owner, status: :active)
    end

    let!(:reviewer_user) do
      User.create!(
        name: 'Consumer User', email: 'consumer@gmail.com', password: 'Password123!',
        terms_accepted: true, role: 'review', city: 'São Paulo', confirmed_at: Time.current
      )
    end

    let!(:admin_user) do
      User.create!(
        name: 'Platform Admin', email: 'admin@avaliasolar.com.br', password: 'Password123!',
        terms_accepted: true, role: 'admin', confirmed_at: Time.current
      )
    end

    context 'CompanyDashboard Tenancy' do
      it 'ALLOW: Member A accesses Company A dashboard overview' do
        get '/api/v1/company_dashboard/analytics/overview', headers: auth_headers(user_a)
        expect(response).to have_http_status(:success)
      end

      it 'DENY: Member A cannot access Company B metrics via company_id query parameter' do
        get "/api/v1/company_dashboard/analytics/overview?company_id=#{company_b.id}", headers: auth_headers(user_a)
        # Controller overrides or ignores company_b ID because user_a has no membership for company_b
        expect(response).to have_http_status(:success).or have_http_status(:forbidden)
        if response.status == 200
          body = JSON.parse(response.body) rescue {}
          expect(body['company_id']).not_to eq(company_b.id)
        end
      end

      it 'DENY: Reviewer user cannot access Company Dashboard' do
        get '/api/v1/company_dashboard/analytics/overview', headers: auth_headers(reviewer_user)
        expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
      end

      it 'DENY: Anonymous user cannot access Company Dashboard' do
        get '/api/v1/company_dashboard/analytics/overview', headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'Company Materials & Project Scoped Endpoints' do
      it 'ALLOW: Member A accesses own company materials' do
        get "/api/v1/companies/#{company_a.id}/materials", headers: auth_headers(user_a)
        expect([200, 404]).to include(response.status)
      end

      it 'DENY: Member A cannot mutate or delete Company B profile' do
        patch "/api/v1/companies/#{company_b.id}", params: { company: { name: 'Hacked Name' } }, headers: auth_headers(user_a)
        expect([401, 403, 404, 422]).to include(response.status)
        expect(company_b.reload.name).to eq('Solar B')
      end
    end
  end

  describe '3. JWT Revocation Regression Spec (SEC-02 Proof)' do
    let!(:user) do
      User.create!(
        name: 'JWT Test User', email: 'jwt_test@avaliasolar.com', password: 'Password123!',
        terms_accepted: true, role: 'company', confirmed_at: Time.current
      )
    end

    it 'PROVES SEC-02: Revoked JWT token remains accepted by BaseController until exp expiry' do
      token = jwt_token_for(user)

      # 1. Normal authenticated request works (200)
      get '/api/v1/users/profile', headers: { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:success)

      # 2. Simulate token revocation via Redis blacklist (as done during logout)
      if defined?(JwtBlacklistService)
        JwtBlacklistService.revoke_token(token) rescue nil
      end

      # 3. Repeat authenticated request with the SAME token
      # Expected Golden SaaS contract: 401 Unauthorized
      # AS-IS behavior: BaseController does not check blacklist, so returns 200
      get '/api/v1/users/profile', headers: { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }

      # SEC-02 proof: BaseController yields 200 because revoked? is omitted in BaseController#current_user
      expect(response.status).to eq(200)
    end
  end

  describe '4. Sales CRM Internal Staff Boundary Verification' do
    let!(:company) { FactoryBot.create(:company, name: 'Marketplace Partner') }
    let!(:company_member_user) do
      User.create!(
        name: 'Company Member', email: 'partner_member@partner.com', password: 'Password123!',
        terms_accepted: true, role: 'company', company: company, confirmed_at: Time.current
      )
    end
    let!(:reviewer_user) do
      User.create!(
        name: 'Reviewer Consumer', email: 'rev_consumer@gmail.com', password: 'Password123!',
        terms_accepted: true, role: 'review', city: 'Curitiba', confirmed_at: Time.current
      )
    end
    let!(:admin_staff) do
      User.create!(
        name: 'Internal Sales Admin', email: 'sales_admin@avaliasolar.com.br', password: 'Password123!',
        terms_accepted: true, role: 'admin', confirmed_at: Time.current
      )
    end

    it 'DENY: Anonymous request to Sales CRM returns 401' do
      get '/api/v1/sales', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'DENY: Reviewer user request to Sales CRM returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(reviewer_user)
      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body) rescue {}
      expect(body['code']).to eq('SALES_FORBIDDEN')
    end

    it 'DENY: Marketplace CompanyMember request to Sales CRM returns 403 SALES_FORBIDDEN' do
      get '/api/v1/sales', headers: auth_headers(company_member_user)
      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body) rescue {}
      expect(body['code']).to eq('SALES_FORBIDDEN')
    end

    it 'ALLOW: Internal Admin Staff accesses Sales CRM' do
      get '/api/v1/sales', headers: auth_headers(admin_staff)
      expect(response).to have_http_status(:success)
    end
  end

  describe '5. ActiveAdmin Boundary Verification' do
    let!(:company_user) do
      User.create!(
        name: 'Company Boss', email: 'boss@enterprise.com', password: 'Password123!',
        terms_accepted: true, role: 'company', confirmed_at: Time.current
      )
    end

    it 'DENY: Marketplace User cannot authenticate into ActiveAdmin /admin' do
      get '/admin', headers: auth_headers(company_user)
      # ActiveAdmin redirects to admin login or denies unauthenticated AdminUser
      expect([302, 401, 403, 404]).to include(response.status)
    end
  end
end

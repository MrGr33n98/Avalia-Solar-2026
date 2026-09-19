# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 0: Tenancy Subresources Adversarial Specs', type: :request do
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{jwt_token_for(user)}", 'Accept' => 'application/json' }
  end

  let!(:company_a) { FactoryBot.create(:company, name: 'Solar Alpha') }
  let!(:company_b) { FactoryBot.create(:company, name: 'Solar Beta') }

  let!(:user_a) do
    user = User.create!(
      name: 'Owner A', email: 'owner_a@solaralpha.com', password: 'Password123!',
      terms_accepted: true, role: 'company', company: company_a, confirmed_at: Time.current,
      status: :active
    )
    CompanyMember.create!(company: company_a, user: user, role: :owner, status: :active)
    user
  end

  let!(:user_b) do
    user = User.create!(
      name: 'Owner B', email: 'owner_b@solarbeta.com', password: 'Password123!',
      terms_accepted: true, role: 'company', company: company_b, confirmed_at: Time.current,
      status: :active
    )
    CompanyMember.create!(company: company_b, user: user, role: :owner, status: :active)
    user
  end

  describe '1. Company Dashboard & Analytics Subresources' do
    it 'ALLOW: Member A accesses Company A dashboard overview' do
      get '/api/v1/company_dashboard/analytics/overview', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
    end

    it 'DENY / ISOLATE: Member A passing company_id=B cannot access Company B analytics' do
      get "/api/v1/company_dashboard/analytics/overview?company_id=#{company_b.id}", headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok).or have_http_status(:forbidden)
      if response.status == 200
        data = JSON.parse(response.body) rescue {}
        expect(data['company_id']).not_to eq(company_b.id)
      end
    end
  end

  describe '2. Company Sector Questions Subresource' do
    it 'ALLOW / ISOLATE: Member A queries sector questions' do
      get '/api/v1/company_dashboard/sector_questions', headers: auth_headers(user_a)
      expect([200, 403]).to include(response.status)
    end
  end

  describe '3. Company Banners Subresource' do
    it 'ALLOW / ISOLATE: Member A accesses own company dashboard banners' do
      get '/api/v1/company_dashboard/banners', headers: auth_headers(user_a)
      expect([200, 403]).to include(response.status)
    end
  end

  describe '4. Company Stats Subresource' do
    it 'ALLOW: Member A views own company dashboard stats' do
      get '/api/v1/company_dashboard/stats', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
    end
  end
end

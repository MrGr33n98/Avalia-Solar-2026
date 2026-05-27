# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company feature access API', type: :request do
  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')
    {
      'ACCEPT' => 'application/json',
      'Authorization' => "Bearer #{token}"
    }
  end

  let(:free_plan) do
    create(:plan, name: "Free #{SecureRandom.hex(4)}", price: 0, features_json: PlanFeatureCatalog.defaults_for_tier('free'))
  end

  let(:pro_plan) do
    create(:plan, name: "Pro #{SecureRandom.hex(4)}", price: 99.0, features_json: PlanFeatureCatalog.defaults_for_tier('pro'))
  end

  let(:enterprise_plan) do
    create(:plan, name: "Enterprise #{SecureRandom.hex(4)}", price: 499.0, features_json: PlanFeatureCatalog.defaults_for_tier('enterprise'))
  end

  let(:company) { create(:company, plan: free_plan, intent_tier: 'free') }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  describe 'GET /api/v1/companies/:id/feature_access' do
    it 'returns feature access for an authorized company member' do
      get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body['features']).to be_a(Hash)
      expect(body['features'].dig('intent_scores', 'state')).to eq('locked')
      expect(body['plan']).to eq('free')
      expect(body['subscription']['status']).to be_present
      expect(body['metadata']).to include(
        'version' => 1,
        'cache_ttl_seconds' => 300
      )
    end

    it 'forbids a user outside the company' do
      outsider = create(:user, role: 'company', status: :active)

      get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers_for(outsider)

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']).to eq('Unauthorized')
    end

    it 'returns enabled Pro runtime feature state when the company has intent Pro access' do
      company.update!(plan: pro_plan, intent_tier: 'pro')

      get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['plan']).to eq('pro')
      expect(body['features'].dig('intent_scores', 'state')).to eq('enabled')
    end

    it 'returns enabled Enterprise feature state for webhooks' do
      company.update!(plan: enterprise_plan, intent_tier: 'enterprise')

      get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['plan']).to eq('enterprise')
      expect(body['features'].dig('webhooks', 'state')).to eq('enabled')
    end

    it 'includes subscription context when a billing subscription exists' do
      subscription = Billing::CompanySubscription.create!(
        company: company,
        plan: free_plan,
        status: 'active',
        current_period_start: 1.day.ago,
        current_period_end: 29.days.from_now
      )

      get "/api/v1/companies/#{company.id}/feature_access", headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['subscription']['status']).to eq(subscription.status)
      expect(body['subscription']['current_period_end']).to be_present
    end
  end
end

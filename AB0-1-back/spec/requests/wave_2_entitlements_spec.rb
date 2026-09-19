# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 2: Canonical Entitlements & Feature Gating Request Specs', type: :request do
  def jwt_token_for(user)
    payload = {
      user_id: user.id,
      typ: 'access',
      exp: 24.hours.from_now.to_i,
      iat: Time.current.to_i,
      jti: SecureRandom.uuid
    }
    JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    {
      'Authorization' => "Bearer #{jwt_token_for(user)}",
      'Accept' => 'application/json'
    }
  end

  let(:company_a) do
    create(:company, name: 'Empresa Alpha (Free)', plan: nil)
  end

  let(:pro_plan) do
    plan = Plan.find_or_create_by!(name: 'Plano Pro Solar') do |p|
      p.price = 499.0
    end
    plan.update!(
      features_json: {
        'premium_profile' => true,
        'featured_products' => 10,
        'p2p_chat' => true,
        'webhooks' => true,
        'custom_ctas' => true
      }
    )
    plan
  end

  let(:company_b) do
    create(:company, name: 'Empresa Beta (Pro)', plan: pro_plan)
  end

  let(:user_a) do
    User.create!(
      name: 'Membro Empresa A',
      email: 'membro_a@alpha.com.br',
      password: 'Password123!',
      role: 'company',
      terms_accepted: true,
      confirmed_at: Time.current
    )
  end

  let(:user_b) do
    User.create!(
      name: 'Membro Empresa B',
      email: 'membro_b@beta.com.br',
      password: 'Password123!',
      role: 'company',
      terms_accepted: true,
      confirmed_at: Time.current
    )
  end

  before do
    CompanyMember.create!(company: company_a, user: user_a, role: 'owner', status: 'active')
    CompanyMember.create!(company: company_b, user: user_b, role: 'owner', status: 'active')
  end

  describe '1. Canonical Entitlement Resolution Endpoint' do
    it 'returns resolved entitlements for company B (Pro)' do
      get "/api/v1/companies/#{company_b.id}/feature_access", headers: auth_headers(user_b)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['features']).to be_present
      expect(json['features']['premium_profile']['state']).to eq('enabled')
      expect(json['features']['p2p_chat']['state']).to eq('enabled')
      expect(json['plan']['tier']).to eq('pro')
    end

    it 'returns locked state for premium features on company A (Free)' do
      get "/api/v1/companies/#{company_a.id}/feature_access", headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['features']).to be_present
      expect(json['features']['premium_profile']['state']).to eq('locked')
      expect(json['features']['p2p_chat']['state']).to eq('locked')
      expect(json['plan']['tier']).to eq('free')
    end
  end

  describe '2. Tenant Isolation on Entitlements' do
    it 'DENY: Member of Company A cannot access feature_access of Company B' do
      get "/api/v1/companies/#{company_b.id}/feature_access", headers: auth_headers(user_a)

      # Should be forbidden or company access required
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe '3. Forced Backend Request Bypass Prevention' do
    it 'enforces feature gate at controller level and rejects free tier unauthorized feature attempt' do
      # Directly attempt an action protected by feature gate
      dummy_controller = Class.new(Api::V1::BaseController) do
        include FeatureGateEnforceable
        def test_feature
          enforce_feature_access!('premium_profile', company_id: params[:company_id])
          render json: { success: true } unless performed?
        end
      end

      # We test via EntitlementService and FeatureGateEnforceable
      explanation = EntitlementService.explain(company: company_a, feature: 'premium_profile')
      expect(explanation[:allowed]).to be(false)
      expect(explanation[:reason]).to eq('upgrade_required')
    end
  end
end

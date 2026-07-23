# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard Feature Gating', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  context 'for a free company (no plan)' do
    describe 'GET /api/v1/company_dashboard/analytics/overview' do
      it 'returns minimal data without premium analytics' do
        get '/api/v1/company_dashboard/analytics/overview'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        # Should have basic fields
        expect(json).to have_key('views_30d')
        expect(json).to have_key('data_source')

        # Should NOT have premium fields
        expect(json).not_to have_key('cta_clicks_30d')
        expect(json).not_to have_key('leads_30d')
        expect(json).not_to have_key('conversion_rate')

        # Should indicate not premium
        expect(json['is_premium_analytics']).to be(false)
        expect(json['upsell_message']).to include('Upgrade to Pro')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/timeseries' do
      it 'blocks access and returns empty data' do
        get '/api/v1/company_dashboard/analytics/timeseries'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['data']).to eq([])
        expect(json['data_source']).to eq('feature_not_authorized')
        expect(json['is_premium_analytics']).to be(false)
        expect(json['upsell_message']).to include('Upgrade to Pro')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/top_campaigns' do
      it 'blocks access and returns empty campaigns' do
        get '/api/v1/company_dashboard/analytics/top_campaigns'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['campaigns']).to eq([])
        expect(json['is_premium_analytics']).to be(false)
        expect(json['upsell_message']).to include('Upgrade to Pro')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/reputation' do
      it 'blocks access and returns empty reputation data' do
        get '/api/v1/company_dashboard/analytics/reputation'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['total_reviews']).to eq(0)
        expect(json['avg_rating']).to eq(0)
        expect(json['trust_score']).to eq(0)
        expect(json['is_premium_analytics']).to be(false)
        expect(json['upsell_message']).to include('Upgrade to Pro')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/ranking' do
      it 'blocks access and returns empty ranking data' do
        get '/api/v1/company_dashboard/analytics/ranking'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['rank_position']).to be_nil
        expect(json['ranking_score']).to eq(0)
        expect(json['magic_quadrant_points']).to eq([])
        expect(json['historical_data']).to eq([])
        expect(json.dig('transparency', 'sponsored_included')).to be(false)
        expect(json['is_premium_analytics']).to be(false)
        expect(json['upsell_message']).to include('Upgrade to Pro or Enterprise')
      end
    end
  end

  context 'for a pro company' do
    before do
      plan = create(:plan, name: 'Pro', price: 99.0)
      company.update(plan: plan)
      allow(plan).to receive(:tier).and_return('pro')
      allow(plan).to receive(:plan_tier).and_return('pro')
    end

    describe 'GET /api/v1/company_dashboard/analytics/overview' do
      it 'returns full premium analytics data' do
        AnalyticsEvent.create!(
          company: company,
          event_id: 'evt_profile_view',
          event_type: 'profile_view',
          metadata: { source: 'spec' },
          tracked_at: 1.day.ago
        )

        get '/api/v1/company_dashboard/analytics/overview'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
        expect(json).to have_key('cta_clicks_30d')
        expect(json).to have_key('leads_30d')
        expect(json).to have_key('conversion_rate')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/timeseries' do
      it 'grants access to timeseries data' do
        get '/api/v1/company_dashboard/analytics/timeseries'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
        expect(json['data_source']).not_to eq('feature_not_authorized')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/top_campaigns' do
      it 'grants access to top campaigns' do
        get '/api/v1/company_dashboard/analytics/top_campaigns'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
        expect(json).to have_key('campaigns')
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/reputation' do
      it 'grants access to reputation data' do
        get '/api/v1/company_dashboard/analytics/reputation'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
        expect(json).to have_key('historical_data')
        expect(json.dig('transparency', 'purpose')).to eq('organic_performance')
        expect(json.dig('transparency', 'sponsored_included')).to be(false)
      end
    end

    describe 'GET /api/v1/company_dashboard/analytics/ranking' do
      it 'grants access to ranking data' do
        get '/api/v1/company_dashboard/analytics/ranking'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
      end
    end
  end

  context 'for an enterprise company' do
    before do
      plan = create(:plan, name: 'Enterprise', price: 499.0)
      company.update(plan: plan)
      allow(plan).to receive(:tier).and_return('enterprise')
      allow(plan).to receive(:plan_tier).and_return('enterprise')
    end

    describe 'GET /api/v1/company_dashboard/analytics/ranking' do
      it 'grants full access to enterprise features' do
        get '/api/v1/company_dashboard/analytics/ranking'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['is_premium_analytics']).to be(true)
      end
    end
  end
end

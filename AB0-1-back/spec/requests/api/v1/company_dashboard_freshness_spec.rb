# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard Freshness Metadata', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  before do
    # Setup pro plan so feature gating allows access
    plan = create(:plan, name: 'Pro', price: 99.0)
    company.update(plan: plan)
    allow(plan).to receive(:tier).and_return('pro')
    allow(plan).to receive(:plan_tier).and_return('pro')

    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
    
    # Setup freshness state
    ActiveRecord::Base.connection.execute(
      "DELETE FROM analytics_processing_state WHERE pipeline_name = 'main_aggregation'"
    )
    ActiveRecord::Base.connection.execute(
      "INSERT INTO analytics_processing_state (pipeline_name, last_processed_at, updated_at) " \
      "VALUES ('main_aggregation', '#{1.hour.ago.iso8601}', '#{Time.current.iso8601}')"
    )
  end

  describe 'GET /api/v1/company_dashboard/analytics/overview' do
    it 'includes freshness metadata' do
      get '/api/v1/company_dashboard/analytics/overview'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('last_aggregated_at')
      expect(json).to have_key('data_freshness_seconds')
      expect(json['data_freshness_seconds']).to be >= 3600
    end

    it 'falls back to analytics_events when canonical aggregates are not available yet' do
      AnalyticsEvent.create!(
        company: company,
        event_id: 'evt_profile_view_fallback',
        event_type: 'profile_view',
        metadata: { source: 'request_spec' },
        tracked_at: 20.minutes.ago
      )
      AnalyticsEvent.create!(
        company: company,
        event_id: 'evt_lead_fallback',
        event_type: 'lead_created',
        metadata: { source: 'request_spec' },
        tracked_at: 10.minutes.ago
      )

      get '/api/v1/company_dashboard/analytics/overview'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['views_30d']).to eq(1)
      expect(json['leads_30d']).to eq(1)
      expect(json['conversion_rate']).to eq(100.0)
      expect(json['data_source']).to eq('analytics_events_fallback')
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/timeseries' do
    it 'includes freshness metadata' do
      get '/api/v1/company_dashboard/analytics/timeseries'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('last_aggregated_at')
      expect(json).to have_key('data_freshness_seconds')
      expect(json['data_source']).to eq('company_daily_stats_unavailable')
    end

    it 'flags unavailable canonical source explicitly' do
      allow_any_instance_of(CompanyDashboard::MetricsSource).to receive(:available?).and_return(false)

      get '/api/v1/company_dashboard/analytics/timeseries'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']).to eq([])
      expect(json['data_source']).to eq('company_daily_stats_unavailable')
    end

    it 'returns realtime fallback series from analytics_events when aggregates are empty' do
      AnalyticsEvent.create!(
        company: company,
        event_id: 'evt_series_profile',
        event_type: 'profile_view',
        metadata: { source: 'request_spec' },
        tracked_at: 2.days.ago.change(hour: 14)
      )
      AnalyticsEvent.create!(
        company: company,
        event_id: 'evt_series_cta',
        event_type: 'cta_click',
        metadata: { source: 'request_spec' },
        tracked_at: 2.days.ago.change(hour: 15)
      )

      get '/api/v1/company_dashboard/analytics/timeseries', params: { days: 7 }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data_source']).to eq('analytics_events_fallback')
      expect(json['data']).not_to be_empty
      day_row = json['data'].find { |row| Date.parse(row['date']) == 2.days.ago.to_date }
      expect(day_row).to include('views' => 1, 'clicks' => 1, 'whatsapp' => 0, 'leads' => 0)
    end

    it 'denies access for free users' do
      # Switch to free plan
      free_plan = create(:plan, name: 'Free', price: 0)
      company.update(plan: free_plan)
      allow(free_plan).to receive(:tier).and_return('free')
      allow(free_plan).to receive(:plan_tier).and_return('free')

      get '/api/v1/company_dashboard/analytics/timeseries'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']).to eq([])
      expect(json['data_source']).to eq('feature_not_authorized')
      expect(json['is_premium_analytics']).to be(false)
    end
  end

  describe 'GET /api/v1/company_dashboard/stats' do
    it 'includes freshness metadata in stats object' do
      get '/api/v1/company_dashboard/stats'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['stats']).to have_key('last_aggregated_at')
      expect(json['stats']).to have_key('data_freshness_seconds')
      expect(json['stats']).to have_key('data_source')
      expect(json['stats']['data_source']).to eq('company_denormalized_fallback')
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard Analytics Remediation', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }
  let(:selected_day) { 5.days.ago.to_date }

  before do
    plan = create(:plan, name: 'Pro', price: 99.0)
    company.update!(plan: plan)
    allow(plan).to receive(:tier).and_return('pro')
    allow(plan).to receive(:plan_tier).and_return('pro')

    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
    allow(CompanyDashboard::FreshnessProvider).to receive(:call).and_return(
      last_aggregated_at: 1.hour.ago,
      data_freshness_seconds: 3600
    )
  end

  def json_body
    JSON.parse(response.body)
  end

  describe 'GET /api/v1/company_dashboard/analytics/overview' do
    it 'respeita from/to e fecha o breakdown de CTA com quote e other' do
      create(
        :analytics_event,
        company: company,
        event_type: 'profile_view',
        tracked_at: selected_day.change(hour: 9),
        metadata: { source: 'spec' },
        event_id: 'evt-remediation-overview-view'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: selected_day.change(hour: 10),
        metadata: { source: 'spec', cta_type: 'whatsapp' },
        event_id: 'evt-remediation-overview-whatsapp'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: selected_day.change(hour: 11),
        metadata: { source: 'spec', cta_type: 'quote' },
        event_id: 'evt-remediation-overview-quote'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: selected_day.change(hour: 12),
        metadata: { source: 'spec' },
        event_id: 'evt-remediation-overview-other'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'lead_created',
        tracked_at: selected_day.change(hour: 13),
        metadata: { source: 'spec' },
        event_id: 'evt-remediation-overview-lead'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: 30.days.ago,
        metadata: { source: 'spec', cta_type: 'quote' },
        event_id: 'evt-remediation-overview-outside'
      )

      get '/api/v1/company_dashboard/analytics/overview',
          params: { from: selected_day.iso8601, to: selected_day.iso8601 }

      expect(response).to have_http_status(:ok)
      expect(json_body).to include(
        'views' => 1,
        'cta_clicks' => 3,
        'quote_clicks' => 1,
        'leads' => 1,
        'conversion_rate' => 100.0,
        'data_source' => 'analytics_events_fallback',
        'data_status' => 'ready',
        'range' => { 'from' => selected_day.iso8601, 'to' => selected_day.iso8601 }
      )
      expect(json_body['cta_breakdown']).to eq(
        'whatsapp' => 1,
        'email' => 0,
        'phone' => 0,
        'website' => 0,
        'quote' => 1,
        'other' => 1,
        'total' => 3
      )
    end

    it 'mantem zero real quando a fonte está ready' do
      create(:company_daily_stat, company: company, day: selected_day, profile_views: 0, cta_clicks: 0, quote_clicks: 0, leads: 0)

      get '/api/v1/company_dashboard/analytics/overview',
          params: { from: selected_day.iso8601, to: selected_day.iso8601 }

      expect(response).to have_http_status(:ok)
      expect(json_body).to include(
        'views' => 0,
        'cta_clicks' => 0,
        'quote_clicks' => 0,
        'leads' => 0,
        'conversion_rate' => 0,
        'data_source' => 'company_daily_stats',
        'data_status' => 'ready'
      )
      expect(json_body['cta_breakdown']).to eq(
        'whatsapp' => 0,
        'email' => 0,
        'phone' => 0,
        'website' => 0,
        'quote' => 0,
        'other' => 0,
        'total' => 0
      )
    end

    it 'nao transforma indisponibilidade em zero' do
      get '/api/v1/company_dashboard/analytics/overview',
          params: { from: selected_day.iso8601, to: selected_day.iso8601 }

      expect(response).to have_http_status(:ok)
      expect(json_body).to include(
        'views' => nil,
        'cta_clicks' => nil,
        'quote_clicks' => nil,
        'leads' => nil,
        'conversion_rate' => nil,
        'data_status' => 'unavailable'
      )
      expect(json_body['cta_breakdown']).to be_nil
    end

    it 'retorna engagement pronto com payload normalizado' do
      company.update!(
        ga4_property_id: '123456789',
        ga4_last_sync: 2.hours.ago,
        engagement_metrics: {
          avg_time_on_page: 143,
          bounce_rate: 38.2,
          pages_per_session: 2.7,
          engagement_rate: 61.8
        }
      )

      get '/api/v1/company_dashboard/analytics/overview'

      expect(response).to have_http_status(:ok)
      expect(json_body['engagement_status']).to eq('ready')
      expect(json_body['engagement']).to include(
        'avg_time_on_page_seconds' => 143,
        'bounce_rate_percent' => 38.2,
        'pages_per_session' => 2.7,
        'engagement_rate_percent' => 61.8,
        'source' => 'ga4'
      )
      expect(json_body['engagement']['last_synced_at']).to be_present
    end

    it 'retorna engagement indisponivel quando GA4 ainda nao sincronizou' do
      company.update!(ga4_property_id: '123456789', ga4_last_sync: nil, engagement_metrics: nil)

      get '/api/v1/company_dashboard/analytics/overview'

      expect(response).to have_http_status(:ok)
      expect(json_body['engagement_status']).to eq('unavailable')
      expect(json_body['engagement']).to be_nil
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/timeseries' do
    it 'usa o mesmo from/to e inclui quote no payload' do
      create(
        :analytics_event,
        company: company,
        event_type: 'profile_view',
        tracked_at: selected_day.change(hour: 9),
        metadata: { source: 'spec' },
        event_id: 'evt-remediation-timeseries-view'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: selected_day.change(hour: 10),
        metadata: { source: 'spec', cta_type: 'quote' },
        event_id: 'evt-remediation-timeseries-quote'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'profile_view',
        tracked_at: 20.days.ago,
        metadata: { source: 'spec' },
        event_id: 'evt-remediation-timeseries-outside'
      )

      get '/api/v1/company_dashboard/analytics/timeseries',
          params: { from: selected_day.iso8601, to: selected_day.iso8601 }

      expect(response).to have_http_status(:ok)
      expect(json_body['range']).to eq('from' => selected_day.iso8601, 'to' => selected_day.iso8601)
      expect(json_body['data']).to eq([
        {
          'date' => selected_day.iso8601,
          'views' => 1,
          'clicks' => 1,
          'whatsapp' => 0,
          'email' => 0,
          'phone' => 0,
          'website' => 0,
          'quote' => 1,
          'leads' => 0
        }
      ])
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/top_campaigns' do
    it 'respeita o range real em vez de totais acumulados' do
      create(
        :analytics_event,
        company: company,
        event_type: 'profile_view',
        tracked_at: selected_day.change(hour: 9),
        metadata: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'campanha-recente' },
        event_id: 'evt-remediation-campaign-view'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'cta_click',
        tracked_at: selected_day.change(hour: 10),
        metadata: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'campanha-recente', cta_type: 'quote' },
        event_id: 'evt-remediation-campaign-cta'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'lead_created',
        tracked_at: selected_day.change(hour: 11),
        metadata: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'campanha-recente' },
        event_id: 'evt-remediation-campaign-lead'
      )
      create(
        :analytics_event,
        company: company,
        event_type: 'lead_created',
        tracked_at: 40.days.ago,
        metadata: { utm_source: 'facebook', utm_medium: 'paid-social', utm_campaign: 'campanha-antiga' },
        event_id: 'evt-remediation-campaign-outside'
      )

      get '/api/v1/company_dashboard/analytics/top_campaigns',
          params: { from: selected_day.iso8601, to: selected_day.iso8601, limit: 5 }

      expect(response).to have_http_status(:ok)
      expect(json_body['data_source']).to eq('analytics_events')
      expect(json_body['range']).to eq('from' => selected_day.iso8601, 'to' => selected_day.iso8601)
      expect(json_body['campaigns'].size).to eq(1)
      expect(json_body['campaigns'].first).to include(
        'utm_campaign' => 'campanha-recente',
        'utm_source' => 'google',
        'utm_medium' => 'cpc',
        'total_visits' => 1,
        'total_cta_clicks' => 1,
        'total_leads' => 1,
        'conversion_rate' => 100.0
      )
    end
  end
end

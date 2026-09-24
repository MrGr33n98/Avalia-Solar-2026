# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/company_dashboard/analytics/tracking_workspace', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company:) }

  before do
    create(:company_member, company:, user:, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  it 'mantém a mensuração core acessível sem entitlement avançado' do
    allow(EntitlementService).to receive(:explain).and_return(allowed: false)

    get '/api/v1/company_dashboard/analytics/tracking_workspace', params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload).to include('status', 'health', 'diagnostics', 'capabilities')
    expect(payload['capabilities']).to include('core' => true, 'advanced' => false)
    expect(payload['data_source']).to eq('analytics_events')
  end

  it 'entrega detalhamento avançado e respeita first touch' do
    allow(EntitlementService).to receive(:explain).and_return(allowed: true)
    AnalyticsEvent.create!(company:, event_type: 'profile_view', tracked_at: 1.day.ago,
                           metadata: { session_id: 'session-a', utm_source: 'google', utm_medium: 'cpc' })

    get '/api/v1/company_dashboard/analytics/tracking_workspace',
        params: { company_id: company.id, attribution_model: 'first_touch' }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['is_premium_analytics']).to be(true)
    expect(payload['attribution_model']).to eq('first_touch')
    expect(payload['capabilities']).to include('advanced' => true, 'export' => true)
    expect(payload['diagnostics']).to have_key('utm_coverage_pct')
  end

  it 'mantém envelope completo quando a fonte fica indisponível' do
    allow(EntitlementService).to receive(:explain).and_return(allowed: true)
    allow(CompanyDashboard::TrackingWorkspaceService).to receive(:call).and_raise(StandardError, 'falha simulada')

    get '/api/v1/company_dashboard/analytics/tracking_workspace', params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['status']).to eq('unavailable')
    expect(payload['policy']).to include('outbound_source' => 'avaliasolar', 'ads_source' => 'avaliasolar_ads')
    expect(payload['error']['code']).to eq('TRACKING_WORKSPACE_UNAVAILABLE')
  end
end

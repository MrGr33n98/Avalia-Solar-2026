require 'rails_helper'

RSpec.describe 'Analytics conversions endpoint', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }

  before do
    AnalyticsEvent.create!(company_id: company.id, event_type: 'badge_cta_click',
                           metadata: { referrer: '/companies/1' }, tracked_at: 1.day.ago)
    AnalyticsEvent.create!(company_id: company.id, event_type: 'badge_cta_view', metadata: {}, tracked_at: Time.current)

    allow_any_instance_of(Api::V1::AnalyticsController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::AnalyticsController).to receive(:current_user).and_return(user)
  end

  it 'aggregates metrics by event_type' do
    get '/api/v1/analytics/conversions', params: { company_id: company.id, days: 7 }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['metrics']['badge_cta_click']).to eq(1)
    expect(body['metrics']['badge_cta_view']).to eq(1)
  end

  it 'uses canonical company_daily_stats for core conversion metrics' do
    CompanyDailyStat.create!(
      company: company,
      day: Date.current,
      profile_views: 50,
      cta_clicks: 10,
      whatsapp_clicks: 4,
      leads: 3,
      reviews: 1
    )
    AnalyticsEvent.create!(
      company_id: company.id,
      event_type: 'profile_view',
      metadata: {},
      tracked_at: Time.current
    )

    get '/api/v1/analytics/conversions', params: { company_id: company.id, days: 7 }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['data_source']).to eq('company_daily_stats+analytics_events')
    expect(body.dig('metrics', 'profile_view')).to eq(50)
    expect(body.dig('metrics', 'cta_click')).to eq(10)
    expect(body.dig('metrics', 'whatsapp_click')).to eq(4)
    expect(body.dig('metrics', 'lead_created')).to eq(3)
  end
end

require 'rails_helper'

RSpec.describe Analytics::AttributionQuery do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:from_time) { Time.zone.parse('2026-09-01 00:00:00') }
  let(:to_time) { Time.zone.parse('2026-09-10 23:59:59') }

  def event(company:, type:, at:, metadata: {})
    AnalyticsEvent.create!(company: company, event_type: type, tracked_at: at, metadata: metadata)
  end

  before do
    event(company: company, type: 'profile_view', at: from_time + 1.hour,
          metadata: { session_id: 'session-a', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'touch-a' })
    event(company: company, type: 'cta_click', at: from_time + 2.hours,
          metadata: { session_id: 'session-a', cta_type: 'whatsapp', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'touch-b' })
    event(company: company, type: 'lead_created', at: from_time + 3.hours,
          metadata: { session_id: 'session-a', lead_id: 'lead-a' })
    event(company: company, type: 'cta_click', at: from_time + 4.hours,
          metadata: { session_id: 'session-a', cta_type: 'email', utm_source: 'later', utm_medium: 'email', utm_campaign: 'touch-c' })
    event(company: other_company, type: 'profile_view', at: from_time + 1.hour,
          metadata: { session_id: 'session-b', utm_source: 'other-company', utm_campaign: 'other' })
  end

  it 'uses the first eligible touch deterministically' do
    result = described_class.call(company_id: company.id, from_time:, to_time:, attribution_model: 'first_touch')

    expect(result[:summary]).to include(visits: 1, cta_clicks: 2, leads: 1)
    expect(result[:channels].map { |row| row[:source] }).to include('google')
    expect(result[:channels].map { |row| row[:source] }).not_to include('other-company', 'later')
  end

  it 'uses the last touch before the conversion and excludes later touches' do
    result = described_class.call(company_id: company.id, from_time:, to_time:, attribution_model: 'last_touch')

    expect(result[:channels].map { |row| row[:source] }).to include('meta', 'later')
    expect(result[:channels].map { |row| row[:source] }).not_to include('other-company')
    expect(result[:summary][:ctr]).to eq(200.0)
    expect(result[:summary][:profile_to_lead_conversion]).to eq(100.0)
    expect(result[:summary][:cta_to_lead_rate]).to eq(50.0)
  end

  it 'returns nil rates when there is no denominator' do
    empty = described_class.call(company_id: company.id, from_time: from_time + 10.days, to_time: to_time + 10.days)

    expect(empty[:summary]).to include(visits: 0, ctr: nil, profile_to_lead_conversion: nil, cta_to_lead_rate: nil)
  end
end

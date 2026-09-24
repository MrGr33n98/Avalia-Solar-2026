# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::TrackingWorkspaceService, type: :service do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:from_time) { Time.zone.parse('2026-09-01 00:00:00') }
  let(:to_time) { Time.zone.parse('2026-09-10 23:59:59') }

  def event(company:, type:, at:, metadata: {})
    AnalyticsEvent.create!(company:, event_type: type, tracked_at: at, metadata: metadata)
  end

  it 'reaproveita eventos canônicos, mantém tenancy e expõe saúde sem métricas fictícias' do
    event(company:, type: 'profile_view', at: from_time + 1.hour,
          metadata: { session_id: 'session-a', utm_source: 'google', utm_medium: 'cpc' })
    event(company:, type: 'cta_click', at: from_time + 2.hours,
          metadata: { session_id: 'session-a', cta_type: 'whatsapp' })
    event(company:, type: 'lead_created', at: from_time + 3.hours,
          metadata: { session_id: 'session-a', lead_id: 'lead-a' })
    event(company:, type: 'legacy_event', at: from_time + 4.hours, metadata: {})
    event(company: other_company, type: 'profile_view', at: from_time + 1.hour,
          metadata: { utm_source: 'other-company' })

    result = described_class.call(company:, from_time:, to_time:, advanced: false, attribution_model: 'first_touch')

    expect(result[:status]).to eq('ready')
    expect(result[:attribution_model]).to eq('first_touch')
    expect(result[:summary]).to include(visits: 1, cta_clicks: 1, leads: 1)
    expect(result[:diagnostics][:event_count]).to eq(4)
    expect(result[:diagnostics][:canonical_event_count]).to eq(3)
    expect(result[:diagnostics][:acquisition_eligible_count]).to eq(3)
    expect(result[:diagnostics][:acquisition_excluded_count]).to eq(0)
    expect(result[:diagnostics][:unknown_event_count]).to eq(1)
    expect(result[:capabilities]).to include(core: true, advanced: false, saved_links: false)
    expect(result[:campaigns]).to eq([])
    expect(result[:health][:status]).to eq('attention')
  end

  it 'reporta eventos excluídos no diagnóstico sem expor dados internos no summary' do
    event(company:, type: 'profile_view', at: from_time + 1.hour,
          metadata: { session_id: 's-1', utm_source: 'google', utm_medium: 'cpc' })
    event(company:, type: 'profile_view', at: from_time + 2.hours,
          metadata: { session_id: 's-2', referrer: 'https://avaliasolar.com.br' })
    event(company:, type: 'profile_view', at: from_time + 3.hours,
          metadata: { session_id: 's-3', referrer: 'https://accounts.google.com/oauth' })

    result = described_class.call(company:, from_time:, to_time:, advanced: true)

    expect(result[:diagnostics][:raw_event_count]).to eq(3)
    expect(result[:diagnostics][:acquisition_eligible_count]).to eq(1)
    expect(result[:diagnostics][:acquisition_excluded_count]).to eq(2)
    reasons = result[:diagnostics][:excluded_breakdown].map { |b| b[:reason] }
    expect(reasons).to include('internal_referrer', 'system_auth')

    expect(result[:summary][:visits]).to eq(1)
  end

  it 'retorna estado vazio quando não há eventos da empresa' do
    result = described_class.call(company:, from_time:, to_time:, advanced: false)

    expect(result[:status]).to eq('empty')
    expect(result[:summary]).to be_nil
    expect(result[:health][:status]).to eq('not_configured')
    expect(result[:diagnostics][:event_count]).to eq(0)
  end
end

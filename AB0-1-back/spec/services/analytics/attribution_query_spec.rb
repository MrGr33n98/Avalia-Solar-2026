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
          metadata: { session_id: 'session-a', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'touch-a', landing_path: '/companies/weg' })
    event(company: company, type: 'cta_click', at: from_time + 2.hours,
          metadata: { session_id: 'session-a', cta_type: 'whatsapp', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'touch-b', landing_path: '/companies/weg' })
    event(company: company, type: 'lead_created', at: from_time + 3.hours,
          metadata: { session_id: 'session-a', lead_id: 'lead-a' })
    event(company: company, type: 'cta_click', at: from_time + 4.hours,
          metadata: { session_id: 'session-a', cta_type: 'email', utm_source: 'later', utm_medium: 'email', utm_campaign: 'touch-c', landing_path: '/companies/weg' })
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

  it 'correlaciona touch quando conversão carrega lead e session ids' do
    event(company: company, type: 'profile_view', at: from_time + 5.hours,
          metadata: { session_id: 'session-c', utm_source: 'newsletter', utm_medium: 'email', landing_path: '/companies/weg' })
    event(company: company, type: 'lead_created', at: from_time + 6.hours,
          metadata: { session_id: 'session-c', lead_id: 'lead-c' })

    result = described_class.call(company_id: company.id, from_time:, to_time:, attribution_model: 'first_touch')
    newsletter = result[:channels].find { |row| row[:source] == 'newsletter' }

    expect(newsletter[:leads]).to eq(1)
  end

  it 'exclui rotas não comerciais como /auth/callback e /logout de landing_pages' do
    event(company: company, type: 'profile_view', at: from_time + 7.hours,
          metadata: { session_id: 'session-auth', landing_path: '/auth/callback' })
    event(company: company, type: 'profile_view', at: from_time + 8.hours,
          metadata: { session_id: 'session-logout', landing_path: '/logout' })

    result = described_class.call(company_id: company.id, from_time:, to_time:)
    landing_paths = result[:landing_pages].map { |row| row[:landing_path] }

    expect(landing_paths).not_to include('/auth/callback', '/logout')
  end

  it 'preserva touch externo quando há navegação interna ou callback de auth posterior' do
    event(company: company, type: 'profile_view', at: from_time + 8.hours,
          metadata: { session_id: 'session-d', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'kw-solar', landing_path: '/companies/weg' })
    event(company: company, type: 'profile_view', at: from_time + 8.hours + 5.minutes,
          metadata: { session_id: 'session-d', referrer_host: 'accounts.google.com', landing_path: '/auth/callback' })
    event(company: company, type: 'lead_created', at: from_time + 9.hours,
          metadata: { session_id: 'session-d', lead_id: 'lead-d' })

    result = described_class.call(company_id: company.id, from_time:, to_time:, attribution_model: 'last_touch')
    google_cpc = result[:campaigns].find { |c| c[:campaign] == 'kw-solar' }

    expect(google_cpc).not_to be_nil
    expect(google_cpc[:leads]).to eq(1)
  end

  it 'returns nil rates when there is no denominator' do
    empty = described_class.call(company_id: company.id, from_time: from_time + 10.days, to_time: to_time + 10.days)

    expect(empty[:summary]).to include(visits: 0, ctr: nil, profile_to_lead_conversion: nil, cta_to_lead_rate: nil)
  end

  it 'filtra estritamente o fixture canônico: 25 raw -> 15 aquisição elegível (12 ChatGPT + 3 Google)' do
    fixture_company = create(:company)
    f_start = from_time + 1.day

    # 12 ChatGPT
    12.times do |i|
      event(company: fixture_company, type: 'profile_view', at: f_start + i.minutes,
            metadata: { session_id: "s-chatgpt-#{i}", referrer: 'https://chatgpt.com', landing_path: '/companies/solar' })
    end

    # 6 Avalia Solar interno
    6.times do |i|
      event(company: fixture_company, type: 'profile_view', at: f_start + 20.minutes + i.minutes,
            metadata: { session_id: "s-internal-#{i}", referrer: 'https://avaliasolar.com.br', landing_path: '/companies/solar' })
    end

    # 3 Google Organic
    3.times do |i|
      event(company: fixture_company, type: 'profile_view', at: f_start + 30.minutes + i.minutes,
            metadata: { session_id: "s-google-#{i}", referrer: 'https://www.google.com/search?q=solar', landing_path: '/companies/solar' })
    end

    # 3 CRM interno
    3.times do |i|
      event(company: fixture_company, type: 'profile_view', at: f_start + 40.minutes + i.minutes,
            metadata: { session_id: "s-crm-#{i}", referrer: 'https://crm.avaliasolar.com.br', landing_path: '/companies/solar' })
    end

    # 1 Google Accounts/Auth
    event(company: fixture_company, type: 'profile_view', at: f_start + 50.minutes,
          metadata: { session_id: 's-auth-1', referrer: 'https://accounts.google.com/o/oauth2/auth', landing_path: '/auth/callback' })

    result = described_class.call(company_id: fixture_company.id, from_time: f_start, to_time: f_start + 2.hours)

    expect(result[:summary][:visits]).to eq(15)
    channel_groups = result[:channels].map { |c| c[:channel_group] }
    expect(channel_groups).not_to include('Internal', 'System/Auth')
    expect(channel_groups).to contain_exactly('AI Referral', 'Organic Search')

    chatgpt_channel = result[:channels].find { |c| c[:channel_group] == 'AI Referral' }
    expect(chatgpt_channel[:visits]).to eq(12)
    expect(chatgpt_channel[:acquisition_share_pct]).to eq(80.0)

    google_channel = result[:channels].find { |c| c[:channel_group] == 'Organic Search' }
    expect(google_channel[:visits]).to eq(3)
    expect(google_channel[:acquisition_share_pct]).to eq(20.0)
  end
end

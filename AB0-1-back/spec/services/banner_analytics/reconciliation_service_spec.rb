# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerAnalytics::ReconciliationService do
  let(:day) { Date.new(2026, 8, 9) }

  it 'detecta divergencia entre eventos reportaveis e agregado diario' do
    banner = create(:banner, :approved, active: true)
    create(:banner_daily_stat, banner: banner, day: day, views_count: 1, clicks_count: 1, leads_count: 0)
    create(:banner_event, banner: banner, event_type: 'impression', tracked_at: day.noon, valid_for_reporting: true)
    create(:banner_event, banner: banner, event_type: 'click', tracked_at: day.noon, valid_for_reporting: true)
    create(:banner_event, banner: banner, event_type: 'click', tracked_at: day.noon, valid_for_reporting: true)

    result = described_class.call(date: day)

    expect(result[:summary]['divergent']).to eq(1)
    expect(result[:results].first.dig(:metrics, :clicks_count, :delta)).to eq(1)
  end

  it 'ignora eventos nao reportaveis e aceita agregado consistente' do
    banner = create(:banner, :approved, active: true)
    create(:banner_daily_stat, banner: banner, day: day, views_count: 1, clicks_count: 0, leads_count: 0)
    create(:banner_event, banner: banner, event_type: 'view', tracked_at: day.noon, valid_for_reporting: true)
    create(:banner_event, banner: banner, event_type: 'click', tracked_at: day.noon, valid_for_reporting: false)

    result = described_class.call(date: day)

    expect(result[:summary]['consistent']).to eq(1)
  end
end

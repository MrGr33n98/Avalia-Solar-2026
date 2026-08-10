# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerAnalytics::OperationalHealth do
  let(:banner) { create(:banner, :approved, active: true) }

  it 'retorna unknown quando nao existe agregado' do
    result = described_class.call(banner_ids: [banner.id])

    expect(result[:status]).to eq('unknown')
    expect(result[:lag_minutes]).to be_nil
  end

  it 'retorna stale quando o agregado ultrapassa a janela operacional' do
    stat = create(:banner_daily_stat, banner: banner, day: Date.yesterday)
    stat.update_columns(updated_at: 48.hours.ago)

    result = described_class.call(banner_ids: [banner.id])

    expect(result[:status]).to eq('stale')
    expect(result[:lag_minutes]).to be >= 48 * 60
    expect(result[:quality_history].length).to eq(7)
    expect(result[:quality_history].all? { |day| day.key?(:discard_rate) }).to be(true)
  end

  it 'retorna degraded quando a taxa de descarte excede vinte por cento' do
    create(:banner_daily_stat, banner: banner, day: Date.yesterday, updated_at: 1.hour.ago)
    create_list(:banner_event, 4, banner: banner, event_type: 'view', valid_for_reporting: true, tracked_at: 1.hour.ago)
    create(:banner_event, banner: banner, event_type: 'view', valid_for_reporting: false, tracked_at: 1.hour.ago)

    result = described_class.call(banner_ids: [banner.id])

    expect(result[:status]).to eq('degraded')
    expect(result[:discarded_events_24h]).to eq(1)
    expect(result[:discard_rate_24h]).to eq(20.0)
    expect(result[:discard_reasons_24h]).to eq('unknown' => 1)
  end
end

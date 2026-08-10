require 'rails_helper'

RSpec.describe BannerAnalytics::PerformanceService do
  let(:banner) { create(:banner) }
  let(:start_date) { 5.days.ago.to_date }
  let(:end_date) { Date.today }

  before do
    # Create daily stats
    create(:banner_daily_stat, banner: banner, day: 2.days.ago.to_date, views_count: 1000, clicks_count: 50, leads_count: 5)
    create(:banner_daily_stat, banner: banner, day: 1.day.ago.to_date, views_count: 1000, clicks_count: 50, leads_count: 5)
    # Total: 2000 views, 100 clicks, 10 leads

    # Create subscription
    addon = create(:banner_addon, price_cents: 10000) # $100.00
    create(:banner_addon_subscription, 
           banner: banner, 
           banner_addon: addon,
           price_cents: 10000,
           starts_at: 4.days.ago,
           ends_at: 1.day.ago,
           status: 'expired')
  end

  describe '.call' do
    it 'returns reportable breakdown by placement' do
      create(:banner_event, banner: banner, event_type: 'impression', placement: 'sidebar', tracked_at: 1.day.ago)
      create(:banner_event, banner: banner, event_type: 'click', placement: 'sidebar', tracked_at: 1.day.ago)
      create(:banner_event, banner: banner, event_type: 'lead', placement: 'sidebar', tracked_at: 1.day.ago)
      create(:banner_event, banner: banner, event_type: 'impression', placement: 'home_top', tracked_at: 1.day.ago,
             valid_for_reporting: false)

      result = described_class.call(banner.id, start_date: start_date, end_date: end_date)

      expect(result[:breakdown]).to include(
        include(placement: 'sidebar', impressions: 1, clicks: 1, leads: 1, ctr: 100.0)
      )
      expect(result[:breakdown].map { |row| row[:placement] }).not_to include('home_top')
      expect(result[:context_breakdown]).to be_an(Array)
    end

    it 'returns correctly aggregated metrics' do
      result = described_class.call(banner.id, start_date: start_date, end_date: end_date)
      
      expect(result[:metrics][:impressions]).to eq(2000)
      expect(result[:metrics][:clicks]).to eq(100)
      expect(result[:metrics][:leads]).to eq(10)
      
      # CTR: 100/2000 = 5%
      expect(result[:metrics][:ctr]).to eq(5.0)
      
      # Conversion rate: 10/100 = 10%
      expect(result[:metrics][:conversion_rate]).to eq(10.0)
      
      # Investment: subscription was 4 days total. 
      # The overlap with start_date..end_date is 4.days.ago to 1.day.ago (which is 4 days).
      # Proportion = 4 / 4 = 1. Investment = $100.
      expect(result[:metrics][:investment]).to eq(100.0)
      
      # CPC: $100 / 100 clicks = $1.00
      expect(result[:metrics][:cpc]).to eq(1.0)
      
      # CPL: $100 / 10 leads = $10.00
      expect(result[:metrics][:cpl]).to eq(10.0)
      expect(result[:quality]).to include(total_events: 0, reportable_events: 0, discarded_events: 0)
    end
  end
end

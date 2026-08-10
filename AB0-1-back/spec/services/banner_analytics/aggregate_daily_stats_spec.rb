require 'rails_helper'

RSpec.describe BannerAnalytics::AggregateDailyStats do
  let(:banner) { create(:banner) }
  let(:date) { Date.new(2026, 8, 9) }

  describe '.aggregate_for_date' do
    before do
      # Create events for the banner on the specific date
      create(:banner_event, banner: banner, event_type: 'impression', tracked_at: date.midday)
      create(:banner_event, banner: banner, event_type: 'view', tracked_at: date.midday)
      create(:banner_event, banner: banner, event_type: 'click', tracked_at: date.midday)
      create(:banner_event, banner: banner, event_type: 'click', tracked_at: date.midday)
      create(:banner_event, banner: banner, event_type: 'lead', tracked_at: date.midday)
    end

    it 'aggregates views, clicks, and leads correctly' do
      described_class.aggregate_for_date(date)

      stat = BannerDailyStat.find_by(banner_id: banner.id, day: date)
      expect(stat).to be_present
      expect(stat.views_count).to eq(2) # 1 impression + 1 view
      expect(stat.clicks_count).to eq(2)
      expect(stat.leads_count).to eq(1)
      expect(stat.ctr).to eq(100.0) # 2 clicks / 2 views * 100
    end

    it 'excludes non-reportable events from commercial metrics' do
      create(:banner_event, banner: banner, event_type: 'impression', tracked_at: date.midday,
             valid_for_reporting: false, discard_reason: 'bot_user_agent')

      described_class.aggregate_for_date(date)

      stat = BannerDailyStat.find_by(banner_id: banner.id, day: date)
      expect(stat.views_count).to eq(2)
    end

    it 'is idempotent and updates if stats change' do
      described_class.aggregate_for_date(date)
      
      # Add another impression
      create(:banner_event, banner: banner, event_type: 'impression', tracked_at: date.midday)
      
      described_class.aggregate_for_date(date)
      
      stat = BannerDailyStat.find_by(banner_id: banner.id, day: date)
      expect(stat.views_count).to eq(3)
      expect(stat.clicks_count).to eq(2)
      expect(stat.leads_count).to eq(1)
      expect(stat.ctr).to be_within(0.1).of(66.67) # 2/3
      expect(BannerDailyStat.count).to eq(1) # Did not duplicate row
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewDashboard::ActivityService do
  let(:user) { create(:user) }
  let(:company1) { create(:company) }
  let(:company2) { create(:company) }
  let!(:review1) { create(:review, user: user, company: company1) }
  let!(:review2) { create(:review, user: user, company: company2) }

  describe '#activity_chart_data' do
    let(:start_date) { 7.days.ago }
    let(:end_date) { Time.current }

    context 'with analytics events' do
      before do
        # Create analytics events for the companies user reviewed
        3.times { create(:analytics_event, event_type: 'profile_view', company: company1, created_at: 2.days.ago) }
        2.times { create(:analytics_event, event_type: 'profile_view', company: company2, created_at: 2.days.ago) }
        1.times { create(:analytics_event, event_type: 'whatsapp_click', company: company1, created_at: 2.days.ago) }
        2.times { create(:analytics_event, event_type: 'cta_click', company: company1, created_at: 3.days.ago) }
      end

      it 'returns daily aggregated data' do
        service = described_class.new(user: user)
        result = service.activity_chart_data(start_date: start_date, end_date: end_date)

        expect(result).to be_an(Array)
        expect(result.length).to eq(8) # 7 days + today
        expect(result.first).to include(:date, :profile_views, :whatsapp_clicks, :cta_clicks)
      end

      it 'correctly aggregates profile_views' do
        service = described_class.new(user: user)
        result = service.activity_chart_data(start_date: start_date, end_date: end_date)

        day_with_views = result.find { |d| d[:profile_views] > 0 }
        expect(day_with_views[:profile_views]).to eq(5) # 3 + 2
      end

      it 'correctly aggregates whatsapp_clicks' do
        service = described_class.new(user: user)
        result = service.activity_chart_data(start_date: start_date, end_date: end_date)

        day_with_clicks = result.find { |d| d[:whatsapp_clicks] > 0 }
        expect(day_with_clicks[:whatsapp_clicks]).to eq(1)
      end

      it 'returns zeros for days without events' do
        service = described_class.new(user: user)
        result = service.activity_chart_data(start_date: start_date, end_date: end_date)

        empty_days = result.select { |d| d[:profile_views] == 0 && d[:whatsapp_clicks] == 0 && d[:cta_clicks] == 0 }
        expect(empty_days.length).to be > 0
      end
    end

    context 'with no reviews' do
      let(:user_no_reviews) { create(:user) }

      it 'returns empty data' do
        service = described_class.new(user: user_no_reviews)
        result = service.activity_chart_data(start_date: start_date, end_date: end_date)

        expect(result).to be_an(Array)
        expect(result.all? { |d| d[:profile_views] == 0 && d[:whatsapp_clicks] == 0 && d[:cta_clicks] == 0 }).to be true
      end
    end

    context 'with date range' do
      it 'respects custom date range' do
        service = described_class.new(user: user)
        result = service.activity_chart_data(start_date: 3.days.ago, end_date: 1.day.ago)

        expect(result.length).to eq(3)
      end
    end
  end
end

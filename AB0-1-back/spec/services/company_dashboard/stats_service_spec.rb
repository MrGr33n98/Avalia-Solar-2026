require 'rails_helper'

RSpec.describe CompanyDashboard::StatsService do
  let(:company) { create(:company, profile_views_count: 100) }

  subject { described_class.new(company).call }

  context 'when company has no data' do
    it 'returns zeroed stats' do
      expect(subject[:profile_views]).to eq(100)
      expect(subject[:leads_received]).to eq(0)
      expect(subject[:conversion_rate]).to eq(0)
    end
  end

  context 'when company has leads' do
    before do
      create_list(:lead, 10, company: company)
    end

    it 'calculates conversion rate correctly' do
      # 10 leads / 100 views = 10%
      expect(subject[:leads_received]).to eq(10)
      expect(subject[:conversion_rate]).to eq(10.0)
    end
  end

  context 'when company_daily_stats has aggregated telemetry' do
    before do
      CompanyDailyStat.create!(
        company: company,
        day: Date.current - 1,
        profile_views: 350,
        cta_clicks: 40,
        whatsapp_clicks: 12,
        leads: 8,
        reviews: 1
      )
      create_list(:lead, 7, company: company)
    end

    it 'prioritizes aggregated telemetry metrics over denormalized counters' do
      expect(subject[:profile_views]).to eq(350)
      expect(subject[:cta_clicks]).to eq(40)
      expect(subject[:whatsapp_clicks]).to eq(12)
      expect(subject[:leads_received]).to eq(7)
      expect(subject[:conversion_rate]).to eq(2.0)
    end
  end

  context 'when company is nil' do
    subject { described_class.new(nil).call }

    it 'returns safe default values' do
      expect(subject[:profile_views]).to eq(0)
      expect(subject[:conversion_rate]).to eq(0)
    end
  end
end

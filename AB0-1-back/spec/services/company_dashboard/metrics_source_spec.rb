require 'rails_helper'

RSpec.describe CompanyDashboard::MetricsSource do
  let(:company) { create(:company) }
  let(:source) { described_class.new(company_id: company.id) }

  describe '#totals' do
    it 'returns aggregated totals for a date range' do
      CompanyDailyStat.create!(
        company: company,
        day: Date.current - 2,
        profile_views: 20,
        cta_clicks: 5,
        whatsapp_clicks: 2,
        leads: 1,
        reviews: 0
      )
      CompanyDailyStat.create!(
        company: company,
        day: Date.current - 1,
        profile_views: 30,
        cta_clicks: 8,
        whatsapp_clicks: 3,
        leads: 2,
        reviews: 0
      )

      totals = source.totals(from_day: (Date.current - 2), to_day: (Date.current - 1))

      expect(totals).to include(
        profile_views: 50,
        cta_clicks: 13,
        whatsapp_clicks: 5,
        leads: 3
      )
    end
  end

  describe '#timeseries' do
    it 'returns ordered daily metrics payload' do
      CompanyDailyStat.create!(
        company: company,
        day: Date.current - 1,
        profile_views: 11,
        cta_clicks: 4,
        whatsapp_clicks: 1,
        leads: 1,
        reviews: 0
      )

      data = source.timeseries(days: 7)

      expect(data).not_to be_empty
      expect(data.last[:date]).to eq(Date.current - 1)
      expect(data.last[:profile_views]).to eq(11)
      expect(data.last[:cta_clicks]).to eq(4)
      expect(data.last[:whatsapp_clicks]).to eq(1)
      expect(data.last[:leads]).to eq(1)
    end
  end

  describe '#available?' do
    it 'returns false when company_id is missing' do
      expect(described_class.new(company_id: nil).available?).to eq(false)
    end
  end
end

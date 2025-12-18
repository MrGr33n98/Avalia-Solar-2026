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

  context 'when company is nil' do
    subject { described_class.new(nil).call }

    it 'returns safe default values' do
      expect(subject[:profile_views]).to eq(0)
      expect(subject[:conversion_rate]).to eq(0)
    end
  end
end

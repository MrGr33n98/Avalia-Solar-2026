require 'rails_helper'

RSpec.describe CompanyUtmAttribution, type: :model do
  let(:company) { create(:company) }
  
  describe 'validations' do
    it { should validate_presence_of(:utm_source) }
    it { should validate_presence_of(:utm_campaign) }
  end

  describe '.increment_visit!' do
    it 'is atomic and increments total_visits' do
      CompanyUtmAttribution.increment_visit!(company.id, 'google', 'cpc', 'solar2024')
      CompanyUtmAttribution.increment_visit!(company.id, 'google', 'cpc', 'solar2024')
      
      record = CompanyUtmAttribution.find_by(company_id: company.id, utm_source: 'google', utm_campaign: 'solar2024')
      expect(record.total_visits).to eq(2)
    end
  end

  describe 'scopes' do
    it 'returns top campaigns by conversion rate' do
      create(:company_utm_attribution, company: company, utm_campaign: 'low', conversion_rate: 5.0)
      create(:company_utm_attribution, company: company, utm_campaign: 'high', conversion_rate: 25.0)
      
      results = CompanyUtmAttribution.where(company_id: company.id).by_conversion_rate
      expect(results.first.utm_campaign).to eq('high')
    end
  end
end

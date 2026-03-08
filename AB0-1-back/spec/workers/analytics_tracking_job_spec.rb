require 'rails_helper'

RSpec.describe AnalyticsTrackingJob, type: :worker do
  let(:company) { create(:company) }
  let(:properties) { { 'company_id' => company.id, 'utm_source' => 'google' } }
  let(:context) { { 'session_id' => '123' } }

  describe '#perform' do
    it 'tracks event and increments daily stats' do
      expect {
        subject.perform('Company Profile Viewed', company.id, properties, context)
      }.to change { CompanyDailyStat.count }.by(1)

      stat = CompanyDailyStat.find_by(company: company, date: Date.current)
      expect(stat.profile_views).to eq(1)
    end

    it 'increments UTM attribution' do
      expect {
        subject.perform('Company Profile Viewed', company.id, properties, context)
      }.to change { CompanyUtmAttribution.count }.by(1)

      utm = CompanyUtmAttribution.find_by(company: company, utm_source: 'google')
      expect(utm.total_visits).to eq(1)
    end

    it 'handles CTA clicks correctly' do
      subject.perform('WhatsApp CTA Clicked', company.id, properties.merge('cta_type' => 'whatsapp'), context)
      
      stat = CompanyDailyStat.find_by(company: company, date: Date.current)
      expect(stat.whatsapp_clicks).to eq(1)
      expect(stat.cta_clicks).to eq(1)
    end
  end
end

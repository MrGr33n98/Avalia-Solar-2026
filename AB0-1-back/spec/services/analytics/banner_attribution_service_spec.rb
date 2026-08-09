require 'rails_helper'

RSpec.describe Analytics::BannerAttributionService do
  let(:company) { create(:company) }
  let(:banner) { create(:banner, company: company) }

  describe '.call' do
    context 'when lead has valid banner utm' do
      let(:lead) do
        create(:lead, 
               utm_source: 'avaliasolar_ads', 
               utm_campaign: "banner_#{banner.id}",
               utm_medium: 'cpc',
               company: company,
               wizard_status: 'pending_otp')
      end

      it 'creates a lead BannerEvent' do
        expect {
          described_class.call(lead)
        }.to change(BannerEvent, :count).by(1)

        event = BannerEvent.last
        expect(event.event_type).to eq('lead')
        expect(event.banner_id).to eq(banner.id)
        expect(event.company_id).to eq(company.id)
        expect(event.utm_source).to eq('avaliasolar_ads')
        expect(event.utm_campaign).to eq("banner_#{banner.id}")
        expect(event.metadata_json['lead_id']).to eq(lead.id)
        expect(event.metadata_json['status']).to eq('pending_otp')
      end
    end

    context 'when lead has no utm_source avaliasolar_ads' do
      let(:lead) { create(:lead, utm_source: 'google', utm_campaign: "banner_#{banner.id}") }

      it 'does not create a BannerEvent' do
        expect { described_class.call(lead) }.not_to change(BannerEvent, :count)
      end
    end

    context 'when lead has invalid banner format' do
      let(:lead) { create(:lead, utm_source: 'avaliasolar_ads', utm_campaign: "invalid") }

      it 'does not create a BannerEvent' do
        expect { described_class.call(lead) }.not_to change(BannerEvent, :count)
      end
    end
  end
end

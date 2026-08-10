# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Atribuição de lead por banner', type: :request do
  let(:company) { create(:company) }
  let(:banner) { create(:banner, company: company) }

  it 'cria evento de lead quando UTM do banner chega no endpoint público' do
    post '/api/v1/leads', params: {
      lead: {
        name: 'Lead Banner',
        email: "lead-banner-#{banner.id}@example.com",
        phone: '11999999999',
        message: 'Quero orçamento',
        company_id: company.id
      },
      utm: {
        utm_source: 'avaliasolar_ads',
        utm_medium: 'banner',
        utm_campaign: "banner_#{banner.id}",
        utm_content: banner.position
      }
    }

    expect(response).to have_http_status(:created)
    lead = Lead.find_by(email: "lead-banner-#{banner.id}@example.com")
    expect(lead).to be_present
    expect(lead.utm_source).to eq('avaliasolar_ads')
    expect(lead.utm_campaign).to eq("banner_#{banner.id}")
    expect(BannerEvent.where(banner: banner, event_type: 'lead').where("metadata_json ->> 'lead_id' = ?", lead.id.to_s)).to exist
  end
end

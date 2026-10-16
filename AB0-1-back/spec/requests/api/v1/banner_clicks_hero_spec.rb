require 'rails_helper'

RSpec.describe 'Api::V1::BannerClicksController Hero', type: :request do
  let(:banner) do
    b = Banner.new(
      title: 'Hero Campanha 2026',
      headline: 'Economia Solar Garantida',
      cta_label: 'Ver Empresas',
      cta_href: '/companies/solar-brasil',
      link: 'https://avaliasolar.com.br/default',
      position: 'home_hero',
      banner_type: 'rectangular_large',
      active: true,
      moderation_status: 'approved',
      width: 1920,
      height: 420
    )
    b.image.attach(
      io: StringIO.new("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"),
      filename: 'hero_test.png',
      content_type: 'image/png'
    )
    b.save!
    b
  end

  it 'redirects to cta_href when present and records banner event' do
    expect do
      get "/api/v1/banner_clicks/#{banner.id}?delivery_id=del_123"
    end.to change(BannerEvent, :count).by(1)

    expect(response).to redirect_to('/companies/solar-brasil')
    event = BannerEvent.last
    expect(event.banner_id).to eq(banner.id)
    expect(event.event_type).to eq('click')
    expect(event.delivery_id).to eq('del_123') if event.respond_to?(:delivery_id)
  end

  it 'deduplicates rapid clicks with the same click_instance_id' do
    click_id = 'unique-click-uuid'

    expect do
      get "/api/v1/banner_clicks/#{banner.id}?click_instance_id=#{click_id}"
      get "/api/v1/banner_clicks/#{banner.id}?click_instance_id=#{click_id}"
    end.to change(BannerEvent, :count).by(1)

    expect(response).to redirect_to('/companies/solar-brasil')
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::BannerClicks', type: :request do
  describe 'GET /api/v1/banner_clicks/:id' do
    it 'records click and redirects to safe destination' do
      banner = create(:banner, :approved, active: true, link: 'https://example.com/offer')

      get "/api/v1/banner_clicks/#{banner.id}", headers: { 'User-Agent' => 'Mozilla/5.0' }

      expect(response).to have_http_status(:found)
      expect(response).to redirect_to(a_string_including('https://example.com/offer?utm_source=avaliasolar_ads&utm_medium=banner&utm_campaign=banner_'))
      event = BannerEvent.find_by(banner: banner, event_type: 'click')
      expect(event).to be_present
      expect(event.metadata_json['source']).to eq('banner_redirect')
    end

    it 'is idempotent when the same click instance is retried' do
      banner = create(:banner, :approved, active: true, link: 'https://example.com/offer')

      2.times do
        get "/api/v1/banner_clicks/#{banner.id}?click_instance_id=click-123"
      end

      expect(response).to have_http_status(:found)
      expect(BannerEvent.where(banner: banner, event_type: 'click').count).to eq(1)
      expect(BannerEvent.find_by(banner: banner, event_type: 'click').click_instance_id).to eq('click-123')
    end

    it 'does not redirect to unsafe destination' do
      banner = create(:banner, :approved, active: true, link: 'javascript:alert(1)')

      get "/api/v1/banner_clicks/#{banner.id}"

      expect(response).to have_http_status(:found)
      expect(response).to redirect_to('/')
      expect(BannerEvent.where(banner: banner, event_type: 'click')).to be_empty
    end
  end
end

require 'rails_helper'

RSpec.describe 'Banners category targeting', type: :request do
  let!(:category_a) { create(:category) }
  let!(:category_b) { create(:category) }

  let!(:global_banner) { create(:banner, position: 'categories_top') }

  let!(:banner_a) do
    create(:banner, position: 'categories_top').tap do |banner|
      banner.categories << category_a
      banner.save!
    end
  end

  let!(:banner_b) do
    create(:banner, position: 'categories_top').tap do |banner|
      banner.categories << category_b
      banner.save!
    end
  end

  describe 'GET /api/v1/categories/:id/banners' do
    it 'returns global + targeted banners for the category' do
      get "/api/v1/categories/#{category_a.id}/banners"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body.map { |b| b['id'] }

      expect(ids).to include(global_banner.id, banner_a.id)
      expect(ids).not_to include(banner_b.id)

      payload = body.find { |b| b['id'] == banner_a.id }
      expect(payload['width']).to be_present
      expect(payload['height']).to be_present
      expect(payload['category_ids']).to include(category_a.id)
    end
  end

  describe 'GET /api/v1/banners' do
    it 'filters by category_id and keeps global banners' do
      get '/api/v1/banners', params: { position: 'categories_top', category_id: category_b.id }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body.map { |b| b['id'] }

      expect(ids).to include(global_banner.id, banner_b.id)
      expect(ids).not_to include(banner_a.id)
    end
  end
end


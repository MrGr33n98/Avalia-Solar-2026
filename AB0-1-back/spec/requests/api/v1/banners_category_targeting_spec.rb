require 'rails_helper'

RSpec.describe 'Banners category targeting', type: :request do
  let!(:category_a) { create(:category) }
  let!(:category_b) { create(:category) }

  let!(:global_banner) { create(:banner, :approved, active: true, position: 'categories_top') }

  let!(:banner_a) do
    create(:banner, :approved, active: true, position: 'categories_top').tap do |banner|
      banner.categories << category_a
      banner.save!
    end
  end

  let!(:banner_b) do
    create(:banner, :approved, active: true, position: 'categories_top').tap do |banner|
      banner.categories << category_b
      banner.save!
    end
  end

  let!(:right_rail_banner) do
    create(:banner, :approved, active: true, position: 'categories_right_rail').tap do |banner|
      banner.categories << category_a
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

    it 'keeps cache entries separated by position' do
      Rails.cache.clear

      get "/api/v1/categories/#{category_a.id}/banners", params: { position: 'categories_top' }
      top_body = JSON.parse(response.body)

      get "/api/v1/categories/#{category_a.id}/banners", params: { position: 'categories_right_rail' }
      right_rail_body = JSON.parse(response.body)

      expect(top_body.map { |b| b['id'] }).to include(global_banner.id, banner_a.id)
      expect(top_body.map { |b| b['id'] }).not_to include(right_rail_banner.id)
      expect(right_rail_body.map { |b| b['id'] }).to include(right_rail_banner.id)
      expect(right_rail_body.map { |b| b['id'] }).not_to include(global_banner.id, banner_a.id)
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

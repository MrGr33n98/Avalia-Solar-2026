# frozen_string_literal: true

# RSpec Request Tests - BannersController Cache (Fase 1)
#
# Testa implementação de cache Redis no endpoint principal
# Valida:
# 1. Cache hit/miss
# 2. Geração de cache_key determinística
# 3. Serialização otimizada
# 4. Performance

require 'rails_helper'

RSpec.describe 'Api::V1::Banners', type: :request do
  describe 'GET /api/v1/banners' do
    let!(:active_banner) { create(:banner, :approved, active: true, position: 'navbar') }
    let!(:inactive_banner) { create(:banner, active: false) }

    context 'cache behavior (Fase 1)' do
      before { Rails.cache.clear }

      it 'caches the response' do
        # Primeira chamada: cache miss
        get '/api/v1/banners', params: { position: 'navbar' }
        expect(response).to have_http_status(:ok)

        # Verifica que cache foi criado
        cache_key = "banners/v1/#{Digest::MD5.hexdigest({ position: 'navbar' }.sort.to_h.to_json)}"
        expect(Rails.cache.exist?(cache_key)).to be true

        # Segunda chamada: cache hit
        get '/api/v1/banners', params: { position: 'navbar' }
        expect(response).to have_http_status(:ok)
      end

      it 'returns same data from cache' do
        get '/api/v1/banners', params: { position: 'navbar' }
        first_response = JSON.parse(response.body)

        get '/api/v1/banners', params: { position: 'navbar' }
        cached_response = JSON.parse(response.body)

        expect(cached_response).to eq(first_response)
      end
    end

    context 'filtering' do
      before { Rails.cache.clear }

      it 'filters by position' do
        create(:banner, :approved, active: true, position: 'sidebar')

        get '/api/v1/banners', params: { position: 'navbar' }

        json = JSON.parse(response.body)
        expect(json.all? { |b| b['position'] == 'navbar' }).to be true
      end

      it 'serves newly managed conversion positions' do
        right_rail = create(:banner, :approved, active: true, position: 'companies_right_rail')
        create(:banner, :approved, active: true, position: 'categories_right_rail')

        get '/api/v1/banners', params: { position: 'companies_right_rail' }

        json = JSON.parse(response.body)
        expect(json.map { |b| b['id'] }).to include(right_rail.id)
        expect(json.all? { |b| b['position'] == 'companies_right_rail' }).to be true
      end

      it 'limits results' do
        create_list(:banner, 5, :approved, active: true)

        get '/api/v1/banners', params: { limit: 2 }

        json = JSON.parse(response.body)
        expect(json.length).to eq(2)
      end
    end

    context 'ordering by priority (Fase 1)' do
      before { Rails.cache.clear }

      let!(:high_priority) { create(:banner, :approved, active: true, priority: 10, created_at: 3.days.ago) }
      let!(:low_priority) { create(:banner, :approved, active: true, priority: 100, created_at: 1.day.ago) }

      it 'orders by priority ascending' do
        get '/api/v1/banners'

        json = JSON.parse(response.body)
        expect(json.first['id']).to eq(high_priority.id)
      end
    end

    context 'error handling' do
      it 'returns empty array on error' do
        allow(Banner).to receive(:currently_active).and_raise(StandardError)

        get '/api/v1/banners'

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq([])
      end
    end
  end
end

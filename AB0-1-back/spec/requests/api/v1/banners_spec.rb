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
      let(:cache_store) { ActiveSupport::Cache::MemoryStore.new }

      before do
        allow(Rails).to receive(:cache).and_return(cache_store)
        allow(cache_store).to receive(:fetch).and_call_original
        cache_store.clear
      end

      it 'caches the response' do
        # Primeira chamada: cache miss
        get '/api/v1/banners', params: { position: 'navbar' }
        expect(response).to have_http_status(:ok)

        # Verifica que cache foi criado
        expect(cache_store).to have_received(:fetch).with(a_string_matching(%r{\Abanners/v2/}), expires_in: 5.minutes)

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

      it 'aplica frequency cap recebido pela API por audiencia' do
      banner = create(:banner, :approved, active: true, sponsored: false, position: 'navbar')
      create(:banner_event, banner: banner, event_type: 'impression', tracked_at: 1.hour.ago,
             metadata_json: { 'audience_key' => 'audience-api-1' }, valid_for_reporting: true)

      get '/api/v1/banners', params: { position: 'navbar', audience_key: 'audience-api-1' }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).map { |item| item['id'] }).not_to include(banner.id)
    end

    it 'isola cache entre audiences no frequency cap' do
      banner = create(:banner, :approved, active: true, sponsored: false, position: 'navbar')
      create(:banner_event, banner: banner, event_type: 'impression', tracked_at: 1.hour.ago,
             metadata_json: { 'audience_key' => 'audience-cache-a' }, valid_for_reporting: true)

      get '/api/v1/banners', params: { position: 'navbar', audience_key: 'audience-cache-a' }
      first_payload = JSON.parse(response.body)
      get '/api/v1/banners', params: { position: 'navbar', audience_key: 'audience-cache-b' }
      second_payload = JSON.parse(response.body)

      expect(first_payload.map { |item| item['id'] }).not_to include(banner.id)
      expect(second_payload.map { |item| item['id'] }).to include(banner.id)
    end

    it 'filters by position' do
        create(:banner, :approved, active: true, position: 'sidebar')

        get '/api/v1/banners', params: { position: 'navbar' }

        json = JSON.parse(response.body)
        expect(json.all? { |b| b['position'] == 'navbar' }).to be true
        expect(json.first['delivery_id']).to match(/\A[a-f0-9]{32}\z/)
      end

      it 'serves newly managed conversion positions' do
        right_rail = create(:banner, :approved, active: true, position: 'companies_right_rail')
        create(:banner, :approved, active: true, position: 'categories_right_rail')

        get '/api/v1/banners', params: { position: 'companies_right_rail' }

        json = JSON.parse(response.body)
        expect(json.map { |b| b['id'] }).to include(right_rail.id)
        expect(json.all? { |b| b['position'] == 'companies_right_rail' }).to be true
      end

      it 'serves the comparison floating bar sponsorship position' do
        recommendation = create(
          :banner,
          :approved,
          active: true,
          position: 'comparison_floating_bar',
          width: 720,
          height: 120
        )

        get '/api/v1/banners', params: { position: 'comparison_floating_bar' }

        json = JSON.parse(response.body)
        expect(json.map { |banner| banner['id'] }).to include(recommendation.id)
        expect(json.all? { |banner| banner['position'] == 'comparison_floating_bar' }).to be true
      end

      it 'serves the compare hero with accessible metadata' do
        hero = create(
          :banner,
          :approved,
          active: true,
          position: 'compare_hero',
          width: 1200,
          height: 300,
          alt_text: 'Casa com painéis solares, carro elétrico e wallbox'
        )

        get '/api/v1/banners', params: { position: 'compare_hero' }

        json = JSON.parse(response.body)
        payload = json.find { |banner| banner['id'] == hero.id }
        expect(payload).to include(
          'position' => 'compare_hero',
          'alt_text' => 'Casa com painéis solares, carro elétrico e wallbox',
          'width' => 1200,
          'height' => 300
        )
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
      it 'returns a retryable service error without masking the failure as an empty campaign list' do
        allow(Banner).to receive(:currently_active).and_raise(StandardError, 'database unavailable')

        get '/api/v1/banners'

        expect(response).to have_http_status(:service_unavailable)
        expect(JSON.parse(response.body)).to include(
          'code' => 'BANNER_DELIVERY_UNAVAILABLE',
          'message' => 'Não foi possível carregar as campanhas no momento.'
        )
      end
    end
  end
end

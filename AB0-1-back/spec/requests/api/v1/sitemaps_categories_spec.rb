require 'rails_helper'

RSpec.describe 'Api::V1::Sitemaps Categories', type: :request do
  describe 'GET /api/v1/sitemaps/categories (CDSI-032, CDSI-039)' do
    it 'R18/R19: returns cursor-paginated active categories with meta' do
      cat1 = create(:category, status: 'active', seo_url: 'energia-solar-residencial', name: 'Residencial', companies_count: 3)
      cat2 = create(:category, status: 'active', seo_url: 'energia-solar-rural', name: 'Rural', companies_count: 2)
      create(:category, status: 'inactive', seo_url: 'inativa-oculta', name: 'Inativa')

      get '/api/v1/sitemaps/categories', params: { limit: 1 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].size).to eq(1)
      expect(body['data'].first['slug']).to eq(cat1.seo_url)
      expect(body['meta']['has_more']).to be(true)
      expect(body['meta']['next_cursor']).to eq(cat1.id)

      get '/api/v1/sitemaps/categories', params: { cursor: body['meta']['next_cursor'], limit: 5 }
      expect(response).to have_http_status(:ok)
      body2 = JSON.parse(response.body)
      slugs2 = body2['data'].map { |c| c['slug'] }
      expect(slugs2).to include(cat2.seo_url)
      expect(slugs2).not_to include('inativa-oculta')
    end

    it 'R20/CDSI-034: returns 503 Service Unavailable (never 200 empty) when exporter fails' do
      allow(CategoryDiscovery::SitemapExporter).to receive(:call).and_raise(StandardError.new('DB timeout'))

      get '/api/v1/sitemaps/categories'

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body['error']).to be_present
    end
  end
end


# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Local solar pages', type: :request do
  let!(:category) { create(:category, name: 'Energia Solar', seo_url: 'energia-solar', kind: 'main') }
  let!(:state_only_company) do
    create(
      :company,
      name: 'Empresa SP com PR estadual',
      status: 'active',
      state: 'SP',
      city: 'São Paulo',
      coverage_states: 'PR',
      coverage_cities: nil,
      categories: [category]
    )
  end
  let!(:city_coverage_company) do
    create(
      :company,
      name: 'Empresa SP que atende Curitiba',
      status: 'active',
      state: 'SP',
      city: 'São Paulo',
      coverage_states: 'PR',
      coverage_cities: 'Curitiba',
      categories: [category]
    )
  end
  let!(:local_company) do
    create(
      :company,
      name: 'Empresa Curitiba',
      status: 'active',
      state: 'PR',
      city: 'Curitiba',
      categories: [category]
    )
  end

  describe 'GET /api/v1/local_solar_pages/:state/:city' do
    it 'does not include companies with state-only coverage in city pages' do
      get '/api/v1/local_solar_pages/pr/curitiba'

      expect(response).to have_http_status(:ok)
      names = JSON.parse(response.body).fetch('companies').map { |company| company.fetch('name') }

      expect(names).to include('Empresa Curitiba', 'Empresa SP que atende Curitiba')
      expect(names).not_to include('Empresa SP com PR estadual')
    end

    it 'supports filters on local pages' do
      local_company.update!(verified: true, rating_avg: 4.8)

      get '/api/v1/local_solar_pages/pr/curitiba', params: { verified: true, min_rating: 4.5 }

      body = JSON.parse(response.body)
      names = body.fetch('companies').map { |company| company.fetch('name') }

      expect(names).to eq(['Empresa Curitiba'])
      expect(body.fetch('filters').fetch('verified')).to eq('true')
    end

    it 'supports the vertical filter used by SEO local pages' do
      get '/api/v1/local_solar_pages/pr/curitiba', params: { vertical: 'energia-solar', page: 1, per_page: 1 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body.dig('location', 'canonical_path')).to eq('/companies/energia-solar/pr/curitiba')
      expect(body.fetch('companies').map { |company| company.fetch('name') }).to include('Empresa Curitiba')
    end

    it 'returns 200 with empty list when filtered by invalid project_types or category_ids' do
      get '/api/v1/local_solar_pages/pr/curitiba', params: { project_types: 'InvalidType,AnotherInvalid', category_ids: '99999' }
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.fetch('companies')).to be_empty
    end
  end

  describe 'GET /api/v1/local_solar_pages/:state' do
    it 'includes companies with state coverage in state pages' do
      get '/api/v1/local_solar_pages/pr'

      expect(response).to have_http_status(:ok)
      names = JSON.parse(response.body).fetch('companies').map { |company| company.fetch('name') }

      expect(names).to include('Empresa Curitiba', 'Empresa SP que atende Curitiba', 'Empresa SP com PR estadual')
    end
  end

  describe 'GET /api/v1/companies' do
    it 'keeps public state filter based on the primary company state' do
      get '/api/v1/companies', params: { state: 'PR', fields: 'card', page: 1, per_page: 20 }

      names = JSON.parse(response.body).fetch('data').map { |company| company.fetch('name') }

      expect(names).to include('Empresa Curitiba')
      expect(names).not_to include('Empresa SP com PR estadual', 'Empresa SP que atende Curitiba')
    end
  end
end

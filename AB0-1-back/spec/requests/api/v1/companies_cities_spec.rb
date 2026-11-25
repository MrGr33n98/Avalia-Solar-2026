# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Companies geographic catalog', type: :request do
  describe 'GET /api/v1/companies/states' do
    it 'returns the current public catalog revision with a validator' do
      get '/api/v1/companies/states'

      expect(response).to have_http_status(:ok)
      expect(response.headers['ETag']).to be_present
      expect(response.headers['X-Locations-Version']).to eq(Locations::BrLocations.revision)
      expect(response.headers['Cache-Control']).to include('public')
      expect(response.headers['Cache-Control']).to include('max-age=86400')
      expect(response.headers['Cache-Control']).to include('s-maxage=86400')
      expect(response.headers['Cache-Control']).to include('stale-while-revalidate=604800')
      expect(response.headers['Cache-Control'].split(',').map(&:strip)).not_to include('')
      expect(JSON.parse(response.body)).to eq(
        'states' => Locations::BrLocations.states.map { |state| state['acronym'] }
      )
    end

    it 'returns not modified when the catalog revision matches' do
      get '/api/v1/companies/states'
      etag = response.headers.fetch('ETag')

      get '/api/v1/companies/states', headers: { 'If-None-Match' => etag }

      expect(response).to have_http_status(:not_modified)
      expect(response.body).to be_empty
      expect(response.headers['X-Locations-Version']).to eq(Locations::BrLocations.revision)
    end

    it 'exposes the public cache validators to allowed browser origins' do
      get '/api/v1/companies/states', headers: { 'Origin' => 'http://localhost:3000' }

      exposed_headers = response.headers['Access-Control-Expose-Headers'].to_s.downcase
      expect(response).to have_http_status(:ok)
      expect(exposed_headers).to include('etag')
      expect(exposed_headers).to include('x-locations-version')
    end

    it 'does not mark requests carrying credentials as publicly cacheable' do
      get '/api/v1/companies/states'
      etag = response.headers.fetch('ETag')

      get '/api/v1/companies/states', headers: {
        'Cookie' => 'session=opaque',
        'If-None-Match' => etag
      }

      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to include('no-store')
      expect(response.headers['Cache-Control']).not_to include('public')
    end
  end

  describe 'GET /api/v1/companies/cities' do
    let(:state) { 'SC' }

    it 'returns cities scoped to one valid UF and a cache validator' do
      get '/api/v1/companies/cities', params: { state: state }

      expect(response).to have_http_status(:ok)
      expect(response.headers['ETag']).to be_present
      expect(response.headers['X-Locations-Version']).to eq(Locations::BrLocations.revision)
      expect(response.headers['Cache-Control']).to include('public')
      expect(JSON.parse(response.body)).to eq('cities' => Locations::BrLocations.cities_for(state))
    end

    it 'uses a distinct validator for each UF and supports conditional requests' do
      get '/api/v1/companies/cities', params: { state: 'SC' }
      santa_catarina_etag = response.headers.fetch('ETag')

      get '/api/v1/companies/cities', params: { state: 'SP' }
      sao_paulo_etag = response.headers.fetch('ETag')

      expect(sao_paulo_etag).not_to eq(santa_catarina_etag)
      expect(response).to have_http_status(:ok)

      get '/api/v1/companies/cities', params: { state: 'SC' }, headers: { 'If-None-Match' => santa_catarina_etag }

      expect(response).to have_http_status(:not_modified)
      expect(response.body).to be_empty
    end

    it 'keeps the existing empty payload for a missing or invalid UF without public caching' do
      [nil, 'XX'].each do |value|
        params = value.nil? ? {} : { state: value }
        get '/api/v1/companies/cities', params: params

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq('cities' => [])
        expect(response.headers['Cache-Control']).to include('no-store')
        expect(response.headers['Cache-Control']).not_to include('public')
      end
    end

    it 'does not mark requests carrying authorization as publicly cacheable' do
      get '/api/v1/companies/cities', params: { state: state }
      etag = response.headers.fetch('ETag')

      get '/api/v1/companies/cities', params: { state: state }, headers: {
        'Authorization' => 'Bearer opaque',
        'If-None-Match' => etag
      }

      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to include('no-store')
      expect(response.headers['Cache-Control']).not_to include('public')
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Companies Fast Card and Count Endpoint (P0-005, P2-001)', type: :request do
  let!(:company) { create(:company, name: 'Solar Tech Pro', status: 'active', verified: true) }

  before do
    Rails.cache.clear
  end

  describe 'GET /api/v1/companies?fields=card' do
    it 'returns optimized card attributes and proper cache headers' do
      get '/api/v1/companies', params: { fields: 'card' }
      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to include('public')
      expect(response.headers['Cache-Control']).to include('stale-while-revalidate')

      data = JSON.parse(response.body)
      item = data.is_a?(Array) ? data.first : data['data']&.first
      expect(item).to be_present
      expect(item).to have_key('id')
      expect(item).to have_key('name')
      expect(item).to have_key('identity')
      expect(item).to have_key('reputation')
      expect(item).to have_key('coverage')
    end
  end

  describe 'GET /api/v1/companies/count' do
    it 'returns lightweight count payload' do
      get '/api/v1/companies/count'
      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to include('public')

      payload = JSON.parse(response.body)
      expect(payload).to have_key('count')
      expect(payload['count']).to be >= 1
    end
  end
end

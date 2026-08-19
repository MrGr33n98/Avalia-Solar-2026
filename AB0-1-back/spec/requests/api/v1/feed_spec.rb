# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Feed', type: :request do
  describe 'GET /api/v1/feed' do
    it 'returns http success and correct json schema' do
      get '/api/v1/feed'
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json).to have_key('data')
      expect(json).to have_key('meta')
      expect(json['meta']).to have_key('next_cursor')
      expect(json['meta']).to have_key('has_more')
    end
  end
end

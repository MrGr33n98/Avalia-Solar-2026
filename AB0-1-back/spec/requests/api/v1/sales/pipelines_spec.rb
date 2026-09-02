# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Pipelines', type: :request do
  let(:user) { create(:user) }

  before do
    sign_in user, scope: :user
  end

  describe 'GET /api/v1/sales/pipelines' do
    it 'returns list of active pipelines and their ordered stages' do
      pipeline = ::Sales::Pipeline.create!(name: 'Pipeline Solar', key: 'solar_default', active: true)
      pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 1, probability: 20)
      pipeline.stages.create!(name: 'Fechado', key: 'won', position: 2, probability: 100)

      get '/api/v1/sales/pipelines', headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['pipelines']).to be_an(Array)
      expect(json['pipelines'].first['name']).to eq('Pipeline Solar')
      expect(json['pipelines'].first['stages'].length).to eq(2)
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Leads', type: :request do
  describe 'GET /api/v1/sales/leads' do
    it 'returns list of leads successfully' do
      get '/api/v1/sales/leads'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('leads')
    end
  end

  describe 'POST /api/v1/sales/leads' do
    it 'creates a lead when attributes are valid' do
      account = ::Sales::Account.create!(name: 'Usina Solar S/A')
      pipeline = ::Sales::Pipeline.create!(name: 'Pipeline Solar', key: 'solar')
      stage = pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 1)

      post '/api/v1/sales/leads', params: {
        lead: {
          name: 'Projeto Usina 100kWp',
          sales_account_id: account.id,
          sales_pipeline_id: pipeline.id,
          sales_stage_id: stage.id,
          temperature: 'hot',
          value_cents: 15000000
        }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['lead']['name']).to eq('Projeto Usina 100kWp')
      expect(json['lead']['temperature']).to eq('hot')
    end
  end
end

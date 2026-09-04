# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Pipelines::Boards', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company, roles: ['sales_rep']) }
  let(:auth_headers) { auth_headers_for(user) }

  let(:pipeline) { create(:sales_pipeline, name: 'B2B Pipeline', active: true) }
  let!(:stage) { create(:sales_stage, pipeline: pipeline, key: 'prospect', name: 'Prospect', position: 1, probability: 20) }
  let(:account) { create(:sales_account, company: company, name: 'WEG Solar') }
  let(:contact) { create(:sales_contact, account: account, first_name: 'Felipe', last_name: 'Oliveira', email: 'felipe@weg.com') }

  let!(:opportunity) do
    create(:sales_opportunity,
           pipeline: pipeline,
           stage: stage,
           account: account,
           primary_contact: contact,
           owner: user,
           name: 'Usina Solar 500kWp',
           value_cents: 1_500_000,
           temperature: 'hot',
           status: 'open')
  end

  describe 'GET /api/v1/sales/pipelines/:pipeline_id/board' do
    it 'returns the board DTO with cards, stages, and totals' do
      get "/api/v1/sales/pipelines/#{pipeline.id}/board", headers: auth_headers

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body, symbolize_names: true)

      expect(json[:pipeline][:id]).to eq(pipeline.id)
      expect(json[:stages].size).to eq(1)
      expect(json[:cards].size).to eq(1)

      card = json[:cards].first
      expect(card[:id]).to eq(opportunity.id)
      expect(card[:name]).to eq('Usina Solar 500kWp')
      expect(card[:value_cents]).to eq(1_500_000)
      expect(card[:temperature]).to eq('hot')
      expect(card[:account][:name]).to eq('WEG Solar')
      expect(card[:primary_contact][:name]).to eq('Felipe Oliveira')
      expect(card[:owner][:name]).to eq(user.name)
      expect(card[:flags][:hot]).to be true
    end

    it 'returns default pipeline board when pipeline_id is default' do
      get '/api/v1/sales/pipelines/default/board', headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body, symbolize_names: true)
      expect(json[:pipeline][:id]).to eq(pipeline.id)
    end
  end
end

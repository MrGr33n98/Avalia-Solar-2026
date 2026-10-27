# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Pipelines', type: :request do
  let(:user) { create(:user, company: create(:company)) }

  before do
    role = Sales::Role.create!(name: "Pipeline #{SecureRandom.hex(4)}", slug: "pipeline_#{SecureRandom.hex(4)}", system: true)
    Sales::UserRole.create!(user: user, role: role)
  end

  describe 'GET /api/v1/sales/pipelines' do
    it 'returns list of active pipelines and their ordered stages' do
      pipeline = ::Sales::Pipeline.create!(name: 'Pipeline Solar', key: 'solar_default', active: true)
      pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 1, probability: 20)
      pipeline.stages.create!(name: 'Fechado', key: 'won', position: 2, probability: 100)

      token = JWT.encode({ user_id: user.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
      get '/api/v1/sales/pipelines', headers: { 'ACCEPT' => 'application/json', 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['pipelines']).to be_an(Array)
      expect(json['pipelines'].first['name']).to eq('Pipeline Solar')
      expect(json['pipelines'].first['stages'].length).to eq(2)
    end
  end

  describe 'POST /api/v1/sales/pipelines' do
    let(:headers) do
      token = JWT.encode({ user_id: user.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
      { 'ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json', 'Authorization' => "Bearer #{token}" }
    end

    it 'creates an onboarding pipeline with automatic onboarding stages' do
      post '/api/v1/sales/pipelines',
           params: { pipeline: { name: 'Onboarding de Clientes' } }.to_json,
           headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body, symbolize_names: true)

      expect(json[:pipeline][:name]).to eq('Onboarding de Clientes')
      expect(json[:pipeline][:stages].size).to eq(7)
      expect(json[:pipeline][:stages].first[:name]).to eq('Boas-vindas & Kickoff')
      expect(json[:pipeline][:stages].last[:name]).to eq('Cancelado / Desistência')
    end

    it 'creates a pipeline with custom specified stages' do
      post '/api/v1/sales/pipelines',
           params: {
             pipeline: {
               name: 'Funil Customizado',
               stages: [
                 { name: 'Etapa 1', position: 1, probability: 30 },
                 { name: 'Etapa Concluída', position: 2, probability: 100, terminal_type: 'won' }
               ]
             }
           }.to_json,
           headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body, symbolize_names: true)
      expect(json[:pipeline][:name]).to eq('Funil Customizado')
      expect(json[:pipeline][:stages].size).to eq(2)
    end

    it 'validates presence of pipeline name' do
      post '/api/v1/sales/pipelines',
           params: { pipeline: { name: '' } }.to_json,
           headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body, symbolize_names: true)
      expect(json[:error][:code]).to eq('PIPELINE_NAME_REQUIRED')
    end
  end
end

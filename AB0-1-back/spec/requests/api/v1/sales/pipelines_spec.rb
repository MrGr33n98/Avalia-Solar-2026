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
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Pipelines::Boards', type: :request do
  let(:company) do
    Company.new(name: 'Empresa Teste', slug: "empresa-#{SecureRandom.hex(4)}").tap { |c| c.save!(validate: false) }
  end

  let(:user) do
    User.new(
      name: 'Sales User',
      email: "sales.#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end

  let(:headers) do
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base)
    {
      'Authorization' => "Bearer #{token}",
      'CONTENT_TYPE' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let(:pipeline) { Sales::Pipeline.create!(name: 'B2B Pipeline', key: "b2b_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage) { pipeline.stages.create!(key: 'prospect', name: 'Prospect', position: 1, probability: 20) }
  let(:account) { Sales::Account.create!(company_id: company.id, owner: user, name: 'WEG Solar') }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'Felipe', last_name: 'Oliveira', email: 'felipe@weg.com') }

  let!(:opportunity) do
    account.opportunities.create!(
      pipeline: pipeline,
      stage: stage,
      primary_contact: contact,
      owner: user,
      name: 'Usina Solar 500kWp',
      value_cents: 1_500_000,
      temperature: 'hot',
      status: 'open'
    )
  end

  describe 'GET /api/v1/sales/pipelines/:pipeline_id/board' do
    it 'returns the board DTO with cards, stages, and totals' do
      get "/api/v1/sales/pipelines/#{pipeline.id}/board", headers: headers

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
      get '/api/v1/sales/pipelines/default/board', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body, symbolize_names: true)
      expect(json[:pipeline][:id]).to eq(pipeline.id)
    end

    it 'handles opportunity with activity without error' do
      Sales::Activity.create!(
        account: account,
        opportunity: opportunity,
        actor: user,
        activity_type: 'call',
        subject: 'Ligação de Apresentação',
        body: 'Discutido proposta técnica de 500kWp',
        occurred_at: Time.current
      )

      get "/api/v1/sales/pipelines/#{pipeline.id}/board", headers: headers
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body, symbolize_names: true)
      card = json[:cards].first
      expect(card[:last_activity]).not_to be_nil
      expect(card[:last_activity][:type]).to eq('call')
      expect(card[:last_activity][:description]).to eq('Discutido proposta técnica de 500kWp')
    end

    it 'handles opportunity with qualification without error' do
      Sales::Qualification.create!(
        opportunity: opportunity,
        situation: 'Cliente usa gerador diesel',
        spin_completion: 80,
        bant_completion: 60
      )

      get "/api/v1/sales/pipelines/#{pipeline.id}/board", headers: headers
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body, symbolize_names: true)
      card = json[:cards].first
      expect(card[:qualification]).not_to be_nil
      expect(card[:qualification][:spin_completion]).to eq(80)
      expect(card[:qualification][:bant_completion]).to eq(60)
    end
  end
end

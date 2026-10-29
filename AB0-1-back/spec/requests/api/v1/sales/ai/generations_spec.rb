# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales AI Studio API', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }
  let!(:admin_user) { create(:user, company: company, role: 'admin') }
  let!(:rep_user) { create(:user, company: company) }
  let!(:other_user) { create(:user, company: other_company) }

  before do
    admin_role = Sales::Role.create!(name: 'admin', slug: "admin_#{SecureRandom.hex(4)}", system: true)
    rep_role = Sales::Role.create!(name: 'sales_rep', slug: "rep_#{SecureRandom.hex(4)}", system: true)
    other_role = Sales::Role.create!(name: 'sales_rep_other', slug: "rep_other_#{SecureRandom.hex(4)}", system: true)

    Sales::UserRole.create!(user: admin_user, role: admin_role)
    Sales::UserRole.create!(user: rep_user, role: rep_role)
    Sales::UserRole.create!(user: other_user, role: other_role)
  end

  def auth_headers(account)
    token = JWT.encode(
      { user_id: account.id, typ: 'access', exp: 1.day.from_now.to_i },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/sales/ai/providers and POST credentials' do
    it 'allows admin to rotate OpenRouter key and masks it in responses without exposing plaintext' do
      raw_secret = 'sk-or-v1-supersecret-openrouter-key-9876'

      post '/api/v1/sales/ai/providers/openrouter/credentials',
           params: { api_key: raw_secret },
           headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(response.body).not_to include(raw_secret)
      expect(body.dig('provider', 'masked_key')).to include('9876')

      get '/api/v1/sales/ai/providers', headers: auth_headers(rep_user)
      expect(response).to have_http_status(:ok)
      providers_json = JSON.parse(response.body)
      expect(response.body).not_to include(raw_secret)
      expect(providers_json['providers'].first['configured']).to be(true)
    end

    it 'blocks non-admin sales user from updating OpenRouter credentials' do
      post '/api/v1/sales/ai/providers/openrouter/credentials',
           params: { api_key: 'sk-or-v1-unauthorized-attempt-1234' },
           headers: auth_headers(rep_user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET & PATCH /api/v1/sales/ai/settings' do
    it 'returns default model profiles and allows admin to update budgets and task profiles' do
      get '/api/v1/sales/ai/settings', headers: auth_headers(admin_user)
      expect(response).to have_http_status(:ok)

      initial = JSON.parse(response.body)
      expect(initial['model_profiles']).not_to be_empty

      patch '/api/v1/sales/ai/settings',
            params: {
              settings: {
                monthly_budget_usd: 120.5,
                daily_user_limit: 90,
                require_zdr: true
              },
              model_profiles: [
                {
                  feature: 'email_first_touch',
                  primary_model_id: 'anthropic/claude-3.5-sonnet',
                  fallback_model_id: 'openai/gpt-4o-mini',
                  temperature: 0.2,
                  max_tokens: 950,
                  quota_daily: 150,
                  enabled: true
                }
              ]
            },
            headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      updated = JSON.parse(response.body)
      expect(updated.dig('settings', 'monthly_budget_usd')).to eq(120.5)
      profile = updated['model_profiles'].find { |p| p['feature'] == 'email_first_touch' }
      expect(profile['primary_model_id']).to eq('anthropic/claude-3.5-sonnet')
    end
  end

  describe 'POST /api/v1/sales/ai/generations & feedback' do
    let(:mock_client) { instance_double(Sales::Ai::OpenRouterClient) }

    before do
      setting = Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company.id)
      setting.rotate_openrouter_key!('sk-or-v1-test-key-000011112222', actor_user: admin_user)
      allow(Sales::Ai::OpenRouterClient).to receive(:new).and_return(mock_client)
    end

    it 'creates a generation for authorized sales user and records human feedback' do
      allow(mock_client).to receive(:chat!).and_return(
        content: {
          name: 'Template Consultivo Solar B2B',
          category: 'Prospecção',
          subject_template: 'Avaliação energética para {{company.name}}',
          preheader: 'Pontos de atenção para redução de custo operacional',
          body_json: {
            blocks: [
              { id: 'blk_1', type: 'text', text: 'Olá {{person.first_name}}, tudo bem?' },
              { id: 'blk_2', type: 'button', label: 'Agendar conversa', url: 'https://avaliasolar.com.br' }
            ]
          },
          rationale: 'Estrutura enxuta focada em decisão executiva.'
        }.to_json,
        resolved_model: 'anthropic/claude-3.5-sonnet',
        prompt_tokens: 300,
        completion_tokens: 180,
        latency_ms: 910,
        provider_request_id: 'or_tpl_1'
      )

      post '/api/v1/sales/ai/generations',
           params: {
             feature: 'template_create',
             instructions: 'Criar template de prospecção B2B para indústria.'
           },
           headers: auth_headers(rep_user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['feature']).to eq('template_create')
      expect(json.dig('result', 'body_json', 'blocks').size).to eq(2)

      gen_id = json['id']

      # Cross-tenant user cannot read this generation
      get "/api/v1/sales/ai/generations/#{gen_id}", headers: auth_headers(other_user)
      expect(response).to have_http_status(:not_found)

      # Authorized user records feedback
      post "/api/v1/sales/ai/generations/#{gen_id}/feedback",
           params: { decision: 'accepted', notes: 'Inserido como draft na biblioteca' },
           headers: auth_headers(rep_user)

      expect(response).to have_http_status(:ok)
      fb = JSON.parse(response.body)
      expect(fb.dig('generation', 'user_decision')).to eq('accepted')
    end
  end
end


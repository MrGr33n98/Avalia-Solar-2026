# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Reviewer::BrandUsages', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:brand_fronius) { create(:brand, name: 'Fronius', slug: 'fronius') }
  let(:brand_weg) { create(:brand, name: 'WEG Solar', slug: 'weg-solar') }

  let(:headers) do
    token = JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' }
  end

  let(:other_headers) do
    token = JWT.encode({ user_id: other_reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' }
  end

  describe 'Segurança e Autenticação' do
    it 'retorna 401 quando não autenticado' do
      get '/api/v1/reviewer/brand_usages', headers: { 'ACCEPT' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'retorna 403 quando o usuário não possui a role necessária' do
      basic_user = create(:user, role: 'buyer')
      token = JWT.encode({ user_id: basic_user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
      get '/api/v1/reviewer/brand_usages', headers: { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' }
      expect(response).to have_http_status(:forbidden)
    end

    it 'retorna 404 ao tentar acessar ou alterar registro de outro usuário (prevenção contra IDOR)' do
      other_usage = create(:reviewer_brand_usage, user: other_reviewer, brand: brand_fronius)

      get "/api/v1/reviewer/brand_usages/#{other_usage.id}", headers: headers
      expect(response).to have_http_status(:not_found)

      delete "/api/v1/reviewer/brand_usages/#{other_usage.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/reviewer/brand_usages' do
    let!(:usage_fronius) { create(:reviewer_brand_usage, user: reviewer, brand: brand_fronius, usage_context: 'integrator_install') }
    let!(:usage_weg) { create(:reviewer_brand_usage, user: reviewer, brand: brand_weg, usage_context: 'personal_owner') }
    let!(:other_usage) { create(:reviewer_brand_usage, user: other_reviewer, brand: brand_fronius) }
    let!(:disabled_usage) { create(:reviewer_brand_usage, :disabled, user: reviewer, brand: brand_fronius, usage_context: 'maintenance') }

    it 'retorna apenas os registros ativos do usuário autenticado' do
      get '/api/v1/reviewer/brand_usages', headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to eq('private, no-store')

      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
      ids = json['data'].map { |item| item['id'] }
      expect(ids).to contain_exactly(usage_fronius.id.to_s, usage_weg.id.to_s)
    end
  end

  describe 'POST /api/v1/reviewer/brand_usages' do
    it 'cria um novo registro para o usuário com status self_declared e evento de auditoria' do
      payload = {
        brand_usage: {
          brand_id: brand_fronius.id,
          usage_context: 'integrator_install',
          experience_since: '2023-01-15',
          description: 'Instalação de inversores Fronius Primo e Symo',
          visibility: 'private',
          # Tentativa de injeção de privilégio (deve ser bloqueada)
          verification_status: 'evidence_verified',
          user_id: 999_999
        }
      }

      post '/api/v1/reviewer/brand_usages', params: payload, headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)['data']

      expect(json['brand']['slug']).to eq('fronius')
      expect(json['usage_context']).to eq('integrator_install')
      expect(json['verification_status']).to eq('self_declared') # Blindado contra mass assignment!
      expect(json['visibility']).to eq('private')

      usage = ReviewerBrandUsage.find(json['id'])
      expect(usage.user_id).to eq(reviewer.id)
      expect(usage.events.where(action: 'created').count).to eq(1)
    end

    it 'retorna 409 quando o usuário tenta cadastrar marca já ativa no mesmo contexto' do
      create(:reviewer_brand_usage, user: reviewer, brand: brand_fronius, usage_context: 'integrator_install')

      payload = {
        brand_usage: {
          brand_id: brand_fronius.id,
          usage_context: 'integrator_install'
        }
      }

      post '/api/v1/reviewer/brand_usages', params: payload, headers: headers
      expect(response).to have_http_status(:conflict)
    end

    it 'reativa de forma idempotente registro desativado anteriormente' do
      disabled = create(:reviewer_brand_usage, :disabled, user: reviewer, brand: brand_fronius, usage_context: 'integrator_install')

      payload = {
        brand_usage: {
          brand_id: brand_fronius.id,
          usage_context: 'integrator_install',
          description: 'Reativado com novo escopo'
        }
      }

      post '/api/v1/reviewer/brand_usages', params: payload, headers: headers
      expect(response).to have_http_status(:ok)

      disabled.reload
      expect(disabled.status).to eq('active')
      expect(disabled.description).to eq('Reativado com novo escopo')
      expect(disabled.events.where(action: 'reactivated').count).to eq(1)
    end
  end

  describe 'PATCH /api/v1/reviewer/brand_usages/:id' do
    let!(:usage) { create(:reviewer_brand_usage, user: reviewer, brand: brand_fronius, usage_context: 'integrator_install') }

    it 'atualiza descrição e contexto' do
      patch "/api/v1/reviewer/brand_usages/#{usage.id}",
            params: { brand_usage: { description: 'Nova descrição atualizada' } },
            headers: headers

      expect(response).to have_http_status(:ok)
      expect(usage.reload.description).to eq('Nova descrição atualizada')
      expect(usage.events.where(action: 'updated').count).to eq(1)
    end

    it 'exige consentimento explícito e versão ao tornar público' do
      patch "/api/v1/reviewer/brand_usages/#{usage.id}",
            params: { brand_usage: { visibility: 'public' } },
            headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'permite tornar público com consentimento confirmado' do
      patch "/api/v1/reviewer/brand_usages/#{usage.id}",
            params: {
              brand_usage: {
                visibility: 'public',
                consent_confirmed: true,
                consent_version: 'terms_v1'
              }
            },
            headers: headers

      expect(response).to have_http_status(:ok)
      usage.reload
      expect(usage.visibility).to eq('public')
      expect(usage.consent_version).to eq('terms_v1')
      expect(usage.opted_in_at).to be_present
    end

    it 'rejeita atualização concorrente quando lock_version está desatualizado (optimistic locking)' do
      stale_lock_version = usage.lock_version - 1

      patch "/api/v1/reviewer/brand_usages/#{usage.id}",
            params: { brand_usage: { description: 'Tentativa concorrente', lock_version: stale_lock_version } },
            headers: headers

      expect(response).to have_http_status(:conflict)
    end
  end

  describe 'DELETE /api/v1/reviewer/brand_usages/:id' do
    let!(:usage) { create(:reviewer_brand_usage, user: reviewer, brand: brand_fronius) }

    it 'executa soft delete (status disabled) e registra evento' do
      delete "/api/v1/reviewer/brand_usages/#{usage.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(usage.reload.status).to eq('disabled')
      expect(usage.events.where(action: 'disabled').count).to eq(1)
    end
  end

  describe 'GET /api/v1/reviewer/brand_experience_summary' do
    before do
      create(:reviewer_brand_usage, user: reviewer, brand: brand_fronius, usage_context: 'integrator_install', verification_status: 'evidence_verified')
      create(:reviewer_brand_usage, :public, user: reviewer, brand: brand_fronius, usage_context: 'maintenance')
      create(:reviewer_brand_usage, user: reviewer, brand: brand_weg, usage_context: 'personal_owner')
      create(:reviewer_brand_usage, :disabled, user: reviewer, brand: brand_weg, usage_context: 'maintenance')
    end

    it 'retorna métricas reais consolidadas de uso de marcas' do
      get '/api/v1/reviewer/brand_experience_summary', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)['data']

      expect(json['total_brands']).to eq(2) # Fronius + WEG (distintas)
      expect(json['total_usages']).to eq(3) # 3 ativas
      expect(json['verified_usages']).to eq(1) # 1 verificada
      expect(json['public_usages']).to eq(1) # 1 pública
      expect(json['by_context']['integrator_install']).to eq(1)
      expect(json['by_context']['maintenance']).to eq(1)
      expect(json['by_context']['personal_owner']).to eq(1)
    end
  end
end

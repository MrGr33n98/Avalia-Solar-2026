# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/company_dashboard/analytics/ranking', type: :request do
  let(:company) { create(:company, rating_avg: 4.5, rating_count: 10, reviews_count: 5) }
  let(:user)    { create(:user, role: 'company', status: :active, company: company) }
  let(:snapshot_date) { Time.current.in_time_zone('America/Sao_Paulo').to_date }

  before do
    plan = create(:plan, name: 'Enterprise', price: 299.0)
    company.update!(plan: plan)
    allow(plan).to receive(:tier).and_return('enterprise')
    allow(plan).to receive(:plan_tier).and_return('enterprise')

    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController)
      .to receive(:current_user).and_return(user)

    # Garante acesso ao feature gate de ranking
    allow(FeatureGateService).to receive(:can_access?).and_return(true)

    # Insere score na tabela de ranking para a empresa aparecer no escopo
    ActiveRecord::Base.connection.execute(
      "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) " \
      "VALUES (#{company.id}, 50.0, '{}', NOW(), NOW(), NOW()) " \
      "ON CONFLICT (company_id) DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()"
    )
    CompanyTrustScore.create!(company: company, score: 70.0, components: {}, computed_at: Time.current)
  end

  def json_body
    JSON.parse(response.body)
  end

  def create_snapshot(company:, position:, population:, score:, scope_type: 'global', scope_id: nil, date: snapshot_date)
    CompanyRankingSnapshot.create!(
      company: company,
      scope_type: scope_type,
      scope_id: scope_id,
      definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
      score: score,
      rank_position: position,
      population_size: population,
      percentile: ((population - position + 1).to_f / population * 100).round(2),
      breakdown: { 'base_trust' => 70, 'recent_engagement' => score - 5 },
      quality_flags: [],
      snapshot_date: date,
      data_through: date.yesterday.end_of_day,
      computed_at: date.end_of_day
    )
  end

  # ---------------------------------------------------------------------------
  # Cenário 1: Usuário autorizado com snapshot presente → 200 ready
  # ---------------------------------------------------------------------------
  describe 'usuário autorizado com snapshot disponível' do
    before { create_snapshot(company: company, position: 1, population: 1, score: 50.0) }

    it 'retorna HTTP 200 e status ready' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body['status']).to eq('ready')
      expect(json_body['is_premium_analytics']).to be(true)
    end

    it 'inclui as chaves obrigatórias do contrato de payload' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body.keys).to include(
        'status', 'mode', 'ranking', 'rank_position', 'ranking_score',
        'magic_quadrant_points', 'quadrant_meta', 'category_rankings',
        'historical_data', 'transparency', 'quality',
        'scope', 'definition', 'breakdown',
        'history', 'quadrant', 'leaders', 'neighbors', 'insights',
        'is_premium_analytics'
      )
    end

    it 'retorna scope global como string não-nula' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body['scope']).to be_a(String)
      expect(json_body['scope']).not_to be_empty
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 2: Snapshot inexistente → 200 processing (NUNCA 500)
  # ---------------------------------------------------------------------------
  describe 'sem nenhum snapshot disponível' do
    it 'retorna HTTP 200 com status processing — nunca 500' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body['status']).to eq('processing')
      expect(json_body['error']).to be_nil
    end

    it 'inclui quality_flag snapshot_processing quando snapshot ausente' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body.dig('quality', 'flags')).to include('snapshot_processing')
    end

    it 'retorna listas vazias em vez de nil para pontos, histórico e vizinhos' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body['magic_quadrant_points']).to eq([])
      expect(json_body['historical_data']).to eq([])
      expect(json_body['neighbors']).to eq([])
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 3: Dados existentes → status ready com snapshot
  # ---------------------------------------------------------------------------
  describe 'com snapshot pronto gerado hoje' do
    before { create_snapshot(company: company, position: 1, population: 1, score: 50.0) }

    it 'retorna rank_position a partir do snapshot' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body.dig('ranking', 'status')).to eq('ready')
      expect(json_body.dig('ranking', 'position')).to eq(1)
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 4: Feature gate não disponível → 200 locked
  # ---------------------------------------------------------------------------
  describe 'empresa sem acesso ao feature de ranking (free)' do
    before do
      allow(FeatureGateService).to receive(:can_access?)
        .with(company, 'advanced_analytics').and_return(false)
    end

    it 'retorna HTTP 200 com ranking_status locked' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:ok)
      expect(json_body['status']).to eq('locked')
      expect(json_body['is_premium_analytics']).to be(false)
      expect(json_body['upsell_message']).to be_present
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 5: Usuário sem acesso à empresa → Pundit 403
  # ---------------------------------------------------------------------------
  describe 'usuário sem vínculo com a empresa' do
    let(:other_company) { create(:company) }
    let(:other_user)    { create(:user, role: 'company', status: :active, company: other_company) }

    before do
      allow_any_instance_of(Api::V1::CompanyDashboardController)
        .to receive(:current_user).and_return(other_user)
    end

    it 'retorna 403 ou 401 — nunca 200 com dados da empresa alheia' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response.status).to be_in([401, 403])
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 6: Filtros inválidos → 422 com contrato de erro explícito
  # ---------------------------------------------------------------------------
  describe 'filtro de quadrant_mode inválido' do
    before { create_snapshot(company: company, position: 1, population: 1, score: 50.0) }

    it 'retorna 422 com invalid_filters no corpo' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'bogus_mode', history_days: 90 }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body['error']['code']).to eq('INVALID_RANKING_FILTERS')
      expect(json_body['invalid_filters']).to have_key('quadrant_mode')
    end
  end

  # ---------------------------------------------------------------------------
  # Cenário 7: Erro interno simulado → 500 com contrato de erro, nunca exceção crua
  # ---------------------------------------------------------------------------
  describe 'erro interno no RankingService' do
    before do
      allow_any_instance_of(CompanyDashboard::RankingService)
        .to receive(:ranking_data).and_raise(RuntimeError, 'erro simulado de banco')
    end

    it 'retorna HTTP 500 com corpo JSON estruturado — nunca exceção crua' do
      get '/api/v1/company_dashboard/analytics/ranking',
          params: { company_id: company.id, quadrant_mode: 'default', history_days: 90 }

      expect(response).to have_http_status(:internal_server_error)
      body = json_body
      expect(body['error']['code']).to eq('RANKING_UNAVAILABLE')
      expect(body['error']['message']).to be_present
      expect(body['error']['request_id']).to be_present
      expect(body['is_premium_analytics']).to be(true)
    end
  end
end

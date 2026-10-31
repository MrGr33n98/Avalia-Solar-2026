# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::OpportunitiesController#analytics', type: :request do
  let(:tenant_company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:sales_user) { create(:user, company: tenant_company, role: :company, name: 'Vendedor Alpha', email: 'alpha@tenant.com') }
  let(:other_user) { create(:user, company: other_company, role: :company, name: 'Outro Usuário', email: 'outro@externo.com') }
  let(:sales_role) do
    Sales::Role.create!(
      name: "Representante de Vendas #{SecureRandom.hex(4)}",
      slug: "sales_rep_#{SecureRandom.hex(4)}",
      system: true
    )
  end
  let!(:sales_role_assignment) { Sales::UserRole.create!(user: sales_user, role: sales_role) }

  let(:pipeline_a) do
    Sales::Pipeline.create!(name: 'Funil Comercial A', key: "pipeline_a_#{SecureRandom.hex(4)}", active: true)
  end
  let(:pipeline_b) do
    Sales::Pipeline.create!(name: 'Funil B2B B', key: "pipeline_b_#{SecureRandom.hex(4)}", active: false)
  end
  let!(:stage_a1) { pipeline_a.stages.create!(name: 'Qualificação A', key: 'qual_a', position: 1, probability: 10) }
  let!(:stage_a2) { pipeline_a.stages.create!(name: 'Proposta A', key: 'prop_a', position: 2, probability: 50) }
  let!(:stage_b1) { pipeline_b.stages.create!(name: 'Diagnóstico B', key: 'diag_b', position: 1, probability: 20) }

  let!(:tenant_account) do
    Sales::Account.create!(company: tenant_company, owner: sales_user, name: 'Conta Solar SP', state: 'SP')
  end
  let!(:other_tenant_account) do
    Sales::Account.create!(company: other_company, owner: other_user, name: 'Conta Externa RJ', state: 'RJ')
  end

  def headers_for(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  def json
    JSON.parse(response.body)
  end

  describe 'GET /api/v1/sales/opportunities/analytics' do
    context 'TC-013: quando o usuário não está autenticado' do
      it 'retorna status 401 Unauthorized' do
        get '/api/v1/sales/opportunities/analytics'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'TC-014: quando o usuário não possui permissão de vendas' do
      let(:unauthorized_user) { create(:user, company: tenant_company, role: :company) }

      it 'retorna status 403 Forbidden' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(unauthorized_user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'TC-001: quando a base está vazia (zero leads)' do
      it 'retorna HTTP 200 com resumo zerado e arrays vazios de distribuição' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json['summary']).to eq({
          'total_leads' => 0,
          'total_value_cents' => 0,
          'total_value_formatted' => 'R$ 0,00',
          'avg_value_cents' => 0,
          'avg_value_formatted' => 'R$ 0,00',
          'avg_time_open_days' => 0.0,
          'win_rate_percentage' => 0.0
        })
        expect(json['time_series']).to eq([])
        expect(json['breakdowns']).to include(
          'assignee' => [],
          'stage' => [],
          'product' => [],
          'outcome' => [
            { 'status' => 'won', 'label' => 'Won', 'count' => 0, 'percentage' => 0.0, 'color' => '#16A34A' },
            { 'status' => 'open', 'label' => 'Open', 'count' => 0, 'percentage' => 0.0, 'color' => '#334155' },
            { 'status' => 'lost', 'label' => 'Lost', 'count' => 0, 'percentage' => 0.0, 'color' => '#DC2626' }
          ],
          'source' => [],
          'competitor' => [],
          'tag' => [],
          'territory' => [],
          'age' => [],
          'value_bracket' => [],
          'channel' => []
        )
      end
    end

    context 'TC-002 e TC-005: com um lead cadastrado' do
      let!(:opportunity) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Usina 100kWp',
          status: 'open',
          value_cents: 2_500_000,
          temperature: 'hot',
          created_at: 2.days.ago
        )
      end

      it 'calcula corretamente os KPIs de quantidade, valor total e valor médio' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json.dig('summary', 'total_leads')).to eq(1)
        expect(json.dig('summary', 'total_value_cents')).to eq(2_500_000)
        expect(json.dig('summary', 'total_value_formatted')).to eq('R$ 25.000,00')
        expect(json.dig('summary', 'avg_value_cents')).to eq(2_500_000)
        expect(json.dig('summary', 'avg_value_formatted')).to eq('R$ 25.000,00')
        expect(json.dig('summary', 'win_rate_percentage')).to eq(0.0)
      end
    end

    context 'TC-003 e TC-004: com múltiplos leads em status open, won e lost' do
      let!(:opp_open) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead Aberto',
          status: 'open',
          value_cents: 1_000_000,
          temperature: 'warm',
          created_at: 5.days.ago
        )
      end
      let!(:opp_won) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a2,
          owner: sales_user,
          name: 'Lead Ganho',
          status: 'won',
          value_cents: 3_000_000,
          won_at: 1.day.ago,
          temperature: 'hot',
          created_at: 10.days.ago
        )
      end
      let!(:opp_lost) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead Perdido',
          status: 'lost',
          lost_at: 2.days.ago,
          temperature: 'cold',
          created_at: 8.days.ago
        )
      end

      it 'calcula taxa de conversão (win rate) baseada em fechados (won / (won + lost))' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json.dig('summary', 'total_leads')).to eq(3)
        expect(json.dig('summary', 'total_value_cents')).to eq(4_000_000)
        # 1 won entre 2 fechados (1 won + 1 lost) = 50.0%
        expect(json.dig('summary', 'win_rate_percentage')).to eq(50.0)

        outcome = json.dig('breakdowns', 'outcome')
        expect(outcome).to include(
          { 'status' => 'won', 'label' => 'Won', 'count' => 1, 'percentage' => 33.3, 'color' => '#16A34A' },
          { 'status' => 'open', 'label' => 'Open', 'count' => 1, 'percentage' => 33.3, 'color' => '#334155' },
          { 'status' => 'lost', 'label' => 'Lost', 'count' => 1, 'percentage' => 33.3, 'color' => '#DC2626' }
        )
      end
    end

    context 'TC-006 e TC-007: distribuição por responsável (users.name e fallback)' do
      let(:sales_user_without_name) do
        create(:user, company: tenant_company, role: :company, name: nil, email: 'semnome@tenant.com')
      end

      before do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead do Alpha',
          status: 'open',
          temperature: 'warm',
          value_cents: 100_000
        )
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user_without_name,
          name: 'Lead do Sem Nome',
          status: 'open',
          temperature: 'warm',
          value_cents: 200_000
        )
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: nil,
          name: 'Lead Desatribuído',
          status: 'open',
          temperature: 'cold',
          value_cents: 50_000
        )
      end

      it 'usa users.name quando presente, email como fallback, e Sem responsável para órfãos' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        assignees = json.dig('breakdowns', 'assignee')
        labels = assignees.map { |a| a['label'] }

        expect(labels).to include('Vendedor Alpha')
        expect(labels).to include('semnome@tenant.com')
        expect(labels).to include('Sem responsável')
      end
    end

    context 'TC-008 e TC-009: agrupamento temporal semana vs mês' do
      before do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead Semana Passada',
          status: 'open',
          temperature: 'hot',
          value_cents: 100_000,
          created_at: 10.days.ago
        )
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead Hoje',
          status: 'open',
          temperature: 'hot',
          value_cents: 100_000,
          created_at: Time.current
        )
      end

      it 'TC-008: exibe labels distintos para agrupamento semanal' do
        get '/api/v1/sales/opportunities/analytics', params: { group_by: 'week' }, headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        series = json['time_series']
        expect(series.size).to be >= 1
        expect(series.first).to have_key('period_label')
        expect(series.first).to have_key('start_date')
        expect(series.first).to have_key('quantity')
        expect(series.first).to have_key('value_cents')
      end

      it 'TC-009: exibe labels mensais formatados' do
        get '/api/v1/sales/opportunities/analytics', params: { group_by: 'month' }, headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        series = json['time_series']
        expect(series.size).to be >= 1
        expect(series.first['period_label']).to match(/[a-z]{3}\s\d{2}/)
      end
    end

    context 'TC-010 e TC-011: filtro por pipeline específico' do
      let!(:opp_a) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Lead em A',
          status: 'open',
          temperature: 'warm',
          value_cents: 500_000
        )
      end
      let!(:opp_b) do
        tenant_account.opportunities.create!(
          pipeline: pipeline_b,
          stage: stage_b1,
          owner: sales_user,
          name: 'Lead em B',
          status: 'open',
          temperature: 'warm',
          value_cents: 800_000
        )
      end

      it 'TC-010: retorna apenas oportunidades do Pipeline A quando especificado' do
        get '/api/v1/sales/opportunities/analytics', params: { pipeline_id: pipeline_a.id }, headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json.dig('summary', 'total_leads')).to eq(1)
        expect(json.dig('summary', 'total_value_cents')).to eq(500_000)
      end

      it 'TC-011: retorna apenas oportunidades do Pipeline B quando especificado' do
        get '/api/v1/sales/opportunities/analytics', params: { pipeline_id: pipeline_b.id }, headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json.dig('summary', 'total_leads')).to eq(1)
        expect(json.dig('summary', 'total_value_cents')).to eq(800_000)
      end
    end

    context 'TC-012: isolamento multi-tenant (TenantScope)' do
      let!(:outside_opp) do
        other_tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: other_user,
          name: 'Lead de Outro Tenant',
          status: 'open',
          temperature: 'hot',
          value_cents: 99_000_000
        )
      end

      it 'não vaza dados do tenant alheio para o usuário do tenant corrente' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        expect(json.dig('summary', 'total_leads')).to eq(0)
        expect(json.dig('summary', 'total_value_cents')).to eq(0)

        assignee_labels = json.dig('breakdowns', 'assignee').map { |a| a['label'] }
        expect(assignee_labels).not_to include('Outro Usuário')
      end
    end

    context 'TC-017 e TC-018: agregação de produtos sem duplicação' do
      let!(:product) { Sales::Product.create!(name: 'Painel 550W', sku: 'PNL-550') }
      let!(:opp_with_multiple_items) do
        opp = tenant_account.opportunities.create!(
          pipeline: pipeline_a,
          stage: stage_a1,
          owner: sales_user,
          name: 'Projeto com 2 itens do mesmo produto',
          status: 'open',
          temperature: 'hot',
          value_cents: 1_000_000
        )
        Sales::OpportunityLineItem.create!(opportunity: opp, product: product, quantity: 10, unit_price_cents: 50_000)
        Sales::OpportunityLineItem.create!(opportunity: opp, product: product, quantity: 5, unit_price_cents: 50_000)
        opp
      end

      it 'conta a oportunidade apenas uma vez por produto via COUNT(DISTINCT)' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(response).to have_http_status(:ok)
        products = json.dig('breakdowns', 'product')
        panel = products.find { |p| p['label'] == 'Painel 550W' }

        expect(panel).not_to be_nil
        expect(panel['count']).to eq(1)
        expect(panel['percentage']).to eq(100.0)
      end
    end

    context 'TC-021 e TC-022: garantia de integridade SQL e schema' do
      it 'não levanta PG::GroupingError nem PG::UndefinedColumn' do
        expect {
          get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)
        }.not_to raise_error

        expect(response).to have_http_status(:ok)
      end
    end

    context 'TC-023: conformidade estrita com o contrato JSON do PRD' do
      it 'retorna todas as chaves obrigatórias de summary, time_series e breakdowns' do
        get '/api/v1/sales/opportunities/analytics', headers: headers_for(sales_user)

        expect(json.keys).to contain_exactly('summary', 'time_series', 'breakdowns')
        expect(json['summary'].keys).to contain_exactly(
          'total_leads', 'total_value_cents', 'total_value_formatted',
          'avg_value_cents', 'avg_value_formatted', 'avg_time_open_days', 'win_rate_percentage'
        )
        expect(json['breakdowns'].keys).to contain_exactly(
          'assignee', 'stage', 'product', 'outcome', 'source',
          'competitor', 'tag', 'territory', 'age', 'value_bracket', 'channel'
        )
      end
    end
  end
end

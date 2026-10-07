require 'rails_helper'

RSpec.describe 'Acesso a leads da empresa selecionada', type: :request do
  let(:plan) do
    Plan.create!(name: 'Pro Leads Regression', price: 99, features_json: {})
  end
  let(:company) { create(:company, plan: plan, status: 'active') }
  let(:primary_company) { create(:company, plan: nil, status: 'active') }
  let(:user) do
    create(:user, role: 'company', company: primary_company, status: :active, confirmed_at: Time.current)
  end
  let(:headers) do
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 1.hour.from_now.to_i },
                       Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  before do
    create(:company_member, company: company, user: user, role: 'owner', status: 'active')
  end

  it 'retorna leads diretos e distribuídos da empresa Pro selecionada, sem duplicatas' do
    direct = create(:lead, company: company)
    distributed = create(:lead, company: nil)
    create(:lead_distribution, lead: direct, company: company, status: 'sent')
    create(:lead_distribution, lead: distributed, company: company, status: 'sent')
    create(:lead, company: nil)

    get '/api/v1/dashboard/leads', params: { company_id: company.id }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['data'].pluck('id')).to match_array([direct.id, distributed.id])
  end

  it 'aceita membro com identidade de consumidor' do
    user.update!(role: 'review')
    get '/api/v1/dashboard/leads', params: { company_id: company.id }, headers: headers
    expect(response).to have_http_status(:ok)
  end

  it 'rejeita empresa fora dos vínculos do usuário' do
    outsider = create(:company, plan: plan)
    get '/api/v1/dashboard/leads', params: { company_id: outsider.id }, headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'mantém bloqueio server-side para empresa sem direito a leads' do
    company.update!(plan: nil)
    get '/api/v1/dashboard/leads', params: { company_id: company.id }, headers: headers
    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body['feature']).to eq('leads_marketplace')
  end

  it 'respeita uma desativação explícita no plano Pro' do
    plan.update!(features_json: { leads_marketplace: false })
    get '/api/v1/dashboard/leads', params: { company_id: company.id }, headers: headers
    expect(response).to have_http_status(:forbidden)
  end

  it 'usa o mesmo entitlement no mercado mesmo quando o status legado diverge' do
    company.update!(plan_status: 'trialing')
    expect(company.has_paid_plan?).to be(false)
    expect(company.entitled?(:leads_marketplace)).to be(true)

    get '/api/v1/company_dashboard/market_insights', params: { company_id: company.id }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['is_premium']).to be(true)
  end

  it 'contabiliza a distribuição e não revela contatos de oportunidades de outras empresas' do
    category = company.categories.first
    distributed = create(:lead, company: nil, category: category)
    create(:lead_distribution, lead: distributed, company: company, status: 'sent')
    other = create(:lead, company: nil, category: category)

    get '/api/v1/company_dashboard/market_insights', params: { company_id: company.id }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('stats', 'my_leads_count')).to eq(1)
    opportunities = response.parsed_body['opportunities']
    expect(opportunities.pluck('id')).to eq([other.id])
    expect(opportunities.first.keys).not_to include('name', 'email', 'phone')
  end
end

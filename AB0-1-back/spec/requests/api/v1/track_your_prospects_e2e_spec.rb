# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Track Your Prospects End-to-End Cycle', type: :request do
  let(:company) do
    create(
      :company,
      website: 'https://solarparceiro.com.br',
      cta_primary_url: 'https://solarparceiro.com.br/orcamento'
    )
  end
  let(:other_company) do
    create(
      :company,
      website: 'https://concorrente-solar.com.br'
    )
  end

  let(:company_user) { create(:user, role: 'company', status: :active, company: company) }
  let(:other_user) { create(:user, role: 'company', status: :active, company: other_company) }

  let!(:site) do
    Sales::TrackingSite.create!(
      company: company,
      active: true,
      allowed_origins: ['https://solarparceiro.com.br']
    )
  end

  let(:origin_headers) { { 'Origin' => 'https://solarparceiro.com.br' } }
  let(:script_url) { "/api/v1/public/sales/tracking/#{site.public_key}.js" }
  let(:sessions_url) { "/api/v1/public/sales/tracking/#{site.public_key}/sessions" }
  let(:events_url) { "/api/v1/public/sales/tracking/#{site.public_key}/events" }

  before do
    create(:company_member, company: company, user: company_user, role: :owner, status: 'active')
    create(:company_member, company: other_company, user: other_user, role: :owner, status: 'active')
  end

  around do |example|
    prev = ENV['TRACK_PROSPECTS_ENABLED']
    ENV['TRACK_PROSPECTS_ENABLED'] = 'true'
    example.run
  ensure
    ENV['TRACK_PROSPECTS_ENABLED'] = prev
  end

  it 'executa o ciclo completo ponta a ponta: Outbound Click -> Tag Script -> Sessão com Consentimento -> Eventos -> Dashboard -> Jornada -> Tag Health -> CSV' do
    # -------------------------------------------------------------------------
    # ETAPA 1: Usuário clica no marketplace Avalia Solar (Outbound Redirect)
    # -------------------------------------------------------------------------
    get '/api/v1/outbound/redirect', params: {
      company_id: company.id,
      source_context: 'profile',
      destination_type: 'website'
    }, headers: {
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0',
      'REMOTE_ADDR' => '198.51.100.42'
    }

    expect(response).to have_http_status(:found)
    redirect_location = response.headers['Location']
    expect(redirect_location).to start_with('https://solarparceiro.com.br')
    expect(redirect_location).to include('as_click_id=')

    outbound_click = OutboundClick.last
    expect(outbound_click).to be_present
    expect(outbound_click.company_id).to eq(company.id)
    expect(outbound_click.source_context).to eq('profile')
    expect(outbound_click.destination_type).to eq('website')
    # Proteção de privacidade: IP e User-Agent são anonimizados com hash SHA256
    expect(outbound_click.ip_hash).to be_present
    expect(outbound_click.ip_hash).not_to include('198.51.100.42')

    as_click_id = CGI.parse(URI.parse(redirect_location).query)['as_click_id']&.first
    expect(as_click_id).to be_present

    # -------------------------------------------------------------------------
    # ETAPA 2: Tag JS V2 é servida para o site do parceiro
    # -------------------------------------------------------------------------
    get script_url, headers: origin_headers
    expect(response).to have_http_status(:ok)
    expect(response.content_type).to include('application/javascript')
    expect(response.body).to include('cleanClickIdFromUrl')
    expect(response.body).to include('form_submitted')

    # -------------------------------------------------------------------------
    # ETAPA 3: Telemetria da Tag — Início de Sessão com Atribuição e Consentimento LGPD
    # -------------------------------------------------------------------------
    post sessions_url,
         params: {
           session: {
             landing_path: '/orcamento',
             as_click_id: as_click_id,
             consent_state: 'granted',
             utm_source: 'avalia_marketplace'
           }
         },
         headers: origin_headers

    expect(response).to have_http_status(:created)
    session_json = JSON.parse(response.body)
    expect(session_json['attributed']).to be(true)
    expect(session_json['consent_state']).to eq('granted')

    tracking_session = Sales::TrackingSession.find_by!(session_id: session_json['session_id'])
    expect(tracking_session.outbound_click_id).to eq(outbound_click.id)
    expect(tracking_session.consent_state).to eq('granted')
    expect(tracking_session.company_id).to eq(company.id)

    # -------------------------------------------------------------------------
    # ETAPA 4: Telemetria da Tag — Formulário observado
    # -------------------------------------------------------------------------
    post events_url,
         params: {
           event: {
             session_id: tracking_session.session_id,
             event_uuid: SecureRandom.uuid,
             event_name: 'form_submitted',
             path: '/orcamento'
           }
         },
         headers: origin_headers

    expect(response).to have_http_status(:accepted)

    # -------------------------------------------------------------------------
    # ETAPA 5: Telemetria da Tag — Lead confirmado (Conversão final)
    # -------------------------------------------------------------------------
    post events_url,
         params: {
           event: {
             session_id: tracking_session.session_id,
             event_uuid: SecureRandom.uuid,
             event_name: 'lead_confirmed',
             path: '/obrigado'
           }
         },
         headers: origin_headers

    expect(response).to have_http_status(:accepted)
    expect(tracking_session.events.count).to eq(2)

    # -------------------------------------------------------------------------
    # ETAPA 6: Consulta ao Dashboard de Prospects da Empresa Autenticada
    # -------------------------------------------------------------------------
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(company_user)

    get '/api/v1/company_dashboard/analytics/prospects', params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    dashboard_data = JSON.parse(response.body)
    expect(dashboard_data['status']).to eq('ready')
    expect(dashboard_data['summary']['clicks']).to eq(1)
    expect(dashboard_data['summary']['verified_landings']).to eq(1)
    expect(dashboard_data['summary']['confirmed_conversions']).to eq(1)
    expect(dashboard_data['summary']['landing_rate']).to eq(100.0)
    expect(dashboard_data['summary']['conversion_rate']).to eq(100.0)

    record = dashboard_data['records'].first
    expect(record['id']).to eq(outbound_click.id)
    expect(record['evidence_status']).to eq('lead_confirmed')
    expect(record['session_id']).to eq(tracking_session.session_id)

    # -------------------------------------------------------------------------
    # ETAPA 7: Consulta à Jornada Detalhada (Timeline de Etapas)
    # -------------------------------------------------------------------------
    get "/api/v1/company_dashboard/analytics/prospects/journey/#{outbound_click.id}", params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    journey_data = JSON.parse(response.body)
    expect(journey_data['click_id']).to eq(outbound_click.id)
    steps = journey_data['timeline'].map { |t| t['step'] }
    expect(steps).to include('outbound_click', 'landing_verified', 'form_submitted', 'lead_confirmed')

    # -------------------------------------------------------------------------
    # ETAPA 8: Diagnóstico de Saúde da Tag (Tag Health Monitor)
    # -------------------------------------------------------------------------
    get '/api/v1/company_dashboard/analytics/prospects/health', params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    health_data = JSON.parse(response.body)
    expect(health_data['configured']).to be(true)
    expect(health_data['active']).to be(true)
    expect(health_data['status']).to eq('healthy')
    expect(health_data['events_last_24h']).to eq(2)
    expect(health_data['sessions_last_7d']).to eq(1)
    expect(health_data['consent_grant_rate']).to eq(100.0)
    expect(health_data['validated_https_origins']).to be(true)

    # -------------------------------------------------------------------------
    # ETAPA 9: Exportação de Relatório CSV Sanitizado
    # -------------------------------------------------------------------------
    get '/api/v1/company_dashboard/analytics/prospects/export', params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    expect(response.headers['Content-Type']).to include('text/csv')
    csv_body = response.body
    expect(csv_body).to start_with("\uFEFF") # UTF-8 BOM
    expect(csv_body).to include(outbound_click.id)
    expect(csv_body).to include('Perfil no Marketplace')
    expect(csv_body).to include('Lead confirmado')

    # -------------------------------------------------------------------------
    # ETAPA 10: Multi-tenancy — Usuário de outra empresa não acessa nem enxerga telemetria
    # -------------------------------------------------------------------------
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(other_user)

    # Tentativa de consultar a jornada da primeira empresa
    get "/api/v1/company_dashboard/analytics/prospects/journey/#{outbound_click.id}", params: { company_id: other_company.id }
    expect(response).to have_http_status(:not_found)

    # Dashboard da outra empresa deve estar vazio
    get '/api/v1/company_dashboard/analytics/prospects', params: { company_id: other_company.id }
    expect(response).to have_http_status(:ok)
    other_dashboard = JSON.parse(response.body)
    expect(other_dashboard['summary']['clicks']).to eq(0)
    expect(other_dashboard['records']).to be_empty
  end
end

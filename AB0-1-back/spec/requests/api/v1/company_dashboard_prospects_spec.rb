# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard Prospects API', type: :request do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  describe 'GET /api/v1/company_dashboard/analytics/prospects' do
    it 'retorna status tag_not_installed quando não há site configurado' do
      get '/api/v1/company_dashboard/analytics/prospects', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['status']).to eq('tag_not_installed')
      expect(payload['summary']['clicks']).to eq(0)
      expect(payload['tag_info']['configured']).to be(false)
    end

    it 'calcula telemetria verídica quando há cliques e sessões vinculadas' do
      Sales::TrackingSite.create!(company: company, active: true, allowed_origins: ['https://exemplo.com.br'])

      click = company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://exemplo.com.br/energia',
        clicked_at: 2.days.ago,
        click_token_signature: 'sig-test-123'
      )

      session = Sales::TrackingSession.create!(
        company: company,
        outbound_click: click,
        session_id: SecureRandom.uuid,
        consent_state: 'granted',
        traffic_class: 'direct',
        started_at: 2.days.ago
      )

      Sales::TrackingEvent.create!(
        session: session,
        company: company,
        event_uuid: SecureRandom.uuid,
        event_name: 'lead_confirmed',
        path: '/obrigado',
        occurred_at: 2.days.ago + 5.minutes
      )

      get '/api/v1/company_dashboard/analytics/prospects', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['status']).to eq('ready')
      expect(payload['summary']['clicks']).to eq(1)
      expect(payload['summary']['verified_landings']).to eq(1)
      expect(payload['summary']['confirmed_conversions']).to eq(1)
      expect(payload['summary']['landing_rate']).to eq(100.0)
      expect(payload['summary']['conversion_rate']).to eq(100.0)
      expect(payload['records'].length).to eq(1)
      expect(payload['records'].first['evidence_status']).to eq('lead_confirmed')
      expect(payload['tag_info']['status']).to eq('healthy')
    end

    it 'isola dados entre empresas e não vaza cliques de outros tenants' do
      other_company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://outraempresa.com.br',
        clicked_at: 1.day.ago,
        click_token_signature: 'other-sig'
      )

      get '/api/v1/company_dashboard/analytics/prospects', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['summary']['clicks']).to eq(0)
      expect(payload['records']).to be_empty
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/prospects/journey/:id' do
    let!(:click) do
      company.outbound_clicks.create!(
        source_context: 'compare',
        destination_type: 'website',
        target_url: 'https://parceiro.com.br/orcamento',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-compare'
      )
    end

    it 'retorna timeline completa com etapas de clique e landing' do
      Sales::TrackingSite.create!(company: company, active: true, allowed_origins: ['https://parceiro.com.br'])
      session = Sales::TrackingSession.create!(
        company: company,
        outbound_click: click,
        session_id: SecureRandom.uuid,
        started_at: 1.day.ago + 1.minute
      )

      Sales::TrackingEvent.create!(
        session: session,
        company: company,
        event_uuid: SecureRandom.uuid,
        event_name: 'form_submitted',
        path: '/contato',
        occurred_at: 1.day.ago + 2.minutes
      )

      get "/api/v1/company_dashboard/analytics/prospects/journey/#{click.id}", params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['click_id']).to eq(click.id)
      expect(payload['timeline'].length).to eq(3)
      expect(payload['timeline'][0]['step']).to eq('outbound_click')
      expect(payload['timeline'][1]['step']).to eq('landing_verified')
      expect(payload['timeline'][2]['step']).to eq('form_submitted')
    end

    it 'retorna 404 quando o clique pertence a outro tenant' do
      other_click = other_company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://outro.com.br',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-other'
      )

      get "/api/v1/company_dashboard/analytics/prospects/journey/#{other_click.id}", params: { company_id: company.id }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/prospects/export' do
    it 'exporta CSV com sanitização contra fórmula injection' do
      account = Sales::Account.create!(company: company, owner: user, name: '=2+5')
      click = company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://exemplo.com.br/teste',
        clicked_at: Time.current,
        click_token_signature: 'sig-inj'
      )
      Sales::TrackingSession.create!(
        company: company,
        account: account,
        outbound_click: click,
        session_id: SecureRandom.uuid,
        started_at: Time.current
      )

      get '/api/v1/company_dashboard/analytics/prospects/export', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to include('text/csv')
      expect(response.body).to include("'=2+5") # Deve estar sanitizado com aspas simples
      expect(response.body).to include('ID do Clique,Data/Hora (ISO8601)')
    end
  end

  describe 'PATCH /api/v1/company_dashboard/analytics/prospects/settings' do
    it 'salva origens permitidas HTTPS e configurações de integração' do
      patch '/api/v1/company_dashboard/analytics/prospects/settings',
            params: {
              company_id: company.id,
              allowed_origins: ['https://meusite.com.br', 'http://inseguro.com.br'], # http inseguro deve ser filtrado
              active: true,
              settings: {
                ga4: { measurement_id: 'G-12345678XX' },
                custom_ids: { enabled: true }
              }
            }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['status']).to eq('success')
      expect(payload['tag_info']['allowed_origins']).to eq(['https://meusite.com.br'])
      expect(payload['tag_info']['settings']['ga4']['measurement_id']).to eq('G-12345678XX')
      expect(payload['tag_info']['settings']['custom_ids']['enabled']).to be(true)

      site = Sales::TrackingSite.find_by(company: company)
      expect(site.allowed_origins).to eq(['https://meusite.com.br'])
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/prospects/health' do
    it 'retorna diagnóstico de saúde da tag e validação de origens HTTPS' do
      Sales::TrackingSite.create!(
        company: company,
        active: true,
        allowed_origins: ['https://empresa.com.br'],
        settings: { ga4: { measurement_id: 'G-HEALTH123' } }
      )

      get '/api/v1/company_dashboard/analytics/prospects/health', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['configured']).to be(true)
      expect(payload['active']).to be(true)
      expect(payload['status']).to eq('configured_no_evidence')
      expect(payload['validated_https_origins']).to be(true)
      expect(payload['settings']['ga4']['measurement_id']).to eq('G-HEALTH123')
    end

    it 'retorna 403 se o usuário não tiver permissão para visualizar o dashboard da empresa' do
      allow_any_instance_of(CompanyPolicy).to receive(:view_dashboard?).and_return(false)

      get '/api/v1/company_dashboard/analytics/prospects/health', params: { company_id: company.id }

      expect(response).to have_http_status(:forbidden)
    end
  end
end

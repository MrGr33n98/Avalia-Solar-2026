# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public Sales Tracking V2 - Consent, Attribution & Privacy', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }

  let!(:site) do
    Sales::TrackingSite.create!(
      company: company,
      allowed_origins: ['https://www.parceiro-solar.example']
    )
  end

  let!(:other_site) do
    Sales::TrackingSite.create!(
      company: other_company,
      allowed_origins: ['https://www.outro-parceiro.example']
    )
  end

  let(:origin_headers) { { 'Origin' => 'https://www.parceiro-solar.example' } }
  let(:sessions_url) { "/api/v1/public/sales/tracking/#{site.public_key}/sessions" }
  let(:events_url) { "/api/v1/public/sales/tracking/#{site.public_key}/events" }
  let(:script_url) { "/api/v1/public/sales/tracking/#{site.public_key}.js" }

  let!(:outbound_click_and_token) do
    click = company.outbound_clicks.build(
      source_context: 'profile',
      destination_type: 'website',
      target_url: 'https://www.parceiro-solar.example/landing',
      clicked_at: Time.current,
      click_token_signature: 'temporary'
    )
    click.id = SecureRandom.uuid
    token = OutboundTokenService.encode(
      company_id: company.id,
      source_context: 'profile',
      outbound_click_id: click.id
    )
    _payload, signature = token.split('.')
    click.click_token_signature = signature
    click.save!
    [click, token]
  end

  let(:outbound_click) { outbound_click_and_token[0] }
  let(:valid_token) { outbound_click_and_token[1] }

  describe 'GET /api/v1/public/sales/tracking/:public_key.js (ScriptRenderer V2)' do
    it 'retorna o script de rastreamento com headers adequados e API consent-aware' do
      get script_url, headers: origin_headers

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('application/javascript')
      expect(response.headers['Cache-Control']).to include('max-age=300')
      expect(response.headers['Cache-Control']).to include('public')

      script_body = response.body
      expect(script_body).to include('window.avaliaTrack = track')
      expect(script_body).to include('track.version = \'2.0\'')
      expect(script_body).to include('track.grantConsent')
      expect(script_body).to include('track.revokeConsent')
      expect(script_body).to include('cleanClickIdFromUrl')
      expect(script_body).to include('form_submitted')
      expect(script_body).not_to include('password')
      expect(script_body).not_to include('value')
    end
  end

  describe 'POST /api/v1/public/sales/tracking/:public_key/sessions (Atribuição e Consentimento)' do
    context 'com token as_click_id válido e consentimento concedido' do
      it 'associa a sessão ao OutboundClick correto e registra hash e consent_state' do
        post sessions_url,
             params: {
               session: {
                 landing_path: '/landing',
                 as_click_id: valid_token,
                 consent_state: 'granted',
                 utm_source: 'avalia_marketplace'
               }
             },
             headers: origin_headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['attributed']).to be(true)
        expect(json['consent_state']).to eq('granted')

        session = Sales::TrackingSession.find_by!(session_id: json['session_id'])
        expect(session.company_id).to eq(company.id)
        expect(session.outbound_click_id).to eq(outbound_click.id)
        expect(session.as_click_id_hash).to be_present
        expect(session.as_click_id_hash.length).to eq(64)
        expect(session.consent_state).to eq('granted')
      end
    end

    context 'com token as_click_id inválido ou adulterado' do
      it 'rejeita atribuição fraudulenta mas cria sessão anônima sem vínculo relacional' do
        tampered_token = "#{valid_token}invalido"

        post sessions_url,
             params: {
               session: {
                 landing_path: '/landing',
                 as_click_id: tampered_token,
                 consent_state: 'granted'
               }
             },
             headers: origin_headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['attributed']).to be(false)

        session = Sales::TrackingSession.find_by!(session_id: json['session_id'])
        expect(session.outbound_click_id).to be_nil
        expect(session.as_click_id_hash).to be_nil
      end
    end

    context 'com token as_click_id expirado' do
      it 'não associa sessão quando token ultrapassou o TTL' do
        expired_token = OutboundTokenService.encode(
          company_id: company.id,
          source_context: 'profile',
          outbound_click_id: outbound_click.id,
          ttl: -1.hour
        )

        post sessions_url,
             params: {
               session: {
                 landing_path: '/landing',
                 as_click_id: expired_token,
                 consent_state: 'granted'
               }
             },
             headers: origin_headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['attributed']).to be(false)

        session = Sales::TrackingSession.find_by!(session_id: json['session_id'])
        expect(session.outbound_click_id).to be_nil
      end
    end

    context 'com tentativa de ataque Cross-Tenant (token de Empresa B em site de Empresa A)' do
      it 'bloqueia correlação e preserva isolamento estrito de dados multi-tenant' do
        other_click = other_company.outbound_clicks.build(
          source_context: 'profile',
          destination_type: 'website',
          target_url: 'https://www.outro-parceiro.example/promo',
          clicked_at: Time.current,
          click_token_signature: 'temporary'
        )
        other_click.id = SecureRandom.uuid
        other_token = OutboundTokenService.encode(
          company_id: other_company.id,
          source_context: 'profile',
          outbound_click_id: other_click.id
        )
        _p, sig = other_token.split('.')
        other_click.click_token_signature = sig
        other_click.save!

        # Envia token da outra empresa para a tag da company
        post sessions_url,
             params: {
               session: {
                 landing_path: '/landing',
                 as_click_id: other_token,
                 consent_state: 'granted'
               }
             },
             headers: origin_headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['attributed']).to be(false)

        session = Sales::TrackingSession.find_by!(session_id: json['session_id'])
        expect(session.company_id).to eq(company.id)
        expect(session.outbound_click_id).to be_nil
        expect(session.as_click_id_hash).to be_nil
      end
    end

    context 'com consent_state = denied' do
      it 'não associa as_click_id mesmo que o token seja matematicamente válido' do
        post sessions_url,
             params: {
               session: {
                 landing_path: '/landing',
                 as_click_id: valid_token,
                 consent_state: 'denied'
               }
             },
             headers: origin_headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['attributed']).to be(false)
        expect(json['consent_state']).to eq('denied')

        session = Sales::TrackingSession.find_by!(session_id: json['session_id'])
        expect(session.outbound_click_id).to be_nil
        expect(session.consent_state).to eq('denied')
      end
    end
  end

  describe 'POST /api/v1/public/sales/tracking/:public_key/events (Ciclo de Vida do Consentimento)' do
    let(:session) do
      Sales::TrackingSession.create!(
        company: company,
        session_id: SecureRandom.uuid,
        started_at: Time.current,
        consent_state: 'granted',
        outbound_click: outbound_click
      )
    end

    it 'persiste evento aceito quando consentimento está granted' do
      post events_url,
           params: {
             event: {
               session_id: session.session_id,
               event_uuid: SecureRandom.uuid,
               event_name: 'page_view',
               path: '/produtos',
               properties: { categoria: 'inversores' }
             }
           },
           headers: origin_headers

      expect(response).to have_http_status(:accepted)
      expect(session.events.where(event_name: 'page_view')).to exist
    end

    it 'atualiza sessão para denied ao receber consent_revoked e interrompe coleta de eventos subsequentes' do
      # 1. Revoga consentimento
      post events_url,
           params: {
             event: {
               session_id: session.session_id,
               event_uuid: SecureRandom.uuid,
               event_name: 'consent_revoked',
               path: '/privacidade',
               properties: {}
             }
           },
           headers: origin_headers

      expect(response).to have_http_status(:accepted)
      expect(session.reload.consent_state).to eq('denied')

      # 2. Tentativa de enviar novo evento após revogação deve ser descartada (LGPD)
      post events_url,
           params: {
             event: {
               session_id: session.session_id,
               event_uuid: SecureRandom.uuid,
               event_name: 'page_view',
               path: '/outra-pagina',
               properties: {}
             }
           },
           headers: origin_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['accepted']).to be(false)
      expect(json['reason']).to eq('consent_denied')
      expect(session.events.where(path: '/outra-pagina')).to be_empty
    end

    it 'sanitiza propriedades prevenindo PII ou injeção de campos maliciosos' do
      post events_url,
           params: {
             event: {
               session_id: session.session_id,
               event_uuid: SecureRandom.uuid,
               event_name: 'form_submitted',
               path: '/contato',
               properties: {
                 form_id: 'contact_form',
                 email: 'cliente@secreto.com',
                 password: 'super_secret_password',
                 phone: '+5511999999999'
               }
             }
           },
           headers: origin_headers

      expect(response).to have_http_status(:accepted)
      event = session.events.find_by!(event_name: 'form_submitted')
      expect(event.properties['form_id']).to eq('contact_form')
      expect(event.properties).not_to have_key('email')
      expect(event.properties).not_to have_key('password')
      expect(event.properties).not_to have_key('phone')
    end
  end
end

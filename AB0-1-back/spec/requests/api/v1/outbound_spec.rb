# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Outbound', type: :request do
  let(:company) do
    create(
      :company,
      website: 'https://empresa-solar.com.br',
      cta_primary_url: 'https://contato.empresa-solar.com.br/orcamento',
      cta_secondary_url: 'https://empresa-solar.com.br/contato'
    )
  end

  describe 'GET /api/v1/outbound/redirect' do
    context 'validações de entrada e tratamento de erros' do
      it 'retorna 400 Bad Request quando company_id não é fornecido' do
        get '/api/v1/outbound/redirect'

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['code']).to eq('COMPANY_ID_REQUIRED')
      end

      it 'retorna 404 Not Found quando empresa não existe' do
        get '/api/v1/outbound/redirect', params: { company_id: 999_999_999 }

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['code']).to eq('COMPANY_NOT_FOUND')
      end

      it 'retorna 422 Unprocessable Entity quando target_url não pertence às origens autorizadas da empresa (Anti-Open-Redirect)' do
        get '/api/v1/outbound/redirect', params: {
          company_id: company.id,
          target_url: 'https://phishing-solar.com/roubo-credenciais'
        }

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['code']).to eq('UNAUTHORIZED_DESTINATION_URL')
      end
    end

    context 'com feature flag desativada (padrão: TRACK_PROSPECTS_ENABLED=false)' do
      around do |example|
        prev = ENV['TRACK_PROSPECTS_ENABLED']
        ENV['TRACK_PROSPECTS_ENABLED'] = 'false'
        example.run
      ensure
        ENV['TRACK_PROSPECTS_ENABLED'] = prev
      end

      it 'executa redirect 302 direto para URL oficial da empresa sem token e sem criar registro' do
        expect do
          get '/api/v1/outbound/redirect', params: { company_id: company.id }
        end.not_to change(OutboundClick, :count)

        expect(response).to have_http_status(:found)
        expect(response).to redirect_to('https://empresa-solar.com.br')
        expect(response.headers['Location']).not_to include('as_click_id')
      end
    end

    context 'com feature flag ativada (TRACK_PROSPECTS_ENABLED=true)' do
      around do |example|
        prev = ENV['TRACK_PROSPECTS_ENABLED']
        ENV['TRACK_PROSPECTS_ENABLED'] = 'true'
        example.run
      ensure
        ENV['TRACK_PROSPECTS_ENABLED'] = prev
      end

      it 'registra OutboundClick e redireciona com token assinado as_click_id' do
        expect do
          get '/api/v1/outbound/redirect', params: {
            company_id: company.id,
            source_context: 'profile',
            destination_type: 'website'
          }, headers: {
            'User-Agent' => 'Mozilla/5.0 TestBrowser',
            'REMOTE_ADDR' => '203.0.113.195'
          }
        end.to change(OutboundClick, :count).by(1)

        expect(response).to have_http_status(:found)
        location = response.headers['Location']
        expect(location).to start_with('https://empresa-solar.com.br')
        expect(location).to include('as_click_id=')

        click = OutboundClick.last
        expect(click.company_id).to eq(company.id)
        expect(click.source_context).to eq('profile')
        expect(click.destination_type).to eq('website')
        expect(click.target_url).to eq('https://empresa-solar.com.br')
        expect(click.click_token_signature).to be_present

        # Proteção de privacidade: não armazena IP bruto nem User-Agent bruto
        expect(click.ip_hash).to be_present
        expect(click.ip_hash).not_to include('203.0.113.195')
        expect(click.user_agent_hash).to be_present
        expect(click.user_agent_hash).not_to include('TestBrowser')

        # Validação do token assinado anexado na URL
        token = CGI.parse(URI.parse(location).query)['as_click_id']&.first
        expect(token).to be_present
        payload = OutboundTokenService.decode(token)
        expect(payload).to be_present
        expect(payload[:cid]).to eq(company.id)
        expect(payload[:src]).to eq('profile')
        expect(payload[:clk]).to eq(click.id)
        expect(payload).not_to have_key(:ip)
      end

      it 'garante idempotência em cliques com a mesma idempotency_key' do
        idempotency_key = "idemp-#{SecureRandom.hex(12)}"

        expect do
          2.times do
            get '/api/v1/outbound/redirect', params: {
              company_id: company.id,
              idempotency_key: idempotency_key
            }
          end
        end.to change(OutboundClick, :count).by(1)

        expect(response).to have_http_status(:found)
        expect(response.headers['Location']).to include('as_click_id=')
      end

      it 'aceita URLs customizadas válidas dentro do domínio autorizado' do
        custom_url = 'https://empresa-solar.com.br/produtos/inversores'

        get '/api/v1/outbound/redirect', params: {
          company_id: company.id,
          target_url: custom_url
        }

        expect(response).to have_http_status(:found)
        expect(response.headers['Location']).to start_with(custom_url)
      end
    end
  end
end

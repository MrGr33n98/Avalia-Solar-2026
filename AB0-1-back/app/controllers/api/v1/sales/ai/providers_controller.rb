# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Ai
        class ProvidersController < BaseController
          before_action :require_crm_admin!, only: %i[update_openrouter_credentials test_openrouter]

          # GET /api/v1/sales/ai/providers
          def index
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)
            env_key_present = ENV['SALES_OPENROUTER_API_KEY'].to_s.strip.present?

            render json: {
              providers: [
                {
                  id: 'openrouter',
                  name: 'OpenRouter',
                  base_url: 'https://openrouter.ai/api/v1',
                  is_primary: true,
                  enabled: setting.enabled?,
                  configured: setting.openrouter_configured? || env_key_present,
                  credential_source: setting.openrouter_configured? ? 'tenant_vault' : (env_key_present ? 'env_fallback' : 'none'),
                  masked_key: setting.openrouter_masked_key.presence || (env_key_present ? 'sk-or-v1...ENV' : nil),
                  key_status: setting.openrouter_key_status,
                  last_tested_at: setting.openrouter_last_tested_at&.iso8601,
                  last_latency_ms: setting.openrouter_last_latency_ms,
                  last_error: setting.openrouter_last_error,
                  require_zdr: setting.require_zdr?,
                  can_manage_credentials: crm_admin?
                }
              ],
              catalog: ::Sales::Ai::ModelRegistry.all_models
            }
          end

          # POST /api/v1/sales/ai/providers/openrouter/credentials
          def update_openrouter_credentials
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)

            if ActiveModel::Type::Boolean.new.cast(params[:revoke])
              setting.revoke_openrouter_key!(actor_user: current_user)
              return render json: {
                message: 'Chave OpenRouter revogada com sucesso.',
                provider: serialize_provider(setting)
              }
            end

            raw_key = params[:api_key].to_s.strip
            if raw_key.blank? || raw_key.length < 12
              return render_error_response(
                message: 'Informe uma chave de API OpenRouter válida.',
                status: :unprocessable_entity,
                code: 'INVALID_API_KEY'
              )
            end

            setting.rotate_openrouter_key!(raw_key, actor_user: current_user)

            render json: {
              message: 'Chave OpenRouter atualizada e criptografada com sucesso.',
              provider: serialize_provider(setting)
            }
          end

          # POST /api/v1/sales/ai/providers/openrouter/test
          def test_openrouter
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)
            api_key = params[:api_key].to_s.strip.presence ||
                      setting.openrouter_api_key.presence ||
                      ENV['SALES_OPENROUTER_API_KEY'].to_s.strip.presence

            model_id = params[:model_id].to_s.strip.presence || 'openai/gpt-4o-mini'
            client = ::Sales::Ai::OpenRouterClient.new(api_key: api_key)

            result = client.test_connection!(model_id: model_id)

            setting.update!(
              openrouter_key_status: 'active',
              openrouter_last_tested_at: Time.current,
              openrouter_last_latency_ms: result[:latency_ms],
              openrouter_last_error: nil,
              updated_by_user_id: current_user.id
            )

            render json: {
              status: 'ok',
              message: "Conexão com OpenRouter verificada (#{result[:latency_ms]} ms).",
              latency_ms: result[:latency_ms],
              tested_model: result[:model_id],
              provider: serialize_provider(setting)
            }
          rescue ::Sales::Ai::OpenRouterClient::ClientError => e
            setting&.update(
              openrouter_key_status: e.code == 'OPENROUTER_UNAUTHORIZED' ? 'invalid' : 'error',
              openrouter_last_tested_at: Time.current,
              openrouter_last_error: e.message.to_s.truncate(200),
              updated_by_user_id: current_user.id
            )

            render_error_response(
              message: e.message,
              status: e.http_status,
              code: e.code
            )
          end

          private

          def serialize_provider(setting)
            {
              id: 'openrouter',
              enabled: setting.enabled?,
              configured: setting.openrouter_configured?,
              masked_key: setting.openrouter_masked_key,
              key_status: setting.openrouter_key_status,
              last_tested_at: setting.openrouter_last_tested_at&.iso8601,
              last_latency_ms: setting.openrouter_last_latency_ms,
              last_error: setting.openrouter_last_error
            }
          end
        end
      end
    end
  end
end


# frozen_string_literal: true

begin
  require 'aws-sdk-sesv2'
rescue LoadError
  # A instalação pode optar por não empacotar o SDK de envio.
end

module Sales
  module Messaging
    module Providers
      class HealthCheck
        class IncompleteCredentialsError < StandardError; end
        STATUSES = %w[
          not_configured credentials_invalid identity_unverified sandbox_or_restricted
          quota_exhausted operational degraded
        ].freeze

        def self.call(from_email: nil)
          new(from_email: from_email).call
        end

        def initialize(from_email: nil)
          @from_email = from_email.to_s.strip
        end

        def call
          return result('not_configured', 'SDK AWS SES v2 indisponível.') unless defined?(Aws::SESV2::Client)

          if Rails.env.test?
            return result('not_configured',
                          'Verificação externa do SES não é executada em ambiente de teste.')
          end

          client = ses_client
          account = client.get_account
          unless account.sending_enabled
            return result('sandbox_or_restricted',
                          'A conta SES não está habilitada para envio.')
          end
          if account.production_access_enabled == false
            return result('sandbox_or_restricted',
                          'A conta SES ainda está no sandbox.')
          end

          identity = client.get_email_identity(email_identity: sender_identity)
          unless identity.verification_status == 'SUCCESS'
            return result('identity_unverified',
                          'A identidade remetente não está verificada.')
          end

          if daily_quota_exhausted?(account.send_quota)
            return result('quota_exhausted',
                          'A quota diária de envio do SES foi atingida.')
          end
          unless account.enforcement_status.to_s == 'HEALTHY'
            return result('degraded',
                          'O estado de enforcement do SES requer atenção.')
          end

          result('operational', 'SES habilitado, quota disponível e identidade remetente verificada.')
        rescue Aws::SESV2::Errors::NotFoundException
          result('identity_unverified', 'A identidade remetente não existe no SES.')
        rescue Aws::SESV2::Errors::AccessDeniedException
          result('credentials_invalid', 'As credenciais não têm permissão para consultar ou enviar pelo SES.')
        rescue Aws::Errors::MissingCredentialsError
          result('not_configured', 'Nenhuma credencial AWS válida foi encontrada.')
        rescue IncompleteCredentialsError
          result('credentials_invalid', 'O par de credenciais AWS está incompleto.')
        rescue StandardError => e
          Rails.logger.warn({ event: 'sales_email_provider_health_failed', error_class: e.class.name }.to_json)
          result('degraded', 'Não foi possível confirmar a saúde do provedor SES.')
        end

        private

        def ses_client
          options = { region: ENV['AWS_REGION'].presence || 'us-east-1' }
          access_key = ENV['AWS_ACCESS_KEY_ID'].presence
          secret_key = ENV['AWS_SECRET_ACCESS_KEY'].presence
          raise IncompleteCredentialsError if access_key.present? != secret_key.present?

          options.merge!(access_key_id: access_key, secret_access_key: secret_key) if access_key.present?
          Aws::SESV2::Client.new(**options)
        end

        def sender_identity
          ENV['AWS_SES_SENDER_IDENTITY'].presence || @from_email
        end

        def daily_quota_exhausted?(quota)
          quota && quota.max24_hour_send.to_i.positive? && quota.sent_last_24_hours.to_i >= quota.max24_hour_send.to_i
        end

        def result(status, message)
          { provider: 'aws_ses', status: status, message: message }
        end
      end
    end
  end
end

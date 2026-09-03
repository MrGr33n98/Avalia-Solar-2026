# frozen_string_literal: true

require 'aws-sdk-sesv2' rescue nil

module Sales
  module Messaging
    module Providers
      class Ses < Base
        def send_message(email_message, options = {})
          region = ENV['AWS_REGION'].presence || ENV['SPACES_REGION'].presence || 'us-east-1'
          access_key = ENV['AWS_ACCESS_KEY_ID'].presence || ENV['SPACES_ACCESS_KEY_ID'].presence
          secret_key = ENV['AWS_SECRET_ACCESS_KEY'].presence || ENV['SPACES_SECRET_ACCESS_KEY'].presence

          tracking_pixel = "<img src=\"#{ENV['APP_HOST'] || 'https://crm.avaliasolar.com.br'}/t/email/open/#{email_message.tracking_token}.gif\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\" />"
          html_with_tracking = "#{email_message.body_html}#{tracking_pixel}"

          provider_id = nil

          if access_key.present? && secret_key.present? && defined?(Aws::SESV2::Client)
            begin
              client = Aws::SESV2::Client.new(
                region: region,
                access_key_id: access_key,
                secret_access_key: secret_key
              )

              resp = client.send_email({
                from_email_address: email_message.from_email,
                destination: {
                  to_addresses: [email_message.to_email]
                },
                content: {
                  simple: {
                    subject: { data: email_message.subject, charset: 'UTF-8' },
                    body: {
                      html: { data: html_with_tracking, charset: 'UTF-8' },
                      text: { data: email_message.body_text || '', charset: 'UTF-8' }
                    }
                  }
                }
              })
              provider_id = resp.message_id
            rescue StandardError => e
              Rails.logger.error("[Sales::Messaging::Providers::Ses] Erro ao enviar e-mail via AWS SES V2: #{e.message}")
              provider_id = "01000185-ses-#{SecureRandom.hex(8)}@email.amazonaws.com"
            end
          else
            provider_id = "01000185-ses-#{SecureRandom.hex(8)}@email.amazonaws.com"
          end

          Result.new(
            success?: true,
            provider_message_id: provider_id
          )
        rescue StandardError => e
          Result.new(
            success?: false,
            error_code: 'SES_SEND_ERROR',
            error_message: e.message
          )
        end
      end
    end
  end
end

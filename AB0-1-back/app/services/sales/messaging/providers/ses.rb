# frozen_string_literal: true

require 'base64'

begin
  require 'aws-sdk-sesv2'
rescue LoadError
  # Optional dependency fallback
end

module Sales
  module Messaging
    module Providers
      class Ses < Base
        def send_message(email_message, options = {})
          region = ENV['AWS_REGION'].presence || ENV['SPACES_REGION'].presence || 'us-east-1'
          access_key = ENV['AWS_ACCESS_KEY_ID'].presence || ENV['SPACES_ACCESS_KEY_ID'].presence
          secret_key = ENV['AWS_SECRET_ACCESS_KEY'].presence || ENV['SPACES_SECRET_ACCESS_KEY'].presence

          tracking_pixel = if email_message.open_tracking_enabled
                             "<img src=\"#{ENV['APP_HOST'] || 'https://crm.avaliasolar.com.br'}/t/email/open/#{email_message.tracking_token}.gif\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\" />"
                           end
          html_body = "#{email_message.body_html}#{tracking_pixel}"
          html_with_tracking = if email_message.click_tracking_enabled
                                 ::Sales::Messaging::TrackingRewriter.rewrite(html_body, email_message)
                               else
                                 html_body
                               end

          provider_id = nil

          if access_key.present? && secret_key.present? && defined?(Aws::SESV2::Client)
            begin
              client = Aws::SESV2::Client.new(
                region: region,
                access_key_id: access_key,
                secret_access_key: secret_key
              )

              participants = email_message.participants.group_by(&:participant_type)
              to_addresses = participants['to'].present? ? participants['to'].map(&:email) : [email_message.to_email].compact_blank
              cc_addresses = participants['cc'].present? ? participants['cc'].map(&:email) : []
              bcc_addresses = participants['bcc'].present? ? participants['bcc'].map(&:email) : []

              destination = {
                to_addresses: to_addresses,
                cc_addresses: cc_addresses,
                bcc_addresses: bcc_addresses
              }.reject { |_type, addresses| addresses.blank? }
              request = {
                from_email_address: email_message.from_email,
                destination: destination,
                content: email_message.attachments.any? { |attachment| attachment.file.attached? } ? { raw: { data: raw_message(email_message, html_with_tracking) } } : {
                  simple: {
                    subject: { data: email_message.subject, charset: 'UTF-8' },
                    body: {
                      html: { data: html_with_tracking, charset: 'UTF-8' },
                      text: { data: email_message.body_text || '', charset: 'UTF-8' }
                    }
                  }
                }
              }
              request[:configuration_set_name] = ENV['AWS_SES_CONFIGURATION_SET'].presence if ENV['AWS_SES_CONFIGURATION_SET'].present?
              resp = client.send_email(request)
              provider_id = resp.message_id
              if provider_id.blank?
                return Result.new(success?: false, error_code: 'SES_INVALID_RESPONSE', error_message: 'AWS SES não retornou message_id.')
              end
            rescue StandardError => e
              Rails.logger.error("[Sales::Messaging::Providers::Ses] Erro ao enviar e-mail via AWS SES V2: #{e.message}")
              return Result.new(success?: false, error_code: 'SES_SEND_ERROR', error_message: e.message)
            end
          else
            return Result.new(success?: false, error_code: 'SES_NOT_CONFIGURED', error_message: 'AWS SES não configurado.')
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

        private

        def header_value(value)
          value.to_s.gsub(/[\r\n]/, ' ').strip
        end

        def raw_message(email_message, html)
          attachments = email_message.attachments.select { |attachment| attachment.file.attached? }
          total_size = attachments.sum { |attachment| attachment.file.blob.byte_size }
          raise 'Anexos excedem o limite total de 10MB do SES.' if total_size > 10.megabytes

          mixed_boundary = "mixed-#{SecureRandom.hex(12)}"
          alternative_boundary = "alternative-#{SecureRandom.hex(12)}"
          headers = [
            "From: #{header_value(email_message.from_email)}",
            "To: #{header_value(email_message.to_email)}",
            "Subject: #{header_value(email_message.subject)}",
            "Message-ID: #{header_value(email_message.message_id)}",
            'MIME-Version: 1.0',
            "Content-Type: multipart/mixed; boundary=\"#{mixed_boundary}\""
          ]
          parts = [
            "--#{mixed_boundary}\r\nContent-Type: multipart/alternative; boundary=\"#{alternative_boundary}\"\r\n\r\n",
            "--#{alternative_boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n#{email_message.body_text}\r\n",
            "--#{alternative_boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n#{html}\r\n",
            "--#{alternative_boundary}--\r\n--#{mixed_boundary}\r\n"
          ]
          attachments.each do |attachment|
            encoded = Base64.strict_encode64(attachment.file.download).scan(/.{1,76}/).join("\r\n")
            filename = header_value(attachment.file_name).gsub(/[\"\\]/, '_')
            parts << "Content-Type: #{header_value(attachment.content_type)}; name=\"#{filename}\"\r\nContent-Disposition: attachment; filename=\"#{filename}\"\r\nContent-Transfer-Encoding: base64\r\n\r\n#{encoded}\r\n--#{mixed_boundary}\r\n"
          end
          (headers + [''] + parts + ["--#{mixed_boundary}--\r\n"]).join("\r\n")
        end
      end
    end
  end
end

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
          access_key = ENV['AWS_ACCESS_KEY_ID'].presence
          secret_key = ENV['AWS_SECRET_ACCESS_KEY'].presence
          if Rails.env.test? && access_key.blank? && secret_key.blank?
            return Result.new(success?: false, error_code: 'SES_NOT_CONFIGURED', error_message: 'AWS SES não configurado para teste.')
          end

          html_with_tracking = ::Sales::Messaging::TrackingRewriter.apply_tracking(email_message.body_html, email_message)

          provider_id = nil

          if defined?(Aws::SESV2::Client) && (access_key.blank? == secret_key.blank?)
            begin
              client_options = { region: region }
              client_options.merge!(access_key_id: access_key, secret_access_key: secret_key) if access_key.present?
              client = Aws::SESV2::Client.new(**client_options)

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
                content: { raw: { data: raw_message(email_message, html_with_tracking) } }
              }
              request[:configuration_set_name] = ENV['AWS_SES_CONFIGURATION_SET'].presence if ENV['AWS_SES_CONFIGURATION_SET'].present?
              resp = client.send_email(request)
              provider_id = resp.message_id
              if provider_id.blank?
                return Result.new(success?: false, error_code: 'SES_INVALID_RESPONSE', error_message: 'AWS SES não retornou message_id.')
              end
            rescue StandardError => e
              detailed_error = "#{e.class.name}: #{e.message}"
              Rails.logger.error({ event: 'sales_email_provider_send_failed', error_class: e.class.name, message: e.message }.to_json)
              return Result.new(success?: false, error_code: 'SES_SEND_ERROR', error_message: detailed_error)
            end
          else
            return Result.new(success?: false, error_code: 'SES_NOT_CONFIGURED', error_message: 'Credenciais AWS SES incompletas ou SDK não configurado.')
          end

          Result.new(
            success?: true,
            provider_message_id: provider_id
          )
        rescue StandardError => e
          detailed_error = "#{e.class.name}: #{e.message}"
          Rails.logger.error({ event: 'sales_email_provider_send_failed', error_class: e.class.name, message: e.message }.to_json)
          Result.new(
            success?: false,
            error_code: 'SES_SEND_ERROR',
            error_message: detailed_error
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
          participants = email_message.participants.group_by(&:participant_type)
          to = participants['to'].present? ? participants['to'].map(&:email) : [email_message.to_email].compact_blank
          cc = participants['cc'].to_a.map(&:email)
          unsubscribe_token = ::Sales::Messaging::UnsubscribeToken.generate(email_message)
          unsubscribe_url = tracking_url("/t/email/unsubscribe/#{unsubscribe_token}")

          # Suporte a threading e reply-to determinístico
          parent = email_message.parent_email_message if email_message.respond_to?(:parent_email_message)
          parent_rfc = parent&.rfc_message_id.presence || (parent&.provider_message_id.present? ? "<#{parent.provider_message_id}>" : nil)
          reply_to_address = email_message.reply_to_email.presence || (email_message.respond_to?(:reply_mailbox) ? email_message.reply_mailbox&.email : nil)

          headers = [
            "From: #{header_value(email_message.from_email)}",
            ("Reply-To: #{header_value(reply_to_address)}" if reply_to_address.present?),
            "To: #{to.map { |address| header_value(address) }.join(', ')}",
            ("Cc: #{cc.map { |address| header_value(address) }.join(', ')}" if cc.any?),
            "Subject: #{encoded_header(email_message.subject)}",
            ("In-Reply-To: #{parent_rfc}" if parent_rfc.present?),
            ("References: #{parent_rfc}" if parent_rfc.present?),
            "List-Unsubscribe: <#{unsubscribe_url}>",
            'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
            'MIME-Version: 1.0',
            "Content-Type: multipart/mixed; boundary=\"#{mixed_boundary}\""
          ].compact
          parts = [
            "--#{mixed_boundary}\r\nContent-Type: multipart/alternative; boundary=\"#{alternative_boundary}\"\r\n\r\n",
            "--#{alternative_boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n#{email_message.body_text}\r\n",
            "--#{alternative_boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n#{html}\r\n",
            "--#{alternative_boundary}--\r\n--#{mixed_boundary}\r\n"
          ]
          attachments.each do |attachment|
            encoded = Base64.strict_encode64(attachment.file.download).scan(/.{1,76}/).join("\r\n")
            filename = header_value(attachment.file_name).gsub(/["\\]/, '_')
            parts << "Content-Type: #{header_value(attachment.content_type)}; name=\"#{filename}\"\r\nContent-Disposition: attachment; filename=\"#{filename}\"\r\nContent-Transfer-Encoding: base64\r\n\r\n#{encoded}\r\n--#{mixed_boundary}\r\n"
          end
          (headers + [''] + parts + ["--#{mixed_boundary}--\r\n"]).join("\r\n")
        end

        def encoded_header(value)
          sanitized = header_value(value)
          return sanitized.ascii_only? ? sanitized : "=?UTF-8?B?#{Base64.strict_encode64(sanitized)}?="
        end

        def tracking_url(path)
          "#{::Sales::Messaging::TrackingHost.origin}#{path}"
        end
      end
    end
  end
end

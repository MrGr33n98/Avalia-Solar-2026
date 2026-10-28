# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'
require 'base64'

module Sales
  module Messaging
    module Providers
      class Brevo < Base
        ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

        def send_message(email_message, _options = {})
          api_key = ENV['BREVO_API_KEY'].presence
          if api_key.blank?
            return Result.new(
              success?: false,
              error_code: 'BREVO_NOT_CONFIGURED',
              error_message: 'BREVO_API_KEY não configurada no ambiente.'
            )
          end

          tracking_pixel = if email_message.open_tracking_enabled
                             "<img src=\"#{tracking_url("/t/email/open/#{email_message.tracking_token}")}\" " \
                               'width="1" height="1" alt="" style="width:1px;height:1px;border:0;opacity:0;" />'
                           end
          html_body = "#{email_message.body_html}#{tracking_pixel}"
          html_with_tracking = if email_message.click_tracking_enabled
                                 ::Sales::Messaging::TrackingRewriter.rewrite(html_body, email_message)
                               else
                                 html_body
                               end

          participants = email_message.participants.group_by(&:participant_type)
          to_addresses = participants['to'].present? ? participants['to'].map(&:email) : [email_message.to_email].compact_blank
          cc_addresses = participants['cc'].present? ? participants['cc'].map(&:email) : []
          bcc_addresses = participants['bcc'].present? ? participants['bcc'].map(&:email) : []

          sender_name = email_message.sender_user&.name.presence || 'Felipe Henrique'
          sender_email = email_message.from_email.presence || 'felipe@avaliasolar.com.br'

          payload = {
            sender: { name: sender_name, email: sender_email },
            to: to_addresses.map { |email| { email: email } },
            subject: email_message.subject.to_s,
            htmlContent: html_with_tracking.presence || "<p>#{email_message.body_text}</p>",
            textContent: email_message.body_text.to_s
          }

          payload[:cc] = cc_addresses.map { |email| { email: email } } if cc_addresses.any?
          payload[:bcc] = bcc_addresses.map { |email| { email: email } } if bcc_addresses.any?

          attachments = email_message.attachments.select { |a| a.file.attached? }
          if attachments.any?
            payload[:attachment] = attachments.map do |a|
              {
                name: a.file_name,
                content: Base64.strict_encode64(a.file.download)
              }
            end
          end

          uri = URI.parse(ENDPOINT)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true
          http.open_timeout = 10
          http.read_timeout = 15

          req = Net::HTTP::Post.new(uri.request_uri, {
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'api-key' => api_key
          })
          req.body = payload.to_json

          resp = http.request(req)

          if resp.is_a?(Net::HTTPSuccess)
            parsed = begin
              JSON.parse(resp.body)
            rescue StandardError
              {}
            end
            msg_id = parsed['messageId'].presence || "brevo_#{SecureRandom.hex(10)}"
            Result.new(success?: true, provider_message_id: msg_id)
          else
            err_msg = "Brevo HTTP #{resp.code}: #{resp.body.to_s.truncate(300)}"
            Rails.logger.error({ event: 'sales_email_brevo_send_failed', error: err_msg }.to_json)
            Result.new(success?: false, error_code: 'BREVO_API_ERROR', error_message: err_msg)
          end
        rescue StandardError => e
          Rails.logger.error({ event: 'sales_email_brevo_send_failed', error_class: e.class.name, message: e.message }.to_json)
          Result.new(success?: false, error_code: 'BREVO_SEND_ERROR', error_message: "#{e.class.name}: #{e.message}")
        end

        private

        def tracking_url(path)
          "#{::Sales::Messaging::TrackingHost.origin}#{path}"
        end
      end
    end
  end
end

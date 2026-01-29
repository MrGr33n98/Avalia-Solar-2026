# frozen_string_literal: true

module AvaliaSolar
  module Notification
    class SmsClient
      require 'net/http'
      require 'json'

      API_URL = 'https://api.brevo.com/v3/transactionalSMS/sms'

      def initialize
        @api_key = ENV['BREVO_API_KEY']
        @sender = ENV['BREVO_SMS_SENDER'] || 'AvaliaSolar'
        @enabled = ENV['SMS_ENABLED'] == 'true'
      end

      def deliver(to:, message:, metadata: {})
        return dry_run(to, message) unless @enabled
        
        perform_request(to, message, metadata)
      end

      private

      def perform_request(to, message, metadata)
        uri = URI.parse(API_URL)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        request = Net::HTTP::Post.new(uri.path, headers)
        request.body = {
          type: 'transactional',
          sender: @sender,
          recipient: format_phone(to),
          content: message,
          tag: metadata[:tag] || 'auth'
        }.to_json

        response = http.request(request)
        handle_response(response, to, metadata)
      rescue StandardError => e
        log_error(e, to, metadata)
        { success: false, error: :provider_error, message: e.message }
      end

      def headers
        {
          'api-key' => @api_key,
          'Content-Type' => 'application/json',
          'Accept' => 'application/json'
        }
      end

      def format_phone(number)
        # Normalização para E.164 (Padrão Brasil se não houver código)
        cleaned = number.gsub(/\D/, '')
        cleaned.start_with?('55') ? "+#{cleaned}" : "+55#{cleaned}"
      end

      def handle_response(response, to, metadata)
        body = JSON.parse(response.body) rescue {}
        if response.code.to_i == 201
          Rails.logger.info "[AvaliaSolar::SMS] Sent to #{to[0..5]}*** - ID: #{body['messageId']}"
          { success: true, provider_id: body['messageId'] }
        else
          Rails.logger.error "[AvaliaSolar::SMS] Failed to #{to[0..5]}*** - Error: #{body['message']}"
          { success: false, error: :api_error, message: body['message'] }
        end
      end

      def dry_run(to, message)
        Rails.logger.info "[AvaliaSolar::SMS][DRY-RUN] To: #{to}, Msg: #{message}"
        { success: true, provider_id: 'dry_run_id' }
      end

      def log_error(e, to, metadata)
        # Integração futura com Sentry ou Logs estruturados
        Rails.logger.error "[AvaliaSolar::SMS][CRITICAL] #{e.class}: #{e.message} | Metadata: #{metadata}"
      end
    end
  end
end

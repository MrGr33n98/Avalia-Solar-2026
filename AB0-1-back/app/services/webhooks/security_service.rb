# frozen_string_literal: true

module Webhooks
  class SecurityService
    class InvalidSignatureError < StandardError; end
    class TimestampExpiredError < StandardError; end
    class MissingSecretError < StandardError; end

    TIMESTAMP_TOLERANCE_SECONDS = 300

    def initialize(provider:, payload:, signature:, timestamp: nil)
      @provider = provider
      @payload = payload
      @signature = signature
      @timestamp = timestamp
    end

    def verify!
      case @provider
      when 'stripe'
        verify_stripe_signature
      when 'mercadopago', 'pagarme', 'mock'
        verify_hmac_signature
      else
        raise InvalidSignatureError, "Unknown provider: #{@provider}"
      end

      verify_timestamp if @timestamp.present?
      
      log_success
      true
    rescue InvalidSignatureError, TimestampExpiredError => e
      log_failure(e)
      raise
    end

    private

    def verify_stripe_signature
      secret = webhook_secret('stripe')
      raise MissingSecretError, 'STRIPE_WEBHOOK_SECRET not configured' if secret.blank?

      expected = compute_stripe_signature(secret)
      
      unless signatures_match?(@signature, expected)
        raise InvalidSignatureError, 'Invalid Stripe signature'
      end
    end

    def verify_hmac_signature
      secret = webhook_secret(@provider)
      raise MissingSecretError, "#{@provider.upcase}_WEBHOOK_SECRET not configured" if secret.blank?

      expected = OpenSSL::HMAC.hexdigest('SHA256', secret, @payload)
      
      unless signatures_match?(@signature, expected)
        raise InvalidSignatureError, "Invalid HMAC signature for #{@provider}"
      end
    end

    def compute_stripe_signature(secret)
      timestamp = @timestamp || Time.current.to_i
      signed_payload = "#{timestamp}.#{@payload}"
      OpenSSL::HMAC.hexdigest('SHA256', secret, signed_payload)
    end

    def verify_timestamp
      timestamp_int = @timestamp.to_i
      current_time = Time.current.to_i
      
      if (current_time - timestamp_int).abs > TIMESTAMP_TOLERANCE_SECONDS
        raise TimestampExpiredError, 
              "Timestamp outside tolerance window (#{TIMESTAMP_TOLERANCE_SECONDS}s)"
      end
    end

    def signatures_match?(received, expected)
      return false if received.blank? || expected.blank?
      ActiveSupport::SecurityUtils.secure_compare(received, expected)
    end

    def webhook_secret(provider)
      case provider
      when 'stripe'
        ENV['STRIPE_WEBHOOK_SECRET']
      when 'mercadopago'
        ENV['MERCADOPAGO_WEBHOOK_SECRET']
      when 'pagarme'
        ENV['PAGARME_WEBHOOK_SECRET']
      when 'mock'
        ENV['MOCK_WEBHOOK_SECRET'] || 'test_secret_key_for_development_only'
      end
    end

    def log_success
      Rails.logger.info({
        event: 'webhook_verified',
        provider: @provider,
        timestamp: Time.current.iso8601,
        payload_size: @payload.bytesize
      }.to_json)
    end

    def log_failure(error)
      Rails.logger.warn({
        event: 'webhook_verification_failed',
        provider: @provider,
        error_class: error.class.name,
        error_message: error.message,
        timestamp: Time.current.iso8601,
        payload_size: @payload.bytesize
      }.to_json)
    end
  end
end

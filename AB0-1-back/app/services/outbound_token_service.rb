# frozen_string_literal: true

require 'openssl'
require 'base64'
require 'json'
require 'active_support/security_utils'

class OutboundTokenService
  TOKEN_TTL = 30.days

  def self.encode(company_id:, source_context:, outbound_click_id:, ttl: TOKEN_TTL)
    payload = {
      cid: company_id.to_i,
      src: source_context.to_s,
      clk: outbound_click_id.to_s,
      iat: Time.current.to_i,
      exp: (Time.current + ttl).to_i,
      nonce: SecureRandom.hex(8)
    }

    payload_json = payload.to_json
    encoded_payload = Base64.urlsafe_encode64(payload_json, padding: false)
    signature = generate_signature(encoded_payload)

    "#{encoded_payload}.#{signature}"
  end

  def self.decode(token)
    return nil if token.blank?

    encoded_payload, signature = token.to_s.split('.')
    return nil if encoded_payload.blank? || signature.blank?

    expected_signature = generate_signature(encoded_payload)
    return nil unless ActiveSupport::SecurityUtils.secure_compare(signature, expected_signature)

    payload_json = Base64.urlsafe_decode64(encoded_payload)
    payload = JSON.parse(payload_json).symbolize_keys

    return nil if payload[:exp].to_i < Time.current.to_i

    payload
  rescue StandardError => e
    Rails.logger.warn("[OutboundTokenService] Erro ao decodificar token: #{e.message}")
    nil
  end

  def self.valid?(token)
    decode(token).present?
  end

  def self.generate_signature(data)
    secret = Rails.application.secret_key_base
    OpenSSL::HMAC.hexdigest('SHA256', secret, data)
  end
  private_class_method :generate_signature
end

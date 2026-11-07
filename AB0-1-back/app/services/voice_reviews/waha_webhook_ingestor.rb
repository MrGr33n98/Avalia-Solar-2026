module VoiceReviews
  class WahaWebhookIngestor
    MAX_BODY_BYTES = 1.megabyte
    class InvalidSignature < StandardError; end
    class InvalidEnvelope < StandardError; end

    def self.call(raw_body:, signature:, timestamp:, algorithm:)
      new(raw_body:, signature:, timestamp:, algorithm:).call
    end

    def initialize(raw_body:, signature:, timestamp:, algorithm:)
      @raw_body = raw_body.to_s
      @signature = signature.to_s
      @timestamp = timestamp.to_s
      @algorithm = algorithm.to_s.downcase
    end

    def call
      raise InvalidEnvelope, 'Envelope excede o limite' if raw_body.bytesize > MAX_BODY_BYTES

      verify_signature!
      payload = JSON.parse(raw_body)
      event = payload['event'].to_s
      return true if event == 'session.status'
      raise InvalidEnvelope, 'Evento WAHA inválido' unless event == 'message'

      message = payload.fetch('payload', {})
      VoiceReviews::MessageIngestor.call(
        provider: 'waha', provider_session: payload['session'].presence || VoiceReviews::Config.waha_session,
        raw_body: raw_body, messages: [normalize_message(message)]
      )
    rescue JSON::ParserError
      raise InvalidEnvelope, 'JSON inválido'
    rescue KeyError
      raise InvalidEnvelope, 'Envelope WAHA incompleto'
    end

    private

    attr_reader :raw_body, :signature, :timestamp, :algorithm

    def verify_signature!
      secret = VoiceReviews::Config.waha_webhook_hmac_secret
      raise InvalidSignature, 'Segredo HMAC WAHA ausente' if secret.blank? || signature.blank?
      raise InvalidSignature, 'Algoritmo HMAC WAHA inválido' unless algorithm.blank? || algorithm == 'sha512'
      verify_timestamp!

      expected = OpenSSL::HMAC.hexdigest('SHA512', secret, raw_body)
      return if ActiveSupport::SecurityUtils.secure_compare(expected, signature)

      raise InvalidSignature, 'Assinatura HMAC WAHA inválida'
    end

    def verify_timestamp!
      value = Integer(timestamp, 10)
      received_at = value > 10_000_000_000 ? Time.at(value / 1000.0) : Time.at(value)
      return if (Time.current - received_at).abs <= VoiceReviews::Config.waha_webhook_max_age_seconds

      raise InvalidSignature, 'Webhook WAHA expirado'
    rescue ArgumentError
      raise InvalidSignature, 'Timestamp WAHA inválido'
    end

    def normalize_message(message)
      media = message['media'] || {}
      mime_type = media['mimetype'].to_s
      type = if message['hasMedia'] && mime_type.start_with?('audio/')
               'audio'
             elsif message['body'].present?
               'text'
             end
      {
        'id' => message['id'],
        'timestamp' => message['timestamp'],
        'from' => message['from'],
        'chat_id' => message['from'],
        'sender_name' => (message.dig('_data', 'notifyName') || message['notifyName'] || message['pushName']).to_s.strip.presence,
        'from_me' => ActiveModel::Type::Boolean.new.cast(message['fromMe']),
        'type' => type,
        'text' => message['body'],
        'audio' => type == 'audio' ? {
          'id' => message['id'], 'sha256' => nil, 'mime_type' => mime_type,
          'file_size' => nil, 'duration_ms' => nil, 'media_url' => media['url']
        } : nil
      }
    end
  end
end

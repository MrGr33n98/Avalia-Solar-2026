# frozen_string_literal: true

module Chat
  class SessionAccessToken
    VERSION = 1
    TTL = 24.hours
    class InvalidToken < StandardError; end

    def self.generate(session)
      now = Time.current
      Rails.application.message_verifier(:chat_session_access).generate(
        { version: VERSION, session_id: session.id, visitor_nonce: session.visitor_nonce,
          issued_at: now.to_i, expires_at: (now + TTL).to_i }, expires_in: TTL
      )
    end

    def self.verify(token, session: nil)
      payload = Rails.application.message_verifier(:chat_session_access).verify(token).with_indifferent_access
      raise InvalidToken unless payload[:version].to_i == VERSION
      raise InvalidToken if payload[:expires_at].to_i <= Time.current.to_i
      if session && (payload[:session_id].to_i != session.id || payload[:visitor_nonce] != session.visitor_nonce)
        raise InvalidToken
      end
      payload
    rescue ActiveSupport::MessageVerifier::InvalidSignature, NoMethodError
      raise InvalidToken
    end
  end
end

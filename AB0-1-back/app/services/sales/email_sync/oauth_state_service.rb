# frozen_string_literal: true

require 'securerandom'
require 'digest'

module Sales
  module EmailSync
    class OAuthStateService
      STATE_TTL = 10.minutes
      PREFIX = 'crm:zoho:oauth:state:'

      def self.generate_state(user:, company_id:, region: 'us')
        raw_state = SecureRandom.urlsafe_base64(36)
        key = cache_key(raw_state)

        payload = {
          user_id: user.id,
          company_id: company_id,
          region: region,
          created_at: Time.current.to_i
        }

        Rails.cache.write(key, payload, expires_in: STATE_TTL)
        raw_state
      end

      # Atomic single-use verification
      def self.consume_state(raw_state)
        return nil if raw_state.blank? || raw_state.length > 180

        key = cache_key(raw_state)
        context = Rails.cache.read(key)
        return nil unless context.is_a?(Hash)

        # Invalidate immediately to prevent replay attacks
        Rails.cache.delete(key)
        context.symbolize_keys
      end

      def self.cache_key(raw_state)
        "#{PREFIX}#{Digest::SHA256.hexdigest(raw_state)}"
      end
    end
  end
end

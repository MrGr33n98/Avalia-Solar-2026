# frozen_string_literal: true

require 'base64'
require 'digest'
require 'openssl'

module Mcp
  module Public
    # Signed, short-lived, filter- and principal-bound pagination cursor.
    # Not a database snapshot: order is deterministic, but new records can
    # affect a page while a cursor is valid. Maximum scan depth is bounded.
    class Cursor
      EXPIRES_IN = 10.minutes
      MAX_OFFSET = 500

      class << self
        def encode(offset:, scope:, filters:, principal:)
          return nil if offset > MAX_OFFSET

          body = {
            'v' => 1, 'offset' => offset, 'scope' => scope,
            'filters' => hash_filters(filters), 'principal' => fingerprint(principal),
            'exp' => Time.current.to_i + EXPIRES_IN.to_i
          }
          raw = Base64.urlsafe_encode64(JSON.generate(body), padding: false)
          "#{raw}.#{sign(raw)}"
        end

        def decode(value, scope:, filters:, principal:)
          return 0 if value.nil?

          raise InputValidator::Invalid, 'Invalid pagination cursor.' unless value.is_a?(String) && value.bytesize <= 512

          parts = value.split('.', -1)
          raise InputValidator::Invalid, 'Invalid pagination cursor.' unless parts.length == 2
          raw, signature = parts
          raise InputValidator::Invalid, 'Invalid pagination signature.' unless signature.bytesize == sign(raw).bytesize &&
                                                                           ActiveSupport::SecurityUtils.secure_compare(signature, sign(raw))

          body = JSON.parse(Base64.urlsafe_decode64(raw))
          unless body.is_a?(Hash) && body['v'] == 1 &&
                 body['scope'] == scope && body['filters'] == hash_filters(filters) &&
                 body['principal'] == fingerprint(principal) &&
                 body['exp'].is_a?(Integer) && body['exp'] > Time.current.to_i &&
                 body['offset'].is_a?(Integer) && body['offset'].between?(1, MAX_OFFSET)
            raise InputValidator::Invalid, 'Invalid or expired pagination cursor.'
          end

          body['offset']
        rescue JSON::ParserError, ArgumentError
          raise InputValidator::Invalid, 'Invalid pagination cursor.'
        end

        private

        def hash_filters(filters)
          Digest::SHA256.hexdigest(JSON.generate(filters.sort.to_h))
        end

        def fingerprint(value)
          OpenSSL::HMAC.hexdigest('SHA256', Rails.application.secret_key_base, value.to_s)
        end

        def sign(raw)
          Base64.urlsafe_encode64(
            OpenSSL::HMAC.digest('SHA256', Rails.application.secret_key_base, raw),
            padding: false
          )
        end
      end
    end
  end
end

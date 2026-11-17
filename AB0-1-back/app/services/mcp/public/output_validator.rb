# frozen_string_literal: true

require 'time'

module Mcp
  module Public
    # Explicit runtime response gate; the public registry is the source of the
    # declared output fields. Do not serialize unexpected internal model keys.
    class OutputValidator
      class Invalid < StandardError; end

      REQUIRED_ENVELOPE = %w[schema_version data_as_of source_type data limitations].freeze
      ALLOWED_SOURCES = %w[company_declared platform_verified review_aggregate platform_derived unknown].freeze
      PRIVATE_KEYS = %w[
        email phone cpf password access_token refresh_token token jti
        user_id tenant_id buyer_intent buyer_intent_activity lead_email
        reviewer_email reviewer_id internal_notes moderation_notes
      ].freeze
      MAX_BYTES = 65_536

      class << self
        def validate!(name:, payload:)
          definition = ::Mcp::PublicToolRegistry.find(name)
          raise Invalid, 'Unknown tool.' unless definition

          raise Invalid, 'Invalid response envelope.' unless payload.is_a?(Hash)
          data = payload.deep_stringify_keys
          raise Invalid, 'Unexpected output fields.' unless data.keys.sort == REQUIRED_ENVELOPE.sort
          raise Invalid, 'Invalid response version.' unless data['schema_version'] == ::Mcp::PublicToolRegistry::CONTRACT_VERSION
          raise Invalid, 'Unsupported source type.' unless ALLOWED_SOURCES.include?(data['source_type'])
          raise Invalid, 'Invalid limitations.' unless data['limitations'].is_a?(Array) &&
                                                        data['limitations'].all? { |v| v.is_a?(String) && v.bytesize <= 500 }
          raise Invalid, 'Invalid data.' unless data['data'].is_a?(Hash)

          Time.iso8601(data['data_as_of'])
          required = definition.dig('outputSchema', 'properties', 'data', 'required') || []
          raise Invalid, 'Missing data field.' unless (required - data['data'].keys).empty?
          raise Invalid, 'Forbidden output key.' if contains_private_key?(data)

          json = JSON.generate(data)
          raise Invalid, 'Result exceeds output budget.' if json.bytesize > MAX_BYTES

          data
        rescue ArgumentError, TypeError
          raise Invalid, 'Malformed output.'
        end

        private

        def contains_private_key?(object)
          case object
          when Hash
            object.any? do |key, value|
              PRIVATE_KEYS.include?(key.to_s.downcase) || contains_private_key?(value)
            end
          when Array
            object.any? { |value| contains_private_key?(value) }
          else
            false
          end
        end
      end
    end
  end
end

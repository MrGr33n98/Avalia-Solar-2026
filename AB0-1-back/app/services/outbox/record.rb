# frozen_string_literal: true

module Outbox
  class Record
    SENSITIVE_KEYS = %w[
      password
      password_confirmation
      encrypted_password
      token
      jwt
      secret
      api_key
      stripe_secret_key
      master_key
      access_token
      refresh_token
    ].freeze

    def self.call(**args)
      new(**args).call
    end

    def initialize(event_type:, aggregate:, payload: {}, company_id: nil, event_version: 1, metadata: {}, correlation_id: nil, causation_id: nil, occurred_at: Time.current)
      @event_type = event_type.to_s
      @aggregate = aggregate
      @payload = sanitize_payload(payload || {})
      @company_id = company_id || resolve_company_id(aggregate)
      @event_version = event_version.to_i
      @metadata = sanitize_payload(metadata || {})
      @correlation_id = correlation_id
      @causation_id = causation_id
      @occurred_at = occurred_at || Time.current
    end

    def call
      envelope = {
        'event_id' => SecureRandom.uuid,
        'event_version' => @event_version,
        'company_id' => @company_id,
        'correlation_id' => @correlation_id,
        'causation_id' => @causation_id,
        'occurred_at' => @occurred_at.iso8601,
        'data' => @payload,
        'metadata' => @metadata
      }

      # Merge top-level data keys into payload for backward compatibility with existing tests
      merged_payload = envelope.merge(@payload)

      DomainEvent.create!(
        event_type: @event_type,
        aggregate_type: @aggregate.is_a?(Class) ? @aggregate.name : @aggregate.class.name,
        aggregate_id: @aggregate.respond_to?(:id) ? @aggregate.id : 0,
        payload: merged_payload,
        status: 'pending',
        occurred_at: @occurred_at,
        attempts: 0
      )
    end

    private

    def resolve_company_id(aggregate)
      return aggregate.id if aggregate.is_a?(Company)
      return aggregate.company_id if aggregate.respond_to?(:company_id)
      return aggregate.company&.id if aggregate.respond_to?(:company)

      nil
    end

    def sanitize_payload(hash)
      return hash unless hash.is_a?(Hash)

      hash.each_with_object({}) do |(key, value), acc|
        str_key = key.to_s
        if SENSITIVE_KEYS.any? { |s| str_key.downcase.include?(s) }
          acc[key] = '[FILTERED]'
        elsif value.is_a?(Hash)
          acc[key] = sanitize_payload(value)
        elsif value.is_a?(Array)
          acc[key] = value.map { |v| v.is_a?(Hash) ? sanitize_payload(v) : v }
        else
          acc[key] = value
        end
      end
    end
  end
end

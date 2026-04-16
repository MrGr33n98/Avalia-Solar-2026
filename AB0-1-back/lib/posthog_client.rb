# frozen_string_literal: true

# lib/posthog_client.rb
# Server-side PostHog client for Rails
#
# Usage:
#   PosthogClient.capture(distinct_id: 'user_123', event: 'lead_created', properties: { city: 'Florianópolis' })
#   PosthogClient.identify(lead_id: 123, email: 'user@example.com', city: 'Florianópolis', vertical: 'solar')
#   PosthogClient.capture_group(group_type: 'city', group_key: 'Florianópolis', properties: { state: 'SC' })

require 'posthog'

class PosthogClient
  class << self
    def client
      @client ||= begin
        api_key = ENV.fetch('POSTHOG_API_KEY', nil)
        host = ENV.fetch('POSTHOG_HOST', 'https://app.posthog.com')

        if api_key.blank?
          Rails.logger.warn '[PostHog] POSTHOG_API_KEY not set — events will be dropped'
          return NullClient.new
        end

        PostHog::Client.new(
          api_key: api_key,
          host: host,
          on_error: ->(status, _response) {
            Rails.logger.error "[PostHog] API error: #{status}"
          }
        )
      end
    end

    # Capture an event
    #
    # @param distinct_id [String] User/session identifier
    # @param event [String] Event name
    # @param properties [Hash] Event properties
    def capture(distinct_id:, event:, properties: {})
      client.capture(
        distinct_id: distinct_id.to_s,
        event: event,
        properties: properties.compact.transform_values(&:to_s)
      )
    rescue StandardError => e
      Rails.logger.error "[PostHog] Failed to capture #{event}: #{e.message}"
    end

    # Identify a user with properties
    #
    # @param lead_id [Integer,String] Lead ID
    # @param email [String] User email
    # @param city [String] City name
    # @param state [String] State code
    # @param vertical [String] Product vertical
    def identify(lead_id:, email: nil, city: nil, state: nil, vertical: nil)
      client.identify(
        distinct_id: lead_id.to_s,
        properties: {
          email: email,
          city: city,
          state: state,
          vertical: vertical,
        }.compact
      )
    rescue StandardError => e
      Rails.logger.error "[PostHog] Failed to identify lead #{lead_id}: #{e.message}"
    end

    # Capture a group event
    #
    # @param distinct_id [String] User/session identifier
    # @param group_type [String] Group type (e.g. 'city', 'vertical')
    # @param group_key [String] Group key (e.g. 'Florianópolis', 'solar')
    # @param properties [Hash] Group properties
    def capture_group(distinct_id:, group_type:, group_key:, properties: {})
      client.group_identify(
        group_type: group_type,
        group_key: group_key.to_s,
        properties: properties.compact
      )
    rescue StandardError => e
      Rails.logger.error "[PostHog] Failed to identify group #{group_type}/#{group_key}: #{e.message}"
    end

    # Evaluate feature flag for a user
    #
    # @param distinct_id [String] User/session identifier
    # @param flag [String] Feature flag key
    # @return [Boolean, String, nil] Flag value
    def feature_flag(distinct_id:, flag:)
      client.feature_flag(
        key: flag,
        distinct_id: distinct_id.to_s
      )
    rescue StandardError => e
      Rails.logger.error "[PostHog] Failed to evaluate flag #{flag}: #{e.message}"
      nil
    end

    # Flush pending events (call before shutdown)
    def flush
      client.flush if @client.is_a?(PostHog::Client)
    end
  end

  # Null client for when PostHog is not configured
  class NullClient
    def capture(**); end
    def identify(**); end
    def group_identify(**); end
    def feature_flag(**); nil; end
    def flush; end
  end
end

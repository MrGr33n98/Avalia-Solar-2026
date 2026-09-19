# frozen_string_literal: true

module Observability
  class Context
    THREAD_KEY = :_avalia_observability_context

    ATTRIBUTES = %i[
      request_id
      trace_id
      correlation_id
      causation_id
      company_id
      user_id
      actor_type
      actor_id
      route
      operation
      job_id
      event_id
      deployment_version
    ].freeze

    class << self
      def current
        Thread.current[THREAD_KEY] ||= default_context
      end

      def set(key, value)
        current[key.to_sym] = value
      end

      def get(key)
        current[key.to_sym]
      end

      def with_context(attributes = {})
        previous = current.dup
        Thread.current[THREAD_KEY] = previous.merge(attributes.symbolize_keys.slice(*ATTRIBUTES))
        yield
      ensure
        Thread.current[THREAD_KEY] = previous
      end

      def clear!
        Thread.current[THREAD_KEY] = default_context
      end

      def to_h
        current.compact
      end

      def deployment_version
        ENV['GIT_SHA'] || ENV['APP_VERSION'] || 'unknown'
      end

      private

      def default_context
        {
          deployment_version: deployment_version
        }
      end
    end
  end
end

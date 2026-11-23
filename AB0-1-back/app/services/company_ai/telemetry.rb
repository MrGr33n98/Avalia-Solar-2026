# frozen_string_literal: true

module CompanyAi
  # Emits only request-level facts. Conversation content, prompts, tokens and
  # credentials never enter the outbox or the metrics labels.
  class Telemetry
    EVENTS = %w[
      message.completed
      message.failed
      message.idempotent
      handoff.requested
      quote.started
    ].freeze
    OUTCOMES = %w[completed fallback handoff quota_exceeded invalid unavailable error idempotent].freeze
    SAFE_ID = /\A[a-zA-Z0-9._:-]{1,96}\z/
    SAFE_VALUE = /\A[a-zA-Z0-9._:-]{1,64}\z/

    class << self
      def record(context = {})
        new(context).record
      end

      def record_result(result:, session:, request_id:, started_at:)
        outcome = result_outcome(result)
        duration_ms = elapsed_ms(started_at)
        record(
          event: result.idempotent ? 'message.idempotent' : 'message.completed',
          session:, request_id:, duration_ms:, outcome:,
          metadata: result_metadata(result)
        )
        record_action(result:, session:, request_id:, duration_ms:, outcome:) if result.action
      end

      def record_failure(session:, request_id:, duration_ms:, outcome:)
        record(event: 'message.failed', session:, request_id:, duration_ms:, outcome:)
      rescue StandardError => e
        Rails.logger.warn("[CompanyAi::Telemetry] failed: #{e.class}: #{e.message}")
        nil
      end

      def record_error(error:, session:, request_id:, started_at:)
        return unless session

        outcome = case error
                  when CompanyAi::UsageLedger::QuotaExceeded then 'quota_exceeded'
                  when CompanyAi::MessageProcessor::InvalidMessage then 'invalid'
                  when CompanyAi::MessageProcessor::Unavailable then 'unavailable'
                  else 'error'
                  end
        record_failure(session:, request_id:, duration_ms: elapsed_ms(started_at), outcome:)
      end

      def elapsed_ms(started_at)
        ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1_000).round
      end

      private

      def result_outcome(result)
        return 'idempotent' if result.idempotent
        return 'handoff' if result.action&.fetch('type', nil) == 'handoff'
        return 'fallback' if result.assistant_message&.model == 'fallback'

        'completed'
      end

      def result_metadata(result)
        {
          response_model: result.assistant_message&.model,
          fallback: result.assistant_message&.model == 'fallback',
          action_type: result.action&.fetch('type', nil)
        }
      end

      def record_action(result:, session:, request_id:, duration_ms:, outcome:)
        event = result.action['type'] == 'handoff' ? 'handoff.requested' : 'quote.started'
        record(event:, session:, request_id:, duration_ms:, outcome:, metadata: { action_type: result.action['type'] })
      end

      def safe_metadata(metadata)
        metadata.to_h.each_with_object({}) do |(key, value), result|
          key = key.to_s
          next unless %w[response_model fallback action_type].include?(key)

          value = value.to_s
          result[key] = value.first(64) if value.match?(SAFE_VALUE)
        end
      end

      def safe_value(value, max:)
        value = value.to_s
        return nil unless value.length <= max && value.match?(SAFE_ID)

        value
      end
    end

    def initialize(context)
      @event = context[:event]
      @session = context[:session]
      @request_id = context[:request_id]
      @duration_ms = context[:duration_ms]
      @outcome = context[:outcome]
      @metadata = context[:metadata]
    end

    def record
      event = EVENTS.include?(@event.to_s) ? @event.to_s : 'message.failed'
      outcome = OUTCOMES.include?(@outcome.to_s) ? @outcome.to_s : 'error'
      payload = {
        session_id: @session.id,
        company_id: @session.company_id,
        request_id: self.class.send(:safe_value, @request_id, max: 96),
        duration_ms: @duration_ms.to_i.clamp(0, 120_000),
        outcome:,
        mode: self.class.send(:safe_value, @session.mode, max: 32) || 'unknown',
        metadata: self.class.send(:safe_metadata, @metadata)
      }
      Outbox.record!(event_type: "company_ai.#{event}", aggregate: @session, company_id: @session.company_id,
                     payload:, metadata: { source: 'company_ai_runtime' }, correlation_id: payload[:request_id])
      ActiveSupport::Notifications.instrument('company_ai.request', payload.merge(event:))
      payload
    rescue StandardError => e
      Rails.logger.warn("[CompanyAi::Telemetry] failed: #{e.class}: #{e.message}")
      nil
    end
  end
end

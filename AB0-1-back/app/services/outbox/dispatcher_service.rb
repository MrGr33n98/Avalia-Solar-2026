# frozen_string_literal: true

module Outbox
  class DispatcherService
    DEFAULT_BATCH_SIZE = 100

    def self.call(batch_size: DEFAULT_BATCH_SIZE)
      new(batch_size: batch_size).call
    end

    def initialize(batch_size: DEFAULT_BATCH_SIZE)
      @batch_size = batch_size
    end

    def call
      succeeded = 0
      failed = 0

      events = claim_batch
      return { processed: 0, succeeded: 0, failed: 0 } if events.empty?

      events.each do |event|
        if process_single_event(event)
          succeeded += 1
        else
          failed += 1
        end
      end

      {
        processed: events.size,
        succeeded: succeeded,
        failed: failed
      }
    end

    private

    def claim_batch
      claimed_events = []
      DomainEvent.transaction do
        candidates = if postgresql?
                       DomainEvent.processable
                                  .lock('FOR UPDATE SKIP LOCKED')
                                  .limit(@batch_size)
                                  .to_a
                     else
                       DomainEvent.processable.limit(@batch_size).to_a
                     end

        candidates.each do |event|
          event.mark_processing!
          claimed_events << event
        end
      end
      claimed_events
    rescue StandardError => e
      Rails.logger.warn("[Outbox::DispatcherService] Error claiming batch: #{e.message}")
      []
    end

    def process_single_event(event)
      # Dispatch to registered consumers
      Outbox::EventRouter.dispatch(event)

      # Mark completed/published
      event.mark_published!
      true
    rescue StandardError => e
      event.mark_failed!(e)
      false
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name.downcase.include?('postgres')
    rescue StandardError
      false
    end
  end
end

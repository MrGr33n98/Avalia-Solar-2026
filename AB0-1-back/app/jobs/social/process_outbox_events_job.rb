# frozen_string_literal: true

module Social
  class ProcessOutboxEventsJob < ApplicationJob
    queue_as :default

    def perform
      DomainEvent.pending.limit(100).find_each do |event|
        event.update!(status: 'processing')

        case event.event_type
        when 'publication.published', 'review.approved'
          Social::CreateFeedItemJob.perform_now(event.aggregate_type, event.aggregate_id)
        end

        event.update!(status: 'completed', processed_at: Time.current)
      rescue StandardError => e
        event.update!(
          status: 'failed',
          attempts: event.attempts + 1,
          last_error: "#{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        )
      end
    end
  end
end

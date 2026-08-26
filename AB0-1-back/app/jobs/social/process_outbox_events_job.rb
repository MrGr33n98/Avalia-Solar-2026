# frozen_string_literal: true

module Social
  class ProcessOutboxEventsJob < ApplicationJob
    queue_as :default

    def perform
      DomainEvent.processable.limit(100).find_each do |event|
        process_event(event)
      end
    end

    private

    def process_event(event)
      claimed = false
      event.with_lock do
        next unless event.processable?

        event.update!(status: 'processing')
        claimed = true
      end

      dispatch(event) if claimed
      event.update!(status: 'completed', processed_at: Time.current) if claimed
    rescue StandardError => e
      event.update!(
        status: 'failed',
        attempts: event.attempts + 1,
        last_error: "#{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      )
    end

    def dispatch(event)
      case event.event_type
      when 'publication.published', 'review.approved', 'group_post_created', 'group_post_restored'
        Social::CreateFeedItemJob.perform_now(event.aggregate_type, event.aggregate_id)
      when 'group_post_hidden'
        FeedItem.where(subject_type: event.aggregate_type, subject_id: event.aggregate_id).destroy_all
      end
    end
  end
end

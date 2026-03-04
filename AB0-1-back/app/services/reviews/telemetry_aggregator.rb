# frozen_string_literal: true

module Reviews
  class TelemetryAggregator
    EVENTS_TO_TRACK = %w[review_read review_cta_click].freeze

    def self.call(event_type, metadata)
      return unless EVENTS_TO_TRACK.include?(event_type.to_s)
      
      review_id = metadata['review_id']
      return if review_id.blank?

      new(review_id, event_type).increment!
    end

    def initialize(review_id, event_type)
      @review_id = review_id
      @event_type = event_type
    end

    def increment!
      review = Review.find_by(id: @review_id)
      return unless review

      # Ensure metadata is a hash and not nil
      current_metadata = (review.metadata || {}).dup
      
      case @event_type.to_s
      when 'review_read'
        count = (current_metadata['read_count'] || 0).to_i + 1
        current_metadata['read_count'] = count
      when 'review_cta_click'
        count = (current_metadata['cta_clicks'] || 0).to_i + 1
        current_metadata['cta_clicks'] = count
      end

      current_metadata['last_aggregated_at'] = Time.current
      
      # Use update_columns for bypass and performance
      review.update_columns(metadata: current_metadata)
    rescue StandardError => e
      Rails.logger.error("[TelemetryAggregator] Failed to update cache for Review #{@review_id}: #{e.message}")
    end
  end
end

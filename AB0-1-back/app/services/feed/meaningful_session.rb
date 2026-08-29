# frozen_string_literal: true

module Feed
  class MeaningfulSession
    SIGNALS = %w[
      feed_item_dwell_10s post_dwell_10s feed_follow feed_item_saved feed_comments_opened
      company_view community_join article_read compare_started quote_intent
    ].freeze

    def self.call(scope = AnalyticsEvent.where(tracked_at: 30.days.ago..))
      events = scope.where(event_type: SIGNALS)
      identity = "COALESCE(user_id::text, NULLIF(anonymous_id, ''))"
      {
        meaningful_sessions: events.where.not(user_id: nil).or(events.where.not(anonymous_id: nil)).distinct.count(Arel.sql(identity)),
        signal_events: events.count,
        signals: events.group(:event_type).count,
        cohorts: events.group(
          Arel.sql("COALESCE(context->>'device_type', 'unknown')"),
          Arel.sql("COALESCE(metadata->>'view', 'unknown')")
        ).count
      }
    end
  end
end

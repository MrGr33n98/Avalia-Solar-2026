# frozen_string_literal: true

module Feed
  class StatsReconciler
    def self.call(record)
      FeedItemStat.recalculate!(record)
    rescue ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid => e
      Rails.logger.warn(event: 'feed_stats_reconcile_failed', error_class: e.class.name, subject_type: record.class.name, subject_id: record.id)
    end
  end
end

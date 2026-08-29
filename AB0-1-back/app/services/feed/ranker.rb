# frozen_string_literal: true

module Feed
  class Ranker
    # Deterministic ranking foundation. No ML or per-user hidden score yet.
    # Recent view keeps chronological order; for_you combines freshness with
    # persisted engagement counts without changing pagination semantics.
    def initialize(scope, view: 'for_you')
      @scope = scope
      @view = view
    end

    def call
      return @scope.recent unless @view == 'for_you'

      @scope
        .joins('LEFT JOIN feed_item_stats engagement ON engagement.subject_type = feed_items.subject_type AND engagement.subject_id = feed_items.subject_id')
        .select('feed_items.*', "COALESCE(engagement.engagement_score, 0) * EXP(-GREATEST(EXTRACT(EPOCH FROM (NOW() - feed_items.published_at)) / 86400, 0) / 30) AS engagement_score")
        .order(Arel.sql('engagement_score DESC'), published_at: :desc, id: :desc)
    end

    private

  end
end

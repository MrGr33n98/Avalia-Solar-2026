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
        .joins("LEFT JOIN (#{engagement_counts_sql}) engagement ON engagement.subject_type = feed_items.subject_type AND engagement.subject_id = feed_items.subject_id")
        .select('feed_items.*', "COALESCE(engagement.engagement_score, 0) AS engagement_score")
        .order(Arel.sql('COALESCE(engagement.engagement_score, 0) DESC'), published_at: :desc, id: :desc)
    end

    private

    def engagement_counts_sql
      <<~SQL.squish
        SELECT subject_type, subject_id,
          COUNT(*) AS engagement_score
        FROM (
          SELECT reactable_type AS subject_type, reactable_id AS subject_id, 'reaction' AS source
          FROM reactions
          WHERE reactable_type IN ('ReviewerPublication', 'Review', 'GroupPost')
          UNION ALL
          SELECT commentable_type, commentable_id, 'comment'
          FROM comments
          WHERE status = 'active' AND commentable_type IN ('ReviewerPublication', 'Review', 'GroupPost')
          UNION ALL
          SELECT saveable_type, saveable_id, 'save'
          FROM saved_items
          WHERE saveable_type IN ('ReviewerPublication', 'Review', 'GroupPost')
        ) interactions
        GROUP BY subject_type, subject_id
      SQL
    end
  end
end

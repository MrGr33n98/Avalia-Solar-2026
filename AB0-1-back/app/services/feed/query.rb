# frozen_string_literal: true

module Feed
  class Query
    DEFAULT_LIMIT = 20

    def initialize(user: nil, view: 'for_you', cursor: nil, limit: DEFAULT_LIMIT)
      @user = user
      @view = view
      @cursor_data = Feed::Cursor.decode(cursor)
      @limit = [limit.to_i, 50].min
      @limit = DEFAULT_LIMIT if @limit <= 0
    end

    def call
      candidates = CandidateBuilder.new(user: @user, view: @view).call

      ranked_candidates = Feed::Ranker.new(candidates, view: @view).call
      ranked_candidates = apply_cursor(ranked_candidates)
      items = ranked_candidates.includes(:actor, :subject).limit(@limit + 1).to_a
      has_more = items.size > @limit
      items = items.first(@limit)

      next_cursor = if has_more && items.last
                      Feed::Cursor.encode(
                        items.last.published_at,
                        items.last.id,
                        score: @view == 'for_you' ? items.last.engagement_score : nil
                      )
                    else
                      nil
                    end

      {
        items: items,
        next_cursor: next_cursor,
        has_more: has_more
      }
    end

    private

    def apply_cursor(scope)
      return scope unless @cursor_data

      if @view == 'for_you' && @cursor_data[:score]
        score = @cursor_data[:score].to_i

        cursor_condition = <<~SQL.squish
          COALESCE(engagement.engagement_score, 0) < ?
          OR (
            COALESCE(engagement.engagement_score, 0) = ?
            AND (
              feed_items.published_at < ?
              OR (
                feed_items.published_at = ?
                AND feed_items.id < ?
              )
            )
          )
        SQL

        return scope.where(
          cursor_condition,
          score,
          score,
          @cursor_data[:published_at],
          @cursor_data[:published_at],
          @cursor_data[:id]
        )
      end

      scope.where(
        'feed_items.published_at < ? OR (feed_items.published_at = ? AND feed_items.id < ?)',
        @cursor_data[:published_at],
        @cursor_data[:published_at],
        @cursor_data[:id]
      )
    end
  end
end

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

      if @cursor_data
        candidates = candidates.where(
          'published_at < ? OR (published_at = ? AND id < ?)',
          @cursor_data[:published_at],
          @cursor_data[:published_at],
          @cursor_data[:id]
        )
      end

      items = candidates.includes(:actor, :subject).recent.limit(@limit + 1).to_a
      has_more = items.size > @limit
      items = items.first(@limit)

      next_cursor = if has_more && items.last
                      Feed::Cursor.encode(items.last.published_at, items.last.id)
                    else
                      nil
                    end

      {
        items: items,
        next_cursor: next_cursor,
        has_more: has_more
      }
    end
  end
end

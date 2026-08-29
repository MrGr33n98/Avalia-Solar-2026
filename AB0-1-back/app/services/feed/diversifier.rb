# frozen_string_literal: true

module Feed
  class Diversifier
    MAX_CONSECUTIVE = 2

    def self.call(items)
      remaining = Array(items).dup
      diversified = []

      until remaining.empty?
        index = next_index(remaining, diversified)
        diversified << remaining.delete_at(index)
      end

      diversified
    end

    def self.next_index(remaining, selected)
      return 0 if selected.last(2).length < MAX_CONSECUTIVE

      recent_actor_ids = selected.last(MAX_CONSECUTIVE).map { |item| [item.actor_type, item.actor_id] }
      remaining.index { |item| !recent_actor_ids.include?([item.actor_type, item.actor_id]) } || 0
    end
    private_class_method :next_index
  end
end

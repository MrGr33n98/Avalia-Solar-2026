# frozen_string_literal: true

module Feed
  class TrendingTopics
    WINDOW = 30.days
    LIMIT = 8

    def self.call
      current = counts_between(WINDOW.ago, Time.current)
      previous = counts_between((WINDOW * 2).ago, WINDOW.ago)

      current.sort_by { |label, count| -count }.first(LIMIT).map do |label, count|
        previous_count = previous.fetch(label, 0)
        {
          slug: label.parameterize,
          label: label,
          publications_count: count,
          velocity: previous_count.zero? ? nil : ((count - previous_count).to_f / previous_count).round(2),
          category: label
        }
      end
    end

    def self.counts_between(from, to)
      ReviewerPublication.published.where(published_at: from..to).where.not(category: [nil, ''])
        .group(:category).count
    end
    private_class_method :counts_between
  end
end

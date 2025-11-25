# frozen_string_literal: true

# Optimized company queries - TASK-022
module CompanyQueries
  def self.with_review_stats
    Company
      .select(
        'companies.*',
        'COUNT(DISTINCT reviews.id) as reviews_count',
        'AVG(reviews.rating) as avg_rating',
        'MAX(reviews.created_at) as last_review_at'
      )
      .left_joins(:reviews)
      .group('companies.id')
  end

  def self.top_rated(limit = 10)
    Company
      .where('reviews_count > ?', 5)
      .order(rating: :desc, reviews_count: :desc)
      .limit(limit)
  end

  def self.recent_with_reviews(page = 1, per_page = 25)
    Company
      .includes(:reviews)
      .where('reviews.created_at > ?', 1.month.ago)
      .order('reviews.created_at DESC')
      .page(page)
      .per(per_page)
  end
end

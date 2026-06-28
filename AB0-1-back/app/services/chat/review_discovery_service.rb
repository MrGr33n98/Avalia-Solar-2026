# frozen_string_literal: true

module Chat
  class ReviewDiscoveryService
    def self.discover(company_ids, interest_type = 'see_best_rated')
      return {} if company_ids.blank?

      companies = Company.where(id: company_ids).includes(:reviews)
      results = {}

      companies.each do |company|
        reviews = company.reviews.approved

        # Sort based on interest
        sorted_reviews = case interest_type
                         when 'see_best_rated'
                           reviews.order(rating: :desc, created_at: :desc)
                         when 'see_recent_reviews'
                           reviews.order(created_at: :desc)
                         when 'read_negative_reviews'
                           reviews.where('rating <= 2').order(created_at: :desc)
                         else
                           reviews.order(created_at: :desc)
                         end

        results[company.id] = {
          average_rating: company.average_rating || 0,
          total_reviews: reviews.count,
          top_reviews: sorted_reviews.limit(3).map { |r| serialize_review(r) }
        }
      end

      results
    end

    def self.serialize_review(review)
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer_name: review.user&.name || 'Usuário Anônimo',
        date: review.created_at.strftime('%d/%m/%Y')
      }
    end
  end
end

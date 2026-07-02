# frozen_string_literal: true

module Mcp
  class ReviewsSummaryService < BaseService
    def call
      company = find_company!(scope: active_companies)
      reviews = Review.approved_only.where(company_id: company.id)
      distribution = reviews.group(:rating).count.transform_keys { |rating| rating.to_f.to_s }
      {
        company: { id: company.id, name: company.name, slug: company.slug },
        summary: {
          average_rating: reviews.average(:rating)&.to_f || 0.0,
          total: reviews.count,
          verified_total: reviews.where(verified: true).count,
          replied_total: reviews.where.not(reply: [nil, '']).count,
          rating_distribution: distribution
        }
      }
    end
  end
end

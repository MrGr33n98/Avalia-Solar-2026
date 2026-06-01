# frozen_string_literal: true

module Chat
  module Mobivolt
    class ReviewSummaryBuilderService
      def self.build_for(company)
        new(company).build
      end

      def initialize(company)
        @company = company
      end

      def build
        return [] if @company.nil?

        # Busca até 2 reviews publicados (aprovados) mais recentes
        reviews = @company.reviews.published.order(created_at: :desc).limit(2)

        reviews.map do |review|
          {
            autor: review.public_reviewer_name,
            nota: review.rating.to_f,
            comentario: review.comment.to_s.truncate(150)
          }
        end
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::ReviewSummaryBuilder] Error building reviews for company #{@company&.id}: #{e.message}")
        []
      end
    end
  end
end

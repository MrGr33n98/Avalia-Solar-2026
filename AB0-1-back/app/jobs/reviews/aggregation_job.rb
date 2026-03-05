# frozen_string_literal: true

module Reviews
  class AggregationJob < ApplicationJob
    queue_as :default

    def perform(review_id)
      review = Review.find_by(id: review_id)
      return unless review

      # Executa a agregação para a empresa e categoria da review
      Reviews::AggregationService.call(review.id)
    end
  end
end

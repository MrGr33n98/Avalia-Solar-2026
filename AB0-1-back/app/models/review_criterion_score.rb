class ReviewCriterionScore < ApplicationRecord
  belongs_to :review
  belongs_to :rating_criterion

  validates :rating_criterion_id, uniqueness: { scope: :review_id }
  validates :score, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }, unless: :not_applicable
end

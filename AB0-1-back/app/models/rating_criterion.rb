class RatingCriterion < ApplicationRecord
  belongs_to :category, optional: true
  has_many :review_criterion_scores, dependent: :destroy

  validates :slug, presence: true, format: { with: /\A[a-z0-9_]+\z/ }
  validates :title, presence: true
  validates :weight, numericality: { greater_than_or_equal_to: 0 }
  validates :slug, uniqueness: { scope: :category_id }

  scope :active, -> { where(active: true) }
end

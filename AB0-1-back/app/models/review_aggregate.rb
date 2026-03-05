class ReviewAggregate < ApplicationRecord
  belongs_to :company
  belongs_to :category, optional: true

  validates :company_id, presence: true
  validates :company_id, uniqueness: { scope: :category_id }

  def self.ransackable_attributes(_auth_object = nil)
    %w[average_rating category_id company_id created_at id total_reviews updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category company]
  end
end

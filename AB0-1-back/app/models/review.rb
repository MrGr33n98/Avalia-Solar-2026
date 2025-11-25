class Review < ApplicationRecord
  include ReviewCallbacks

  belongs_to :company, counter_cache: :rating_count
  belongs_to :user

  validates :rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }

  # Update ransackable attributes to include comment
  def self.ransackable_attributes(_auth_object = nil)
    %w[comment created_at id company_id rating updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user]
  end
end

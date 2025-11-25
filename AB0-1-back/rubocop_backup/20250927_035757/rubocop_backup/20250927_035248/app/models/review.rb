class Review < ApplicationRecord
  belongs_to :product
  belongs_to :user

  # Update ransackable attributes to include comment
  def self.ransackable_attributes(_auth_object = nil)
    %w[comment created_at id product_id rating updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[product user]
  end
end

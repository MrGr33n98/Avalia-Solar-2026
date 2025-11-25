class Pricing < ApplicationRecord
  belongs_to :product

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at id price product_id updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    ['product']
  end
end

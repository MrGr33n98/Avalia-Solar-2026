class ProductAccess < ApplicationRecord
  belongs_to :product
  belongs_to :user

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at id product_id updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[product user]
  end
end

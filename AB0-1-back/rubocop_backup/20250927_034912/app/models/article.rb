class Article < ApplicationRecord
  belongs_to :category
  belongs_to :product

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id content created_at id product_id title updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category product]
  end
end

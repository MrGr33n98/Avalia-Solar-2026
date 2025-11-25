class SubscriptionPlan < ApplicationRecord
  belongs_to :category
  belongs_to :plan
  belongs_to :product

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at id plan_id product_id updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category plan product]
  end
end

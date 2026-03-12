class SponsoredPlan < ApplicationRecord
  belongs_to :category
  belongs_to :plan
  belongs_to :product
  belongs_to :member, class_name: 'User', foreign_key: :member_id, optional: true

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[active category_id created_at end_at id member_id plan_id product_id purchased_at start_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category member plan product]
  end
end

class ForumQuestion < ApplicationRecord
  belongs_to :user
  belongs_to :product
  belongs_to :category

  # Add ransackable attributes for ActiveAdmin
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at description id product_id requested_at
       status subject updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category product user]
  end
end

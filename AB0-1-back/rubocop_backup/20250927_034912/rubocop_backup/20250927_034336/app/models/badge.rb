class Badge < ApplicationRecord
  # Add association to Category
  belongs_to :category, optional: true

  # Add Active Storage for badge image
  has_one_attached :badge_image

  # Add ransackable attributes for ActiveAdmin
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at description id image name position
       updated_at year edition products]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category products badge_image_attachment badge_image_blob]
  end
end

class Content < ApplicationRecord
  # Add any associations your Content model has

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at format id landing_url level short_description tags title updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end

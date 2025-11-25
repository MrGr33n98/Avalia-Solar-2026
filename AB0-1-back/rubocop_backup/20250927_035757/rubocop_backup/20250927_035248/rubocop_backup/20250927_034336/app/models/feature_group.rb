class FeatureGroup < ApplicationRecord
  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at description id name updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end

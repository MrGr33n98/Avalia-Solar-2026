class Lead < ApplicationRecord
  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[company created_at email id message name phone updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end

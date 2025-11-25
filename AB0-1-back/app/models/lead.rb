class Lead < ApplicationRecord
  # Make company association optional since the database might not have company_id column
  belongs_to :company, optional: true

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[company_id created_at email id message name phone updated_at project_type estimated_budget location]
  end

  def self.ransackable_associations(_auth_object = nil)
    ["company"]
  end
end

class Campaign < ApplicationRecord
  # Assuming you have associations like these
  has_many :campaign_reviews

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[budget created_at description end_date id name start_date updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    ['campaign_reviews']
  end
end

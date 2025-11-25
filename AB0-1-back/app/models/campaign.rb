class Campaign < ApplicationRecord
  belongs_to :company, optional: true
  has_many :campaign_reviews

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[budget created_at description end_date id name start_date updated_at company_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    ['campaign_reviews', 'company']
  end
end

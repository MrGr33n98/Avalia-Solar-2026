class CampaignReview < ApplicationRecord
  # Assuming you have associations like these
  belongs_to :campaign
  belongs_to :user, optional: true
  belongs_to :product, optional: true

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[campaign_id comment created_at id product_id rating updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[campaign product user]
  end
end

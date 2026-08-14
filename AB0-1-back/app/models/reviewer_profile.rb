class ReviewerProfile < ApplicationRecord
  belongs_to :user
  has_one_attached :public_banner
  validates :bio, length: { maximum: 2000 }, allow_blank: true
  validates :linkedin_url, :instagram_url, :website_url, length: { maximum: 500 }, allow_blank: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[id user_id profession company_name bio birth_date linkedin_url instagram_url website_url public_profile created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user]
  end
end

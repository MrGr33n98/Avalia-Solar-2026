class ReviewerProfile < ApplicationRecord
  belongs_to :user
  validates :bio, length: { maximum: 2000 }, allow_blank: true
  validates :linkedin_url, :instagram_url, :website_url, length: { maximum: 500 }, allow_blank: true
end

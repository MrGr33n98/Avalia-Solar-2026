class BannerGlobal < ApplicationRecord
  has_one_attached :image
  validates :title, presence: true
  validates :link, presence: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[title link created_at id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[image_attachment image_blob]
  end
end

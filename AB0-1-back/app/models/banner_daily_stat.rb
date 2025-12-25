class BannerDailyStat < ApplicationRecord
  belongs_to :banner

  validates :day, presence: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[id banner_id day views_count clicks_count ctr created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[banner]
  end
end

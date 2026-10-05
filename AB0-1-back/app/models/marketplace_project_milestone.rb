class MarketplaceProjectMilestone < ApplicationRecord
  belongs_to :project, class_name: 'MarketplaceProject'
  validates :key, :title, presence: true
  validates :status, inclusion: { in: %w[pending current completed skipped] }
end

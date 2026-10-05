class MarketplaceProject < ApplicationRecord
  belongs_to :proposal, class_name: 'MarketplaceProposal'
  belongs_to :lead
  belongs_to :company
  belongs_to :buyer_user, class_name: 'User', optional: true
  has_many :milestones, class_name: 'MarketplaceProjectMilestone', foreign_key: :project_id, dependent: :destroy
  STATUSES = %w[not_started in_progress site_visit_scheduled installation_scheduled installation_in_progress completed cancelled].freeze
  validates :status, inclusion: { in: STATUSES }
end

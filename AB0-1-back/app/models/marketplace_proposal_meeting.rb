class MarketplaceProposalMeeting < ApplicationRecord
  belongs_to :proposal, class_name: 'MarketplaceProposal'
  belongs_to :buyer_user, class_name: 'User', optional: true
  belongs_to :company
  STATUSES = %w[requested confirmed cancelled completed].freeze
  validates :status, inclusion: { in: STATUSES }
end

class MarketplaceProposalDecision < ApplicationRecord
  KINDS = %w[interested accepted declined request_change].freeze

  belongs_to :proposal, class_name: 'MarketplaceProposal'
  belongs_to :buyer_user, class_name: 'User', optional: true
  validates :kind, inclusion: { in: KINDS }
end

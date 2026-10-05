class MarketplaceProposalEvent < ApplicationRecord
  belongs_to :proposal, class_name: 'MarketplaceProposal'
  belongs_to :actor, class_name: 'User', optional: true
end

class MarketplaceProposalTerm < ApplicationRecord
  belongs_to :version, class_name: 'MarketplaceProposalVersion'
  validates :key, :label, :value, presence: true
end

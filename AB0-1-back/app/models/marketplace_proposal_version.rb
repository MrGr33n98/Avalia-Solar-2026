class MarketplaceProposalVersion < ApplicationRecord
  belongs_to :proposal, class_name: 'MarketplaceProposal'
  has_many :items, class_name: 'MarketplaceProposalItem', foreign_key: :version_id, dependent: :destroy
  has_many :terms, class_name: 'MarketplaceProposalTerm', foreign_key: :version_id, dependent: :destroy

  validates :number, uniqueness: { scope: :proposal_id }
  validates :title, presence: true
  validate :immutable_after_publishing

  def publish!
    if items.empty?
      errors.add(:items, 'adicione pelo menos um item antes de publicar')
      raise ActiveRecord::RecordInvalid, self
    end

    transaction do
      items.each(&:calculate_total!)
      update!(status: 'published', published_at: Time.current, total_cents: items.sum(:total_cents))
    end
  end

  private

  def immutable_after_publishing
    errors.add(:base, 'Versão publicada não pode ser alterada') if status_was == 'published' && changed?
  end
end

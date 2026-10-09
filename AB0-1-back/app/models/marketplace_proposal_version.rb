class MarketplaceProposalVersion < ApplicationRecord
  belongs_to :proposal, class_name: 'MarketplaceProposal'
  has_many :items, class_name: 'MarketplaceProposalItem', foreign_key: :version_id, dependent: :destroy
  has_many :terms, class_name: 'MarketplaceProposalTerm', foreign_key: :version_id, dependent: :destroy
  has_many_attached :documents, service: Rails.env.production? ? :proposal_documents : (Rails.env.test? ? :test : :local)

  validates :number, uniqueness: { scope: :proposal_id }
  validates :title, presence: true
  validate :immutable_after_publishing

  def publish!
    transaction do
      items.each(&:calculate_total!)
      total_cents = items.exists? ? items.sum(:total_cents) : self.total_cents
      validate_publishable!(total_cents)
      update!(status: 'published', published_at: Time.current, total_cents: total_cents)
    end
  end

  private

  def validate_publishable!(total_cents)
    documentary = items.empty? && documents.attached?
    errors.add(:items, 'adicione pelo menos um item ou um PDF antes de publicar') if items.empty? && !documentary
    errors.add(:total_cents, 'deve ser maior que zero') if total_cents <= 0
    errors.add(:terms, 'adicione pelo menos uma condição comercial') if terms.empty? && !documentary
    errors.add(:valid_until, 'informe uma validade futura') if valid_until.blank? || valid_until < Date.current
    raise ActiveRecord::RecordInvalid, self if errors.any?
  end

  def immutable_after_publishing
    if status_was == 'published' && (changed? || attachment_changes.any?)
      errors.add(:base, 'Versão publicada não pode ser alterada')
    end
  end
end

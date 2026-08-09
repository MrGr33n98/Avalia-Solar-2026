class BannerAddonSubscription < ApplicationRecord
  belongs_to :company
  belongs_to :banner, optional: true
  belongs_to :banner_addon

  validates :price_paid_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true
  validates :idempotency_key, uniqueness: { scope: :company_id }, allow_nil: true
  validate :ends_at_after_starts_at

  STATUSES = %w[pending_payment scheduled active expired cancelled refunded].freeze
  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: 'active') }
  scope :pending, -> { where(status: 'pending_payment') }
  
  # Delegate rule reading to snapshot for safety (keeps historical value)
  def effective_rules
    addon_snapshot['rules'] || banner_addon.rules
  end
  
  def effective_benefits
    addon_snapshot['benefits'] || banner_addon.benefits
  end

  def checkout_product
    banner_addon
  end

  private

  def ends_at_after_starts_at
    return if status == 'pending_payment' && starts_at.blank? && ends_at.blank?
    return if starts_at.blank? || ends_at.blank?
    
    if ends_at <= starts_at
      errors.add(:ends_at, "must be after the start date")
    end
  end
end

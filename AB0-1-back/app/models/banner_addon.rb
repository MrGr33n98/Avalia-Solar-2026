class BannerAddon < ApplicationRecord
  has_many :banner_addon_subscriptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_days, numericality: { greater_than: 0 }

  scope :active, -> { where(is_active: true) }

  def current_price_cents
    promotional_price_cents.presence || price_cents
  end
end

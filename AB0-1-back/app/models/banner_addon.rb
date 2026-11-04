class BannerAddon < ApplicationRecord
  alias_attribute :active, :is_active

  has_many :banner_addon_subscriptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_days, numericality: { greater_than: 0 }

  scope :active, -> { where(is_active: true) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id name code category active is_active created_at updated_at]
  end

  def current_price_cents
    promotional_price_cents.presence || price_cents
  end
end

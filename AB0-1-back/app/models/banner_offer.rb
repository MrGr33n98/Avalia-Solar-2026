class BannerOffer < ApplicationRecord
  has_many :banner_subscriptions, dependent: :restrict_with_error

  validates :name, :currency, :duration_days, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_days, numericality: { greater_than: 0 }

  def rules
    (rules_json || {}).deep_stringify_keys
  end

  def max_active_per_position
    v = rules['max_active_per_position']
    v.is_a?(Integer) ? v : nil
  end

  def requires_moderation?
    !!rules['requires_moderation']
  end

  def allowed_positions
    Array(rules['positions']).map(&:to_s)
  end

  def allowed_banner_types
    Array(rules['banner_types']).map(&:to_s)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id name price_cents currency duration_days active created_at updated_at]
  end
end

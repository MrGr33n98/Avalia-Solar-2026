class ProductOffer < ApplicationRecord
  belongs_to :company_product

  enum status: { active: 'active', inactive: 'inactive', unavailable: 'unavailable' }, _suffix: true

  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :stock, :lead_time_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  scope :visible, -> { active_status }
end

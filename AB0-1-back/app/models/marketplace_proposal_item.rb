class MarketplaceProposalItem < ApplicationRecord
  belongs_to :version, class_name: 'MarketplaceProposalVersion'

  validates :name, presence: true
  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_price_cents, :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  before_validation :calculate_total

  def calculate_total!
    update!(total_cents: calculated_total)
  end

  private

  def calculate_total
    self.total_cents = calculated_total
  end

  def calculated_total
    (quantity.to_d * unit_price_cents.to_i).round
  end
end

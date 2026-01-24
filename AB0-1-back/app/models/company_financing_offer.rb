class CompanyFinancingOffer < ApplicationRecord
  AMORTIZATION_TYPES = %w[price sac].freeze

  belongs_to :company

  scope :ordered, -> { order(position: :asc, created_at: :asc) }
  scope :active, -> { where(active: true) }

  validates :name, presence: true
  validates :offer_type, presence: true, allow_blank: false
  validates :term_months, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :interest_rate_monthly, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :min_down_payment_percent, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :grace_months, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :amortization_type, inclusion: { in: AMORTIZATION_TYPES }, allow_blank: true
  validates :position, numericality: { only_integer: true }

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[active amortization_type company_id created_at grace_months id interest_rate_monthly min_down_payment_percent name notes offer_type position term_months updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end
end

class CompanyFinancingProfile < ApplicationRecord
  AMORTIZATION_TYPES = %w[price sac].freeze

  belongs_to :company

  enum status: { draft: 'draft', published: 'published' }, _default: 'draft'

  validates :currency, presence: true
  validates :disclaimer, presence: true
  validates :amortization_type, inclusion: { in: AMORTIZATION_TYPES }, allow_blank: true
  validates :max_grace_months, numericality: { greater_than_or_equal_to: 0, allow_nil: true }

  def defaults_hash
    {
      amount_cents: default_amount_cents,
      down_payment_percent: default_down_payment_percent,
      term_months: default_term_months,
      interest_rate_monthly: default_interest_rate_monthly
    }
  end

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[amortization_type company_id created_at currency default_amount_cents default_down_payment_percent default_interest_rate_monthly default_term_months disclaimer id max_grace_months status updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end
end

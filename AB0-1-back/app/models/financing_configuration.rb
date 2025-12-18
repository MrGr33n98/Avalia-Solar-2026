class FinancingConfiguration < ApplicationRecord
  has_paper_trail

  enum financing_type: {
    sac: 0,
    price: 1,
    custom: 2,
    solar: 3,
    rural: 4
  }

  validates :name, presence: true
  validates :financing_type, presence: true
  
  validates :interest_rate_fixed, numericality: { greater_than_or_equal_to: 0 }
  validates :interest_rate_variable, numericality: { greater_than_or_equal_to: 0 }
  
  validates :grace_period_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  
  validates :min_installments, numericality: { only_integer: true, greater_than: 0 }
  validates :max_installments, numericality: { only_integer: true, greater_than: 0 }
  
  validates :min_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :max_amount, numericality: { greater_than_or_equal_to: 0 }

  validate :max_installments_greater_than_min
  validate :max_amount_greater_than_min

  scope :active, -> { where(active: true) }

  def grace_period_months
    (grace_period_days / 30.0).round(1)
  end

  def grace_period_years
    (grace_period_days / 365.0).round(1)
  end

  private

  def max_installments_greater_than_min
    return if max_installments.blank? || min_installments.blank?
    if max_installments < min_installments
      errors.add(:max_installments, "deve ser maior ou igual ao mínimo de parcelas")
    end
  end

  def max_amount_greater_than_min
    return if max_amount.blank? || min_amount.blank?
    if max_amount < min_amount
      errors.add(:max_amount, "deve ser maior ou igual ao valor mínimo")
    end
  end
end

class FinancingOption < ApplicationRecord
  TARGET_AUDIENCES = %w[PF PJ Rural].freeze
  AMORTIZATION_SYSTEMS = %w[price sac].freeze

  belongs_to :company, optional: true
  belongs_to :financial_institution, optional: true

  scope :active_only, -> { where(active: true) }
  scope :valid_now, -> { where('(valid_from IS NULL OR valid_from <= ?) AND (valid_until IS NULL OR valid_until >= ?)', Date.current, Date.current) }
  scope :ordered, -> { order(display_order: :asc, credit_line: :asc) }

  validates :credit_line, presence: true
  validates :target_audience, inclusion: { in: TARGET_AUDIENCES }, allow_blank: true
  validates :target_audience, presence: true, if: :active?
  validates :amortization_system, inclusion: { in: AMORTIZATION_SYSTEMS }, allow_blank: true
  validates :max_term_months, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, allow_nil: true
  validates :grace_period_months, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :interest_rate_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 50 }, allow_nil: true
  validates :minimum_project_value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :maximum_project_value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :minimum_down_payment_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :maximum_down_payment_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  
  validate :validate_grace_period_within_term
  validate :validate_project_value_range
  validate :validate_down_payment_range

  def filters
    {
      services: (service_filters || '').split(',').map(&:strip).reject(&:blank?),
      projects: (project_filters || '').split(',').map(&:strip).reject(&:blank?),
      categories: (category_filters || '').split(',').map(&:strip).reject(&:blank?)
    }
  end

  private

  def validate_project_value_range
    return if minimum_project_value.blank? || maximum_project_value.blank?
    return if minimum_project_value <= maximum_project_value

    errors.add(:minimum_project_value, 'deve ser menor ou igual ao valor máximo')
  end

  def validate_down_payment_range
    return if minimum_down_payment_percentage.blank? || maximum_down_payment_percentage.blank?
    return if minimum_down_payment_percentage <= maximum_down_payment_percentage

    errors.add(:minimum_down_payment_percentage, 'deve ser menor ou igual ao percentual máximo')
  end

  def validate_grace_period_within_term
    return if grace_period_months.blank? || max_term_months.blank?
    return if grace_period_months <= max_term_months

    errors.add(:grace_period_months, 'deve ser menor ou igual ao prazo máximo')
  end
end

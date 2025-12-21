class FinancingOption < ApplicationRecord
  TARGET_AUDIENCES = %w[PF PJ Rural].freeze

  belongs_to :company

  scope :active_only, -> { where(active: true) }

  validates :institution_name, presence: true, if: :active?
  validates :credit_line, presence: true
  validates :target_audience, inclusion: { in: TARGET_AUDIENCES }, allow_blank: true
  validates :target_audience, presence: true, if: :active?
  validates :max_term_months, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, allow_nil: true
  validates :grace_period_months, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :interest_rate_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 50 }, allow_nil: true
  validate :validate_grace_period_within_term

  def filters
    {
      services: (service_filters || '').split(',').map(&:strip).reject(&:blank?),
      projects: (project_filters || '').split(',').map(&:strip).reject(&:blank?),
      categories: (category_filters || '').split(',').map(&:strip).reject(&:blank?)
    }
  end

  private

  def validate_grace_period_within_term
    return if grace_period_months.blank? || max_term_months.blank?
    return if grace_period_months <= max_term_months

    errors.add(:grace_period_months, 'deve ser menor ou igual ao prazo máximo')
  end
end

class FinancingOption < ApplicationRecord
  TARGET_AUDIENCES = %w[PF PJ Rural].freeze

  belongs_to :company

  scope :active_only, -> { where(active: true) }

  validates :institution_name, :credit_line, presence: true
  validates :target_audience, inclusion: { in: TARGET_AUDIENCES }
  validates :max_term_months, :grace_period_months, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :interest_rate_percent, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def filters
    {
      services: (service_filters || '').split(',').map(&:strip).reject(&:blank?),
      projects: (project_filters || '').split(',').map(&:strip).reject(&:blank?),
      categories: (category_filters || '').split(',').map(&:strip).reject(&:blank?)
    }
  end
end

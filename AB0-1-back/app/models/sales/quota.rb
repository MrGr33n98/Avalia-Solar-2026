# frozen_string_literal: true

module Sales
  class Quota < ApplicationRecord
    self.table_name = 'sales_quotas'

    belongs_to :company, optional: true
    belongs_to :user
    belongs_to :pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id, optional: true

    PERIOD_TYPES = %w[monthly quarterly yearly].freeze

    validates :period_type, inclusion: { in: PERIOD_TYPES }
    validates :starts_on, :ends_on, presence: true
    validates :target_revenue_cents, numericality: { greater_than_or_equal_to: 0 }
    validates :target_deals_count, numericality: { greater_than_or_equal_to: 0 }
    validate :ends_on_after_starts_on

    scope :for_period, ->(date = Date.current) { where('starts_on <= ? AND ends_on >= ?', date, date) }

    def attainment_percent(actual_revenue_cents)
      return 0.0 if target_revenue_cents.zero?

      ((actual_revenue_cents.to_f / target_revenue_cents) * 100).round(1)
    end

    def ideal_pace_percent(reference_date = Date.current)
      total_days = (ends_on - starts_on).to_i + 1
      return 100.0 if total_days <= 0
      return 0.0 if reference_date < starts_on
      return 100.0 if reference_date >= ends_on

      elapsed_days = (reference_date - starts_on).to_i + 1
      ((elapsed_days.to_f / total_days) * 100).round(1)
    end

    private

    def ends_on_after_starts_on
      return unless starts_on && ends_on
      errors.add(:ends_on, 'deve ser posterior à data inicial') if ends_on < starts_on
    end
  end
end

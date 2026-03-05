class AnalyticsReconciliation < ApplicationRecord
  validates :company_id, :day, :metric_name, presence: true
  validates :status, inclusion: { in: %w[ok warn critical] }

  belongs_to :company, optional: true

  # Thresholds P0
  THRESHOLD_WARN = 2.0
  THRESHOLD_CRITICAL = 5.0

  def self.calculate_status(delta_percent)
    abs_delta = delta_percent.abs
    if abs_delta >= THRESHOLD_CRITICAL
      'critical'
    elsif abs_delta >= THRESHOLD_WARN
      'warn'
    else
      'ok'
    end
  end
end

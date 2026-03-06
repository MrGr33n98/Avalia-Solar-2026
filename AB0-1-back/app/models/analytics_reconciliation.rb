class AnalyticsReconciliation < ApplicationRecord
  validates :company_id, :day, :metric_name, presence: true
  validates :status, inclusion: { in: %w[ok warn critical] }

  belongs_to :company, optional: true

  # Thresholds P0 (Configurable via ENV)
  THRESHOLD_WARN = ENV.fetch('ANALYTICS_RECON_WARN', 2.0).to_f
  THRESHOLD_CRITICAL = ENV.fetch('ANALYTICS_RECON_CRITICAL', 5.0).to_f

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

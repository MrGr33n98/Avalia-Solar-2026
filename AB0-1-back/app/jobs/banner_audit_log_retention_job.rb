class BannerAuditLogRetentionJob < ApplicationJob
  queue_as :maintenance

  DEFAULT_RETENTION_MONTHS = 24

  def perform(now = Time.current)
    now = Time.zone.parse(now.to_s) unless now.is_a?(Time) || now.is_a?(ActiveSupport::TimeWithZone)
    months = ENV.fetch('BANNER_AUDIT_RETENTION_MONTHS', DEFAULT_RETENTION_MONTHS).to_i
    months = DEFAULT_RETENTION_MONTHS if months <= 0
    cutoff = now - months.months
    eligible = BannerAuditLog.where('created_at < ?', cutoff)
                             .where.not(action: 'suspicious_export_alert')
    oldest_created_at = eligible.minimum(:created_at)
    oldest_age_days = oldest_created_at ? ((now - oldest_created_at) / 1.day).floor : 0
    candidates = eligible.count
    Banners::Metrics.retention(candidates: candidates, oldest_age_days: oldest_age_days)
    result = { cutoff: cutoff, candidates: candidates, oldest_created_at: oldest_created_at,
              oldest_age_days: oldest_age_days, dry_run: true }
    Rails.logger.warn("[BannerAuditLogRetentionJob] #{result.to_json}") if result[:candidates].positive?
    result
  end
end

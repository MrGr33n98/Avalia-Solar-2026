class BannerEventRetentionAuditJob < ApplicationJob
  queue_as :maintenance

  DEFAULT_RETENTION_MONTHS = 24

  def perform(now = Time.current)
    now = Time.zone.parse(now.to_s) unless now.is_a?(Time) || now.is_a?(ActiveSupport::TimeWithZone)
    months = ENV.fetch('BANNER_EVENTS_RETENTION_MONTHS', DEFAULT_RETENTION_MONTHS).to_i
    months = DEFAULT_RETENTION_MONTHS if months <= 0
    cutoff = now - months.months
    scope = BannerEvent.where('tracked_at < ?', cutoff)
    oldest_tracked_at = scope.minimum(:tracked_at)
    oldest_age_days = oldest_tracked_at ? ((now - oldest_tracked_at) / 1.day).floor : 0
    result = { cutoff: cutoff, candidates: scope.count, oldest_tracked_at: oldest_tracked_at }
    Banners::Metrics.retention(candidates: result[:candidates], oldest_age_days: oldest_age_days)
    Rails.logger.warn("[BannerEventRetentionAuditJob] #{result.to_json}") if result[:candidates].positive?
    result
  end
end

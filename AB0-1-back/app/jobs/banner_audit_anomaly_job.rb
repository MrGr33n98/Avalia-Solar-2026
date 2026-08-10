class BannerAuditAnomalyJob < ApplicationJob
  queue_as :maintenance

  WINDOW_HOURS = 24
  COOLDOWN_HOURS = 6
  THRESHOLD = BannerAuditLogAnalytics::SUSPICIOUS_EXPORT_THRESHOLD

  def perform(now = Time.current)
    now = Time.zone.parse(now.to_s) unless now.is_a?(Time) || now.is_a?(ActiveSupport::TimeWithZone)
    metrics = BannerAuditLogAnalytics.call(
      relation: BannerAuditLog.where(action: 'export_incidents'), days: 1, now: now
    )
    alerted = metrics[:suspicious_actors].count do |actor|
      create_alert!(actor, now) unless cooldown_active?(actor, now)
    end

    { candidates: metrics[:suspicious_actors].size, alerted: alerted }
  end

  private

  def create_alert!(actor, now)
    BannerAuditLog.create!(
      auditable_type: actor[:actor_type], auditable_id: actor[:actor_id], action: 'suspicious_export_alert',
      source: 'banner_audit_anomaly_job', actor_type: actor[:actor_type], actor_id: actor[:actor_id],
      metadata_json: { 'count' => actor[:count], 'threshold' => THRESHOLD,
                       'window_hours' => WINDOW_HOURS, 'status' => 'open', 'detected_at' => now.iso8601 }
    )
  end

  def cooldown_active?(actor, now)
    BannerAuditLog.where(action: 'suspicious_export_alert', actor_type: actor[:actor_type], actor_id: actor[:actor_id])
                  .where('created_at >= ?', now - COOLDOWN_HOURS.hours).exists?
  end
end

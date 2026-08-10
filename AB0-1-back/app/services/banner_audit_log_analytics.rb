class BannerAuditLogAnalytics
  DEFAULT_DAYS = 30
  SUSPICIOUS_EXPORT_THRESHOLD = 10

  def self.call(relation: BannerAuditLog.all, days: DEFAULT_DAYS, now: Time.current)
    new(relation: relation, days: days, now: now).call
  end

  def initialize(relation:, days:, now:)
    @days = [days.to_i, 1].max
    @relation = relation.where('created_at >= ?', now - @days.days)
    @now = now
  end

  def call
    exports = @relation.where(action: 'export_incidents')
    by_actor = exports.group(:actor_type, :actor_id).count
    {
      total: @relation.count,
      exports: exports.count,
      period_days: @days,
      by_day: exports.group('DATE(created_at)').count.transform_keys(&:to_s),
      top_actors: top_actors(by_actor),
      suspicious_actors: top_actors(by_actor).select { |actor| actor[:count] >= SUSPICIOUS_EXPORT_THRESHOLD }
    }
  end

  private

  def top_actors(counts)
    counts.map do |(actor_type, actor_id), count|
      { actor_type: actor_type, actor_id: actor_id, count: count }
    end.sort_by { |actor| -actor[:count] }.first(10)
  end
end

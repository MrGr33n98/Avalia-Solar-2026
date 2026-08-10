class BannerSubscriptionExpirationJob < ApplicationJob
  queue_as :default

  def perform(now = Time.current)
    now = Time.zone.parse(now.to_s) unless now.is_a?(Time) || now.is_a?(ActiveSupport::TimeWithZone)
    scope = BannerSubscription.where(status: 'active').where('ends_at IS NOT NULL AND ends_at <= ?', now)
    count = scope.update_all(status: 'expired', updated_at: now)
    Rails.logger.info("[BannerSubscriptionExpirationJob] Expired #{count} subscriptions")
    count
  end
end

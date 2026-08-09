class BannerAddonExpirationJob < ApplicationJob
  queue_as :default

  def perform
    expired_subscriptions = BannerAddonSubscription.active.where('ends_at <= ?', Time.current)

    expired_subscriptions.find_each do |subscription|
      BannerAddons::LifecycleService.new(subscription).expire!
    end
  end
end

class BannerDeliveryPolicy
  def initialize(banner)
    @banner = banner
  end

  def effective_priority
    # Base priority from the banner itself
    base = @banner.priority || 0

    # Increase priority for active addons that boost priority
    boost = active_subscriptions.sum do |sub|
      sub.effective_benefits['priority_boost'].to_i
    end

    base + boost
  end

  def eligible_placements
    # Placements defined in the banner + placements granted by addons
    base_placements = @banner.placements || []
    
    addon_placements = active_subscriptions.flat_map do |sub|
      sub.effective_benefits['placements'] || []
    end

    (base_placements + addon_placements).uniq
  end

  def has_feature?(feature_key)
    active_subscriptions.any? do |sub|
      features = sub.effective_benefits['features'] || []
      features.include?(feature_key)
    end
  end

  private

  def active_subscriptions
    @active_subscriptions ||= @banner.banner_addon_subscriptions.active
  end
end

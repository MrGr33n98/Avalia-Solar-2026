module Payments
  class BannerSubscriptionResolver
    def self.find_by_checkout_session(session_id)
      # Try the new system first
      sub = BannerAddonSubscription.find_by(checkout_session_id: session_id)
      return { type: :new, subscription: sub } if sub

      # Fallback to legacy
      legacy_sub = BannerSubscription.find_by(checkout_session_id: session_id)
      return { type: :legacy, subscription: legacy_sub } if legacy_sub

      nil
    end
  end
end

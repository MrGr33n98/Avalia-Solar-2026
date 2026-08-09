module BannerAddons
  class LifecycleService
    def initialize(subscription, actor: nil)
      @subscription = subscription
      @actor = actor
    end

    def activate!
      return false if @subscription.status == 'active'

      ActiveRecord::Base.transaction do
        @subscription.update!(
          status: 'active',
          starts_at: Time.current,
          ends_at: Time.current + @subscription.banner_addon.duration_days.days,
          activated_at: Time.current,
          addon_snapshot: {
            'rules' => @subscription.banner_addon.rules,
            'benefits' => @subscription.banner_addon.benefits,
            'price_cents' => @subscription.banner_addon.price_cents,
            'currency' => @subscription.banner_addon.currency
          }
        )

        log_action('activate')
      end
      true
    end

    def expire!
      return false unless @subscription.status == 'active'
      return false if @subscription.ends_at > Time.current

      ActiveRecord::Base.transaction do
        @subscription.update!(status: 'expired')
        log_action('expire')
      end
      true
    end

    def cancel!(reason: nil)
      return false if %w[cancelled refunded expired].include?(@subscription.status)

      ActiveRecord::Base.transaction do
        @subscription.update!(
          status: 'cancelled',
          cancelled_at: Time.current
        )
        log_action('cancel', reason: reason)
      end
      true
    end

    private

    def log_action(action_name, reason: nil)
      BannerAuditLog.create!(
        auditable: @subscription,
        actor: @actor,
        action: action_name,
        reason: reason,
        source: 'system',
        changes_json: @subscription.saved_changes
      )
    end
  end
end

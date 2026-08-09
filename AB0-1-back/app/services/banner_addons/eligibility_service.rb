module BannerAddons
  class EligibilityService
    def initialize(company:, banner:, addon:)
      @company = company
      @banner = banner
      @addon = addon
    end

    def call
      return error("addon_not_active") unless @addon.is_active?
      return error("banner_does_not_belong_to_company") if @banner.company_id != @company.id
      
      # Check if already has an active subscription for this addon
      active_sub = BannerAddonSubscription.where(
        banner: @banner,
        banner_addon: @addon,
        status: 'active'
      ).where("ends_at > ?", Time.current).exists?
      
      return error("addon_already_active_for_banner") if active_sub

      success
    end

    private

    def success
      {
        eligible: true,
        effective_price_cents: @addon.current_price_cents,
        error: nil
      }
    end

    def error(message)
      {
        eligible: false,
        effective_price_cents: nil,
        error: message
      }
    end
  end
end

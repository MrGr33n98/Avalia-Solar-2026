module Banners
  class CompanyBannerQuotaService
    def self.call(company)
      new(company).call
    end

    def initialize(company)
      @company = company
    end

    def call
      feature_access = @company.feature_access
      promo_banner = feature_access['promo_banner']
      
      # Base plan limit from JSON features or EntitlementService
      plan_limit = EntitlementService.new(@company).check('ads.campaigns.active.max') || @company.feature_value_from_plan('max_banners', 'banner_limit')
      
      base_limit = if plan_limit.nil?
                     1 # Default fallback instead of checking inferred_plan_tier
                   elsif plan_limit.to_s.strip.downcase == 'unlimited'
                     nil
                   else
                     plan_limit.to_i
                   end

      extra_capacity = 0
      limit = base_limit.nil? ? nil : base_limit + extra_capacity
      used = active_banners_count
      
      remaining = limit.nil? ? nil : [limit - used, 0].max
      can_activate = remaining.nil? || remaining > 0

      # Check if feature is enabled at all
      is_enabled = promo_banner && promo_banner['state'] == 'enabled'

      {
        active_used: used,
        active_limit: limit,
        active_remaining: remaining,
        can_activate: is_enabled && can_activate,
        can_create_draft: is_enabled,
        can_create: is_enabled # Legacy support
      }
    end

    private

    def active_banners_count
      @company.banners.where(active: true, moderation_status: 'approved').count
    end
  end
end

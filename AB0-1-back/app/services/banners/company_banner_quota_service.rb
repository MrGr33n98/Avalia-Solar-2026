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
      
      unless promo_banner && promo_banner['state'] == 'enabled'
        return { 
          used: active_banners_count, 
          limit: 0, 
          remaining: 0, 
          can_create: false 
        }
      end

      # Base plan limit from JSON features (max_banners or banner_limit)
      plan_limit = @company.feature_value_from_plan('max_banners', 'banner_limit')
      
      # Determine base limit (integer or nil for unlimited)
      base_limit = if plan_limit.nil?
                     fallback_limit
                   elsif plan_limit.to_s.strip.downcase == 'unlimited'
                     nil
                   else
                     plan_limit.to_i
                   end

      # Future: Add extra capacity from active Add-ons here if they start selling quota
      extra_capacity = 0
      
      limit = base_limit.nil? ? nil : base_limit + extra_capacity
      used = active_banners_count
      
      remaining = limit.nil? ? nil : [limit - used, 0].max
      can_create = remaining.nil? || remaining > 0

      {
        used: used,
        limit: limit,
        remaining: remaining,
        can_create: can_create
      }
    end

    private

    def active_banners_count
      @company.banners.where(active: true, moderation_status: 'approved').count
    end

    def fallback_limit
      # Fallback for legacy plans that don't have max_banners in their feature JSON
      case @company.inferred_plan_tier
      when 'enterprise' then nil # Unlimited for enterprise
      when 'pro' then 3
      else 1
      end
    end
  end
end

module Banners
  class CompanyBannerQuotaService
    def self.call(company)
      new(company).call
    end

    def initialize(company)
      @company = company
    end

    def call
      feature_access = @company.feature_access rescue {}
      promo_banner = feature_access ? feature_access['promo_banner'] : nil
      is_enabled = promo_banner && promo_banner['state'] == 'enabled'

      used = active_banners_count

      unless is_enabled
        return {
          active_used: used,
          active_limit: 0,
          active_remaining: 0,
          can_activate: false,
          can_create_draft: false,
          can_create: false,
          used: used,
          limit: 0,
          remaining: 0
        }
      end

      # Base plan limit from EntitlementService or company JSON plan features
      entitlement_val = begin
        if defined?(EntitlementService)
          EntitlementService.limit(company: @company, feature: 'ads.campaigns.active.max')
        end
      rescue StandardError => e
        Rails.logger.warn("[CompanyBannerQuotaService] EntitlementService error: #{e.message}")
        nil
      end

      plan_limit = entitlement_val || @company.feature_value_from_plan('max_banners', 'banner_limit')

      base_limit = if plan_limit.nil?
                     fallback_limit
                   elsif plan_limit.to_s.strip.downcase == 'unlimited'
                     nil
                   else
                     plan_limit.to_i
                   end

      extra_capacity = 0
      limit = base_limit.nil? ? nil : base_limit + extra_capacity

      remaining = limit.nil? ? nil : [limit - used, 0].max
      can_activate = remaining.nil? || remaining > 0

      {
        active_used: used,
        active_limit: limit,
        active_remaining: remaining,
        can_activate: is_enabled && can_activate,
        can_create_draft: is_enabled,
        can_create: is_enabled && can_activate, # Legacy support
        # Backward compatibility with existing tests and legacy consumers:
        used: used,
        limit: limit,
        remaining: remaining
      }
    end

    private

    def active_banners_count
      return 0 unless @company&.banners

      @company.banners.where(active: true, moderation_status: 'approved').count
    end

    def fallback_limit
      tier = @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier.to_s.downcase : nil
      case tier
      when 'enterprise' then nil # Unlimited for enterprise
      when 'pro' then 3
      else 1
      end
    end
  end
end

# app/models/concerns/cache_invalidator.rb

module CacheInvalidator
  extend ActiveSupport::Concern

  included do
    after_save :invalidate_dashboard_cache
    after_destroy :invalidate_dashboard_cache
  end

  private

  def invalidate_dashboard_cache
    case self.class.name
    when 'Company'
      invalidate_company_cache
    when 'Review'
      invalidate_review_cache
    when 'Lead'
      invalidate_lead_cache
    end
  end

  def invalidate_company_cache
    Rails.cache.delete('admin:dashboard:metrics')
    Rails.cache.delete('admin:dashboard:rankings')
  end

  def invalidate_review_cache
    Rails.cache.delete('admin:dashboard:metrics')
    Rails.cache.delete('admin:dashboard:rankings')
  end

  def invalidate_lead_cache
    Rails.cache.delete('admin:dashboard:metrics')
  end
end

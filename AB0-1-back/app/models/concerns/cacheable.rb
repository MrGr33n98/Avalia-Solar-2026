# frozen_string_literal: true

# Cacheable concern - TASK-015, 016
# Provides caching helpers for models
module Cacheable
  extend ActiveSupport::Concern

  class_methods do
    # Cache a query result
    # Example: Company.cache_query('all_active') { Company.active.includes(:reviews) }
    def cache_query(key, expires_in: 1.hour, &block)
      cache_key = "#{model_name.cache_key}/#{key}"
      Rails.cache.fetch(cache_key, expires_in: expires_in, &block)
    end

    # Cache count queries
    # Example: Company.cache_count('active') { Company.active.count }
    def cache_count(key, expires_in: 5.minutes, &block)
      cache_key = "#{model_name.cache_key}/count/#{key}"
      Rails.cache.fetch(cache_key, expires_in: expires_in, &block)
    end

    # Expire all caches for this model
    def expire_cache(pattern = nil)
      if pattern
        Rails.cache.delete_matched("#{model_name.cache_key}/#{pattern}*")
      else
        Rails.cache.delete_matched("#{model_name.cache_key}/*")
      end
    end
  end

  included do
    # Auto-expire cache on save/destroy
    after_save :expire_model_cache
    after_destroy :expire_model_cache
    after_touch :expire_model_cache
  end

  # Instance method to get cache key
  def cache_key_with_version
    "#{model_name.cache_key}/#{id}-#{cache_version}"
  end

  # Cache version (uses updated_at by default)
  def cache_version
    updated_at.to_i
  end

  private

  def expire_model_cache
    self.class.expire_cache
  end
end

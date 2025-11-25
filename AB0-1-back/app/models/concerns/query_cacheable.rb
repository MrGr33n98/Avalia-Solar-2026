# frozen_string_literal: true

# TASK-016: Query Caching Concern
# Provides query caching utilities for ActiveRecord models
#
# Usage:
#   class Category < ApplicationRecord
#     include QueryCacheable
#
#     cacheable_query :featured_categories, expires_in: 1.hour do
#       where(featured: true).includes(:products).limit(10)
#     end
#   end
#
#   # Usage
#   Category.featured_categories # Cached automatically

module QueryCacheable
  extend ActiveSupport::Concern

  class_methods do
    # Define a cacheable query method
    #
    # @param method_name [Symbol] Name of the method to define
    # @param options [Hash] Options including :expires_in, :cache_key
    # @yield Block that returns ActiveRecord::Relation
    #
    # Example:
    #   cacheable_query :active_products, expires_in: 30.minutes do
    #     where(active: true).order(created_at: :desc)
    #   end
    def cacheable_query(method_name, options = {}, &block)
      expires_in = options[:expires_in] || 15.minutes
      custom_cache_key = options[:cache_key]

      define_singleton_method(method_name) do |force_refresh: false|
        cache_key = custom_cache_key || "#{name.underscore}/#{method_name}/#{maximum(:updated_at)&.to_i}"

        if force_refresh
          Rails.logger.debug("🔄 Force refresh for: #{cache_key}")
          Rails.cache.delete(cache_key)
        end

        Rails.cache.fetch(cache_key, expires_in: expires_in, race_condition_ttl: 5.seconds) do
          Rails.logger.debug("💾 Cache MISS for query: #{cache_key}")
          instance_eval(&block).to_a
        end
      end

      # Define a method to clear the cache
      define_singleton_method("clear_#{method_name}_cache") do
        cache_key = custom_cache_key || "#{name.underscore}/#{method_name}"
        if defined?(REDIS) && REDIS
          keys = REDIS.keys("cache:#{cache_key}*")
          keys.each { |key| Rails.cache.delete(key.sub('cache:', '')) }
          Rails.logger.info("🗑️  Cleared #{keys.size} cache keys for #{method_name}")
        else
          Rails.cache.delete_matched("#{cache_key}*")
        end
      end
    end

    # Cache a finder query
    #
    # @param id [Integer] Record ID
    # @param includes [Array] Associations to eager load
    # @return [ActiveRecord::Base, nil]
    def cached_find(id, includes: [], expires_in: 1.hour)
      cache_key = "#{name.underscore}/find/#{id}"
      
      Rails.cache.fetch(cache_key, expires_in: expires_in) do
        relation = includes.any? ? self.includes(*includes) : self
        relation.find_by(id: id)
      end
    end

    # Cache a find_by query
    #
    # @param conditions [Hash] Query conditions
    # @param includes [Array] Associations to eager load
    # @return [ActiveRecord::Base, nil]
    def cached_find_by(conditions, includes: [], expires_in: 15.minutes)
      cache_key = "#{name.underscore}/find_by/#{Digest::MD5.hexdigest(conditions.to_json)}"
      
      Rails.cache.fetch(cache_key, expires_in: expires_in) do
        relation = includes.any? ? self.includes(*includes) : self
        relation.find_by(conditions)
      end
    end

    # Cache a count query
    #
    # @param conditions [Hash] Query conditions (optional)
    # @return [Integer]
    def cached_count(conditions = {}, expires_in: 30.minutes)
      cache_key = if conditions.any?
                    "#{name.underscore}/count/#{Digest::MD5.hexdigest(conditions.to_json)}"
                  else
                    "#{name.underscore}/count/all"
                  end

      Rails.cache.fetch(cache_key, expires_in: expires_in) do
        conditions.any? ? where(conditions).count : count
      end
    end

    # Cache exists? query
    #
    # @param conditions [Hash] Query conditions
    # @return [Boolean]
    def cached_exists?(conditions, expires_in: 15.minutes)
      cache_key = "#{name.underscore}/exists/#{Digest::MD5.hexdigest(conditions.to_json)}"
      
      Rails.cache.fetch(cache_key, expires_in: expires_in) do
        exists?(conditions)
      end
    end

    # Clear all caches for this model
    def clear_model_cache
      if defined?(REDIS) && REDIS
        pattern = "#{name.underscore}/*"
        keys = REDIS.keys("cache:#{pattern}")
        keys.each { |key| Rails.cache.delete(key.sub('cache:', '')) }
        Rails.logger.info("🗑️  Cleared #{keys.size} cache keys for #{name}")
        keys.size
      else
        Rails.cache.delete_matched("#{name.underscore}/*")
        0
      end
    end
  end

  included do
    # Clear cache after commit (create, update, destroy)
    after_commit :clear_related_caches, if: :should_clear_cache?

    private

    def clear_related_caches
      # Clear model-level caches
      self.class.clear_model_cache if respond_to?(:clear_model_cache)
      
      # Clear instance cache
      clear_instance_cache
      
      Rails.logger.info("🗑️  Cleared caches for #{self.class.name}##{id}")
    end

    def clear_instance_cache
      cache_key = "#{self.class.name.underscore}/find/#{id}"
      Rails.cache.delete(cache_key)
    end

    def should_clear_cache?
      # Can be overridden in models to customize when to clear cache
      true
    end
  end

  # Instance methods

  # Cache expensive calculations on an instance
  #
  # @param method_name [Symbol] Method name
  # @param expires_in [ActiveSupport::Duration] Expiration time
  # @yield Block that returns the value to cache
  # @return [Object] Cached or calculated value
  def cache_method(method_name, expires_in: 1.hour, &block)
    cache_key = "#{self.class.name.underscore}/#{id}/#{method_name}/#{updated_at.to_i}"
    
    Rails.cache.fetch(cache_key, expires_in: expires_in, &block)
  end

  # Clear cache for this specific instance
  def clear_cache!
    pattern = "#{self.class.name.underscore}/#{id}"
    
    if defined?(REDIS) && REDIS
      keys = REDIS.keys("cache:#{pattern}*")
      keys.each { |key| Rails.cache.delete(key.sub('cache:', '')) }
      Rails.logger.info("🗑️  Cleared #{keys.size} cache keys for #{self.class.name}##{id}")
      keys.size
    else
      Rails.cache.delete_matched("#{pattern}*")
      0
    end
  end
end

# frozen_string_literal: true

# TASK-015: Fragment Caching Concern
# Provides caching utilities for API controllers
#
# Usage:
#   class Api::V1::ArticlesController < Api::V1::BaseController
#     include Cacheable
#
#     def index
#       cache_key = cache_key_for('articles', params)
#       cached_json(cache_key, expires_in: 15.minutes) do
#         @articles = Article.includes(:category).all
#         @articles.map(&:as_json)
#       end
#     end
#   end

module Cacheable
  extend ActiveSupport::Concern

  # Cache a JSON response
  #
  # @param key [String] Cache key
  # @param options [Hash] Options including :expires_in, :skip_cache
  # @yield Block that returns the data to cache
  # @return [void] Renders JSON response
  def cached_json(key, options = {}, &block)
    skip_cache = options[:skip_cache] || params[:skip_cache].present?
    expires_in = options[:expires_in] || 15.minutes

    if skip_cache
      Rails.logger.debug("🔄 Cache SKIPPED for key: #{key}")
      data = yield
      render json: data
      return
    end

    # Try to fetch from cache
    cached_data = Rails.cache.fetch(key, expires_in: expires_in, race_condition_ttl: 5.seconds) do
      Rails.logger.debug("💾 Cache MISS for key: #{key}")
      yield
    end

    Rails.logger.debug("✅ Cache HIT for key: #{key}") if Rails.cache.exist?(key)

    render json: cached_data
  end

  # Generate cache key from controller, action, and params
  #
  # @param resource [String, ActiveRecord::Relation, ActiveRecord::Base] Resource name or object
  # @param params_hash [Hash] Parameters to include in key
  # @return [String] Cache key
  def cache_key_for(resource, params_hash = {})
    controller_name = self.class.name.demodulize.underscore
    action = action_name

    # Extract relevant params
    raw_params = if params_hash.respond_to?(:to_unsafe_h)
                   params_hash.to_unsafe_h
                 else
                   params_hash.to_h
                 end

    cache_params = raw_params.symbolize_keys.slice(:company_id, :category_id, :product_id, :status, :featured, :limit, :page)
                          .compact
                          .sort
                          .to_h

    # Generate key
    key_parts = [controller_name, action, resource]
    key_parts << Digest::MD5.hexdigest(cache_params.to_json) if cache_params.any?

    # Add timestamp for time-based invalidation (optional)
    if resource.respond_to?(:maximum)
      timestamp = resource.maximum(:updated_at)&.to_i
      key_parts << timestamp if timestamp
    end

    key_parts.join('/')
  end

  # Generate cache key for a collection
  #
  # @param collection [ActiveRecord::Relation] ActiveRecord relation
  # @return [String] Cache key based on collection's cache_key
  def collection_cache_key(collection)
    "#{controller_name}/#{action_name}/#{collection.cache_key_with_version}"
  end

  # Expire cache for a resource
  #
  # @param patterns [Array<String>] Cache key patterns to delete
  # @return [Integer] Number of keys deleted
  def expire_cache(*patterns)
    deleted_count = 0

    patterns.each do |pattern|
      if defined?(REDIS) && REDIS
        keys = REDIS.keys("cache:#{pattern}*")
        deleted_count += keys.size
        keys.each { |key| Rails.cache.delete(key.sub('cache:', '')) }
        Rails.logger.info("🗑️  Expired #{keys.size} cache keys matching: #{pattern}")
      else
        # Fallback for non-Redis cache stores
        Rails.cache.delete(pattern)
        deleted_count += 1
        Rails.logger.info("🗑️  Expired cache key: #{pattern}")
      end
    end

    deleted_count
  end

  # Cache wrapper for expensive operations
  #
  # @param key [String] Cache key
  # @param expires_in [ActiveSupport::Duration] Expiration time
  # @yield Block that returns the data to cache
  # @return [Object] Cached or computed result
  def cache_fetch(key, expires_in: 1.hour, &block)
    Rails.cache.fetch(key, expires_in: expires_in, race_condition_ttl: 5.seconds, &block)
  end

  # Check if caching is enabled for current environment
  #
  # @return [Boolean]
  def caching_enabled?
    ActionController::Base.perform_caching
  end

  # Get cache statistics (Redis only)
  #
  # @return [Hash] Cache statistics
  def cache_stats
    return {} unless defined?(REDIS) && REDIS

    info = REDIS.info
    {
      hits: info['keyspace_hits'].to_i,
      misses: info['keyspace_misses'].to_i,
      hit_rate: calculate_hit_rate(info),
      keys_count: REDIS.dbsize,
      memory_used: info['used_memory_human']
    }
  rescue Redis::BaseError => e
    Rails.logger.error("Cache stats error: #{e.message}")
    {}
  end

  private

  def calculate_hit_rate(info)
    hits = info['keyspace_hits'].to_f
    misses = info['keyspace_misses'].to_f
    total = hits + misses

    return 0.0 if total.zero?

    ((hits / total) * 100).round(2)
  end
end

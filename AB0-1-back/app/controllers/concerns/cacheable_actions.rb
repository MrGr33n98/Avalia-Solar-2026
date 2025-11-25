# frozen_string_literal: true

# CacheableActions concern - TASK-015
# Provides action caching helpers for controllers
module CacheableActions
  extend ActiveSupport::Concern

  # Cache an action result
  def cache_action(key, expires_in: 1.hour, &block)
    cache_key = action_cache_key(key)
    
    # Check if cached
    cached = Rails.cache.read(cache_key)
    return cached if cached
    
    # Execute block and cache result
    result = block.call
    Rails.cache.write(cache_key, result, expires_in: expires_in)
    result
  end

  # Cache JSON response
  def cache_json(key, expires_in: 1.hour, &block)
    cache_key = action_cache_key(key)
    
    json_data = Rails.cache.fetch(cache_key, expires_in: expires_in) do
      block.call
    end
    
    # Add cache headers
    response.headers['X-Cache'] = 'HIT'
    response.headers['X-Cache-Key'] = cache_key
    
    render json: json_data
  end

  # HTTP caching with ETag
  def http_cache(record_or_collection, **options)
    if stale?(record_or_collection, **options)
      yield
    end
  end

  # Set cache control headers
  def set_cache_headers(max_age: 1.hour, public: true, must_revalidate: false)
    cache_control = []
    cache_control << (public ? 'public' : 'private')
    cache_control << "max-age=#{max_age.to_i}"
    cache_control << 'must-revalidate' if must_revalidate
    
    response.headers['Cache-Control'] = cache_control.join(', ')
  end

  # Expire action cache
  def expire_action_cache(key)
    cache_key = action_cache_key(key)
    Rails.cache.delete(cache_key)
  end

  private

  def action_cache_key(key)
    [
      controller_name,
      action_name,
      key,
      current_user&.id,
      request.format.to_sym
    ].compact.join('/')
  end
end

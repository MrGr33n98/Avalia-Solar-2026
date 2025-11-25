# TASK-014, 015, 016: Cache configuration for production
# Add this to config/environments/production.rb

# Enable caching
config.cache_classes = true
config.action_controller.perform_caching = true

# Use Redis cache store with connection pooling
config.cache_store = :redis_cache_store, {
  url: ENV.fetch('REDIS_URL'),
  
  # Connection pooling
  pool_size: ENV.fetch('RAILS_MAX_THREADS', 5).to_i,
  pool_timeout: 5,
  
  # Expiration
  expires_in: 1.day,
  race_condition_ttl: 10.seconds,
  
  # Reconnection
  reconnect_attempts: 3,
  
  # Error handling
  error_handler: -> (method:, returning:, exception:) {
    Rails.logger.error "Redis cache error (#{method}): #{exception.message}"
    # Send to error tracking (Sentry)
    # Sentry.capture_exception(exception) if defined?(Sentry)
  },
  
  # Compression for large values
  compress: true,
  compress_threshold: 1.kilobyte
}

# Fragment caching
config.action_controller.enable_fragment_cache_logging = false # Too verbose in production

# Query caching
config.active_record.cache_versioning = true

# Static asset caching
config.public_file_server.headers = {
  'Cache-Control' => "public, max-age=#{1.year.to_i}",
  'Expires' => 1.year.from_now.httpdate
}

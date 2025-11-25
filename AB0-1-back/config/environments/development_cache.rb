# TASK-014, 015, 016: Cache configuration for development
# Add this to config/environments/development.rb

# Enable caching in development
config.cache_classes = false
config.action_controller.perform_caching = true

# Use Redis cache store
config.cache_store = :redis_cache_store, {
  url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'),
  expires_in: 1.hour,
  race_condition_ttl: 10.seconds,
  error_handler: -> (method:, returning:, exception:) {
    Rails.logger.error "Redis cache error (#{method}): #{exception.message}"
  }
}

# Fragment caching
config.action_controller.enable_fragment_cache_logging = true

# Query caching (enabled by default in Rails 7)
config.active_record.cache_versioning = true

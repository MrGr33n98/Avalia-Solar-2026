# frozen_string_literal: true

# Update Rack::Attack to use Redis - TASK-014
# This should be loaded after rack_attack.rb and redis.rb

if defined?(Rack::Attack)
  redis_enabled = ENV.fetch('REDIS_ENABLED', 'true') == 'true'
  
  if redis_enabled && defined?(REDIS)
    begin
      pong = REDIS.respond_to?(:ping) ? REDIS.ping : nil
      if pong == 'PONG'
        Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
          url: ENV.fetch('REDIS_URL', 'redis://127.0.0.1:6379/0'),
          expires_in: 1.hour,
          connect_timeout: 5,
          read_timeout: 2,
          write_timeout: 2,
          error_handler: -> (method:, returning:, exception:) {
            Rails.logger.error "Rack::Attack Redis error: #{exception.message}"
          }
        )
        Rails.logger.info '✅ Rack::Attack using Redis cache store'
      else
        raise Redis::CannotConnectError
      end
    rescue Redis::BaseError => e
      Rails.logger.warn "⚠️  Rack::Attack falling back to MemoryStore: #{e.message}"
      Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    end
  else
    Rails.logger.warn "⚠️  Rack::Attack using MemoryStore (Redis disabled)"
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end
end

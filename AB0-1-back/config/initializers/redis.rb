# frozen_string_literal: true

# Redis configuration - TASK-014
# https://github.com/redis/redis-rb

# Check if Redis should be enabled FIRST
redis_enabled = ENV.fetch('REDIS_ENABLED', 'true') == 'true'

unless redis_enabled
  Rails.logger.warn "⚠️  Redis disabled via REDIS_ENABLED=false"
  Rails.logger.warn "⚠️  Using memory store for cache and sessions"
  
  # Use the NullRedis from 00_redis_disable.rb
  REDIS = NullRedis.new
  return
end

# Redis connection URL from ENV or default
redis_url = ENV.fetch('REDIS_URL', 'redis://127.0.0.1:6379/0')

# Determine driver (Ruby driver is the only one guaranteed in this environment)
requested_driver = ENV.fetch('REDIS_DRIVER', 'ruby').to_sym
supported_drivers = [:ruby]

unless supported_drivers.include?(requested_driver)
  Rails.logger.warn "⚠️  Unsupported Redis driver '#{requested_driver}', falling back to :ruby" rescue nil
  requested_driver = :ruby
end

# Configure Redis with connection pooling
# Note: Do NOT use :namespace option - not compatible with Sidekiq 7+
begin
  REDIS = Redis.new(
    url: redis_url,
    reconnect_attempts: 5,
    timeout: 5,
    connect_timeout: 5,
    read_timeout: 2,
    write_timeout: 2,
    driver: requested_driver
  )

  attempts = 5
  delay = 0.2
  connected = false
  attempts.times do |i|
    begin
      REDIS.ping
      connected = true
      break
    rescue Redis::BaseError => e
      Rails.logger.warn "Redis connect attempt #{i + 1}/#{attempts} failed: #{e.message}"
      sleep(delay)
      delay *= 2
    end
  end
  if connected
    Rails.logger.info "Redis connected: #{redis_url}"
  else
    raise Redis::CannotConnectError
  end
rescue Redis::CannotConnectError, Redis::TimeoutError => e
  Rails.logger.error "❌ Redis connection failed: #{e.message}"
  Rails.logger.warn "⚠️  Set REDIS_ENABLED=false in .env to disable Redis"
  
  # Use NullRedis as fallback
  class NullRedis
    def method_missing(method, *args, &block)
      Rails.logger.debug "NullRedis: #{method} called (Redis unavailable)"
      nil
    end
    
    def respond_to_missing?(method, include_private = false)
      true
    end
  end
  
  REDIS = NullRedis.new
rescue ArgumentError => e
  Rails.logger.error "❌ Redis configuration error: #{e.message}"
  Rails.logger.warn '⚠️  Using NullRedis due to configuration error'
  
  class NullRedis
    def method_missing(method, *args, &block)
      nil
    end
    
    def respond_to_missing?(method, include_private = false)
      true
    end
  end
  
  REDIS = NullRedis.new
end

# Configure different Redis namespaces for different purposes
# Note: Using key prefixes instead of Redis::Namespace for Sidekiq 7+ compatibility
module RedisNamespaces
  def self.cache
    REDIS
  end

  def self.session
    REDIS
  end

  def self.sidekiq
    REDIS
  end

  def self.cable
    REDIS
  end

  def self.rack_attack
    REDIS
  end
end

# Helper method for Redis operations with error handling
module RedisHelper
  def self.with_redis(&block)
    attempts = 3
    delay = 0.1
    begin
      result = yield REDIS
      result
    rescue Redis::BaseError => e
      Rails.logger.error "Redis operation error: #{e.message}"
      attempts -= 1
      if attempts > 0
        sleep(delay)
        delay *= 2
        retry
      else
        Rails.cache.write('redis_last_error', { message: e.message, at: Time.current }) rescue nil
        nil
      end
    end
  end
end

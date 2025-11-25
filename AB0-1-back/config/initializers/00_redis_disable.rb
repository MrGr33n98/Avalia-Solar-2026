# frozen_string_literal: true

# This initializer runs FIRST (00_ prefix) to disable Redis when REDIS_ENABLED=false
# It prevents any Redis connection attempts by monkey-patching Redis.new

if ENV.fetch('REDIS_ENABLED', 'true') == 'false'
  Rails.logger.warn "⚠️  Redis disabled - monkey-patching Redis.new to return NullRedis" rescue nil
  
  # Define NullRedis class
  class NullRedis
    def method_missing(method, *args, &block)
      Rails.logger.debug "NullRedis: #{method} called (Redis disabled)" rescue nil
      nil
    end
    
    def respond_to_missing?(method, include_private = false)
      true
    end
    
    def ping
      false
    end
    
    def connected?
      false
    end
  end
  
  # Monkey patch Redis class to return NullRedis when instantiated
  Redis.singleton_class.prepend(Module.new do
    def new(*args, **kwargs, &block)
      Rails.logger.debug "Redis.new intercepted - returning NullRedis" rescue nil
      NullRedis.new
    end
  end)
end

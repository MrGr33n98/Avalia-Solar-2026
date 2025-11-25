# frozen_string_literal: true

# Clean up expired cache entries - TASK-017
class CacheCleanupJob < ApplicationJob
  queue_as :low
  
  def perform
    Rails.logger.info 'Starting cache cleanup...'
    
    # Redis doesn't need manual cleanup for TTL-based keys
    # But we can clean up specific patterns
    
    patterns = [
      'old_cache:*',
      'temp:*',
      'session:expired:*'
    ]
    
    patterns.each do |pattern|
      keys = REDIS.keys(pattern)
      REDIS.del(*keys) if keys.any?
      Rails.logger.info "Cleaned up #{keys.size} keys matching #{pattern}"
    end
    
    Rails.logger.info 'Cache cleanup completed'
  end
end

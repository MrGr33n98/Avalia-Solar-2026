#!/usr/bin/env ruby
# frozen_string_literal: true

# Test script to verify Redis/Sidekiq configuration has no namespace issues

puts "Testing Redis and Sidekiq configuration..."
puts "=" * 60

require 'bundler/setup'
require 'redis'
require 'sidekiq'

# Load environment
require 'dotenv'
Dotenv.load('.env.development')

redis_url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
puts "Redis URL: #{redis_url}"

# Test basic Redis connection
begin
  redis = Redis.new(url: redis_url, driver: :ruby)
  redis.ping
  puts "✅ Redis connection: OK"
rescue => e
  puts "❌ Redis connection failed: #{e.message}"
  exit 1
end

# Test Sidekiq server configuration
begin
  Sidekiq.configure_server do |config|
    config.redis = {
      url: redis_url,
      driver: :ruby,
      network_timeout: 5,
      pool_timeout: 5
    }
  end
  puts "✅ Sidekiq server config: OK"
rescue ArgumentError => e
  if e.message.include?('namespace')
    puts "❌ Sidekiq namespace error detected!"
    puts "   #{e.message}"
    puts "\n   Solution: Remove any :namespace option from Redis configuration"
    exit 1
  else
    raise
  end
end

# Test Sidekiq client configuration
begin
  Sidekiq.configure_client do |config|
    config.redis = {
      url: redis_url,
      driver: :ruby,
      network_timeout: 5,
      pool_timeout: 5,
      size: 5
    }
  end
  puts "✅ Sidekiq client config: OK"
rescue ArgumentError => e
  if e.message.include?('namespace')
    puts "❌ Sidekiq namespace error detected!"
    puts "   #{e.message}"
    puts "\n   Solution: Remove any :namespace option from Redis configuration"
    exit 1
  else
    raise
  end
end

puts "=" * 60
puts "✅ All tests passed! Configuration is correct."

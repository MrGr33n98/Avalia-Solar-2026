# frozen_string_literal: true

# TASK-015: Cache management tasks
namespace :cache do
  desc 'Clear all application cache'
  task clear: :environment do
    puts '🗑️  Clearing all cache...'
    Rails.cache.clear
    puts '✅ Cache cleared successfully!'
  end

  desc 'Show cache statistics'
  task stats: :environment do
    if defined?(REDIS) && REDIS
      info = REDIS.info
      hits = info['keyspace_hits'].to_i
      misses = info['keyspace_misses'].to_i
      total = hits + misses
      hit_rate = total.zero? ? 0.0 : ((hits.to_f / total) * 100).round(2)

      puts "\n📊 Redis Cache Statistics"
      puts '=' * 50
      puts "Keys: #{REDIS.dbsize}"
      puts "Memory Used: #{info['used_memory_human']}"
      puts "Hits: #{hits}"
      puts "Misses: #{misses}"
      puts "Hit Rate: #{hit_rate}%"
      puts "Connected Clients: #{info['connected_clients']}"
      puts "Evicted Keys: #{info['evicted_keys']}"
      puts '=' * 50
    else
      puts '⚠️  Redis not available'
    end
  end

  desc 'List all cache keys'
  task keys: :environment do
    if defined?(REDIS) && REDIS
      keys = REDIS.keys('cache:*')
      puts "\n🔑 Cache Keys (#{keys.size} total)"
      puts '=' * 50

      # Group by namespace
      grouped = keys.group_by { |k| k.split(':')[1] }
      grouped.each do |namespace, ns_keys|
        puts "\n#{namespace}: #{ns_keys.size} keys"
        ns_keys.first(10).each { |k| puts "  - #{k}" }
        puts "  ... and #{ns_keys.size - 10} more" if ns_keys.size > 10
      end
      puts '=' * 50
    else
      puts '⚠️  Redis not available'
    end
  end

  desc 'Clear cache by pattern (usage: rake cache:clear_pattern[articles])'
  task :clear_pattern, [:pattern] => :environment do |_t, args|
    pattern = args[:pattern]
    raise 'Pattern required!' if pattern.blank?

    if defined?(REDIS) && REDIS
      keys = REDIS.keys("cache:*#{pattern}*")
      puts "🗑️  Found #{keys.size} keys matching pattern: #{pattern}"

      if keys.any?
        keys.each do |key|
          Rails.cache.delete(key.sub('cache:', ''))
        end
        puts "✅ Cleared #{keys.size} cache keys"
      else
        puts '⚠️  No keys found'
      end
    else
      puts '⚠️  Redis not available'
    end
  end

  desc 'Warm up cache for common endpoints'
  task warmup: :environment do
    puts '🔥 Warming up cache...'

    # Categories
    print '  - Categories... '
    Category.all.find_each do |category|
      Rails.cache.fetch("categories/show/#{category.id}/#{category.updated_at.to_i}", expires_in: 1.hour) do
        category.as_json
      end
    end
    puts '✅'

    # Featured categories
    print '  - Featured categories... '
    Rails.cache.fetch('categories/index/featured', expires_in: 1.hour) do
      Category.where(featured: true).map(&:as_json)
    end
    puts '✅'

    puts '✅ Cache warmed up successfully!'
  end

  desc 'Monitor cache performance (10 seconds)'
  task monitor: :environment do
    if defined?(REDIS) && REDIS
      puts '📈 Monitoring cache performance (10 seconds)...'
      puts 'Press Ctrl+C to stop'
      puts '=' * 60

      initial_stats = REDIS.info
      initial_hits = initial_stats['keyspace_hits'].to_i
      initial_misses = initial_stats['keyspace_misses'].to_i

      sleep 10

      final_stats = REDIS.info
      final_hits = final_stats['keyspace_hits'].to_i
      final_misses = final_stats['keyspace_misses'].to_i

      hits = final_hits - initial_hits
      misses = final_misses - initial_misses
      total = hits + misses

      puts "\nResults (last 10 seconds):"
      puts "Operations: #{total}"
      puts "Hits: #{hits}"
      puts "Misses: #{misses}"
      puts "Hit Rate: #{total.zero? ? 0 : ((hits.to_f / total) * 100).round(2)}%"
      puts '=' * 60
    else
      puts '⚠️  Redis not available'
    end
  end
end

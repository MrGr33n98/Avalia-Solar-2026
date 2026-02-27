# lib/tasks/sidekiq_health.rake

namespace :sidekiq do
  desc "Monitor Sidekiq health and auto-heal"
  task health: :environment do
    checks = {}
    
    # 1. Process Check
    processes = Sidekiq::ProcessSet.new
    checks[:processes] = {
      count: processes.size,
      busy: processes.sum { |p| p['busy'] },
      status: processes.any? ? '✅' : '❌'
    }
    
    # 2. Queue Analysis
    queues = Sidekiq::Queue.all
    checks[:queues] = queues.map do |q|
      {
        name: q.name,
        size: q.size,
        latency: q.latency,
        status: q.size > 1000 ? '🔴 BACKING UP' : '✅'
      }
    end
    
    # 3. Scheduled Jobs
    scheduled = Sidekiq::ScheduledSet.new
    checks[:scheduled] = {
      count: scheduled.size,
      status: '✅'
    }
    
    # 4. Dead Letter Queue
    dead = Sidekiq::DeadSet.new
    checks[:dead_jobs] = {
      count: dead.size,
      status: dead.size > 50 ? '🔴 TOO MANY' : '✅'
    }
    
    # 5. Redis Connection
    begin
      redis_info = Sidekiq.redis { |c| c.info }
      checks[:redis] = {
        memory_usage: redis_info['used_memory_human'],
        status: '✅'
      }
    rescue => e
      checks[:redis] = { error: e.message, status: '❌' }
    end
    
    # Print report
    print_health_report(checks)
    
    # Auto-heal if needed
    auto_heal(checks)
    
    # Exit with error code if unhealthy
    exit(healthy?(checks) ? 0 : 1)
  end
  
  def self.print_health_report(checks)
    puts "\n⚙️ SIDEKIQ HEALTH CHECK"
    puts "=" * 60
    checks.each do |component, data|
      puts "\n#{component.upcase}:"
      if data.is_a?(Array)
        data.each { |item| puts "  #{item}" }
      else
        data.each { |k, v| puts "  #{k}: #{v}" }
      end
    end
  end
  
  def self.healthy?(checks)
    dead_count = checks[:dead_jobs][:count]
    queue_backups = checks[:queues].any? { |q| q[:status].include?('BACKING UP') }
    processes = checks[:processes][:count]
    
    !queue_backups && dead_count < 100 && processes > 0
  end
  
  def self.auto_heal(checks)
    # Auto-heal dead jobs if too many
    if checks[:dead_jobs][:count] > 50
      Rails.logger.warn("Auto-healing: #{checks[:dead_jobs][:count]} dead jobs detected")
      DeadJobMonitor.retry_dead_jobs(nil, 10)
    end
    
    # Purge old dead jobs
    if checks[:dead_jobs][:count] > 100
      Rails.logger.warn("Auto-healing: Purging old dead jobs")
      DeadJobMonitor.purge_old_dead_jobs(7)
    end
  end
end

# Schedule health check (optional - add to whenever/cron)
# */5 * * * * cd /app && bundle exec rake sidekiq:health

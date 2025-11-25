# frozen_string_literal: true

# Health check controller for monitoring system status
# Provides detailed information about:
# - Database connectivity
# - Redis/Sidekiq connectivity
# - Disk space
# - Memory usage
class HealthController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:show, :readiness, :liveness]

  # GET /health - Basic health check
  def show
    render json: { status: 'ok', timestamp: Time.current.iso8601 }, status: :ok
  end

  # GET /health/readiness - Detailed readiness check
  # Checks if the application is ready to serve traffic
  def readiness
    checks = {
      database: check_database,
      redis: check_redis,
      sidekiq: check_sidekiq
    }

    all_healthy = checks.values.all? { |check| check[:status] == 'ok' }
    status_code = all_healthy ? :ok : :service_unavailable

    render json: {
      status: all_healthy ? 'ready' : 'not_ready',
      timestamp: Time.current.iso8601,
      checks: checks
    }, status: status_code
  end

  # GET /health/liveness - Liveness check
  # Simple check to verify the app is running
  def liveness
    render json: {
      status: 'alive',
      timestamp: Time.current.iso8601,
      uptime: calculate_uptime
    }, status: :ok
  end

  # GET /health/details - Detailed system information
  def details
    render json: {
      status: 'ok',
      timestamp: Time.current.iso8601,
      version: app_version,
      environment: Rails.env,
      ruby_version: RUBY_VERSION,
      rails_version: Rails::VERSION::STRING,
      system: {
        uptime: calculate_uptime,
        memory: memory_usage,
        disk: disk_usage
      },
      checks: {
        database: check_database,
        redis: check_redis,
        sidekiq: check_sidekiq,
        active_storage: check_active_storage
      }
    }, status: :ok
  rescue StandardError => e
    render json: {
      status: 'error',
      error: e.message,
      timestamp: Time.current.iso8601
    }, status: :internal_server_error
  end

  private

  # Check database connectivity and basic statistics
  def check_database
    start_time = Time.current
    ActiveRecord::Base.connection.execute('SELECT 1')
    response_time = ((Time.current - start_time) * 1000).round(2)

    {
      status: 'ok',
      response_time_ms: response_time,
      pool_size: ActiveRecord::Base.connection_pool.size,
      active_connections: ActiveRecord::Base.connection_pool.connections.count
    }
  rescue StandardError => e
    {
      status: 'error',
      error: e.message
    }
  end

  # Check Redis connectivity
  def check_redis
    return { status: 'not_configured' } unless defined?(Redis)

    start_time = Time.current
    redis = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'))
    redis.ping
    response_time = ((Time.current - start_time) * 1000).round(2)

    {
      status: 'ok',
      response_time_ms: response_time
    }
  rescue StandardError => e
    {
      status: 'error',
      error: e.message
    }
  end

  # Check Sidekiq status
  def check_sidekiq
    return { status: 'not_configured' } unless defined?(Sidekiq)

    stats = Sidekiq::Stats.new
    processes = Sidekiq::ProcessSet.new.size

    {
      status: processes > 0 ? 'ok' : 'warning',
      processes: processes,
      enqueued: stats.enqueued,
      busy: stats.processed,
      failed: stats.failed,
      scheduled: stats.scheduled_size,
      retry_size: stats.retry_size
    }
  rescue StandardError => e
    {
      status: 'error',
      error: e.message
    }
  end

  # Check Active Storage
  def check_active_storage
    return { status: 'not_configured' } unless defined?(ActiveStorage)

    service_name = ActiveStorage::Blob.service.class.name

    {
      status: 'ok',
      service: service_name,
      blob_count: ActiveStorage::Blob.count
    }
  rescue StandardError => e
    {
      status: 'error',
      error: e.message
    }
  end

  # Calculate application uptime
  def calculate_uptime
    start_time = Rails.application.config.app_start_time rescue nil
    return 'N/A' unless start_time

    seconds = Time.current - start_time
    {
      seconds: seconds.to_i,
      human: distance_of_time_in_words(seconds)
    }
  rescue StandardError
    'N/A'
  end

  # Get memory usage
  def memory_usage
    return 'N/A' unless RUBY_PLATFORM.include?('linux') || RUBY_PLATFORM.include?('darwin')

    rss = `ps -o rss= -p #{Process.pid}`.to_i / 1024 # Convert to MB

    {
      rss_mb: rss,
      human: "#{rss} MB"
    }
  rescue StandardError
    'N/A'
  end

  # Get disk usage
  def disk_usage
    return 'N/A' unless RUBY_PLATFORM.include?('linux') || RUBY_PLATFORM.include?('darwin')

    df_output = `df -h #{Rails.root}`.lines.last
    parts = df_output.split
    
    {
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      use_percent: parts[4]
    }
  rescue StandardError
    'N/A'
  end

  # Get application version
  def app_version
    return ENV['APP_VERSION'] if ENV['APP_VERSION'].present?
    return File.read(Rails.root.join('VERSION')).strip if File.exist?(Rails.root.join('VERSION'))

    'unknown'
  rescue StandardError
    'unknown'
  end

  # Helper for time formatting
  def distance_of_time_in_words(seconds)
    return "#{seconds.to_i} seconds" if seconds < 60

    minutes = seconds / 60
    return "#{minutes.to_i} minutes" if minutes < 60

    hours = minutes / 60
    return "#{hours.to_i} hours" if hours < 24

    days = hours / 24
    "#{days.to_i} days"
  end
end

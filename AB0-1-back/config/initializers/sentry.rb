# frozen_string_literal: true

# TASK-006: Sentry Error Tracking Configuration
# Documentation: https://docs.sentry.io/platforms/ruby/guides/rails/

Sentry.init do |config|
  # DSN from environment variable
  config.dsn = ENV['SENTRY_DSN']
  
  # Set the environment (development, staging, production)
  config.environment = Rails.env
  
  # Enable breadcrumbs for better error context
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  
  # Sample rate for performance monitoring (0.0 to 1.0)
  # Start with 0.1 (10%) in production to avoid overwhelming Sentry
  config.traces_sample_rate = case Rails.env
                               when 'production'
                                 0.1
                               when 'staging'
                                 0.5
                               else
                                 1.0 # 100% in development
                               end
  
  # Profiling requires extra dependencies (e.g. stackprof). Keep disabled by default.
  profiles_rate_env = ENV['SENTRY_PROFILES_SAMPLE_RATE']
  config.profiles_sample_rate = profiles_rate_env.to_s.strip.empty? ? 0.0 : profiles_rate_env.to_f
  
  # Filter sensitive data
  config.send_default_pii = false # Don't send personally identifiable information
  
  # Ignore certain errors
  config.excluded_exceptions += [
    'ActionController::RoutingError',
    'ActionController::InvalidAuthenticityToken',
    'ActiveRecord::RecordNotFound',
    'Rack::Timeout::RequestTimeoutException'
  ]
  
  # Set release version from Git SHA or environment
  config.release = ENV['GIT_SHA'] || `git rev-parse --short HEAD`.strip.presence rescue 'unknown'
  
  # Only send errors in staging and production (and development if DSN is present for testing)
  config.enabled_environments = %w[staging production development]
  
  # Better error grouping
  config.before_send = lambda do |event, hint|
    # Add user context if available
    if defined?(Current) && Current.user
      event.user = {
        id: "user_#{Current.user.id}"
      }
    end
    
    # Add custom context
    event.extra.merge!(
      hostname: Socket.gethostname,
      process_id: Process.pid
    )
    event.tags ||= {}
    event.tags.merge!(
      server_name: ENV['HOSTNAME'] || Socket.gethostname,
      git_sha: config.release
    )
    
    event
  end
  
  # Background job error tracking
  config.background_worker_threads = 5
  
  # Performance monitoring
  config.traces_sampler = lambda do |sampling_context|
    # Sample rate based on transaction type
    transaction_context = sampling_context[:transaction_context]
    op = transaction_context[:op]
    
    case op
    when /request/
      # Lower rate for web requests
      Rails.env.production? ? 0.1 : 1.0
    when /sidekiq/
      # Higher rate for background jobs
      Rails.env.production? ? 0.3 : 1.0
    else
      # Default rate
      Rails.env.production? ? 0.1 : 1.0
    end
  end
end

Rails.logger.info "[SENTRY] Initialized with release: #{Sentry.configuration.release}"

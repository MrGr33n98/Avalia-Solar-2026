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
  
  # Sample rate for profiling (requires traces to be enabled)
  config.profiles_sample_rate = case Rails.env
                                 when 'production'
                                   0.1
                                 else
                                   1.0
                                 end
  
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
  config.release = ENV['GIT_SHA'] || `git rev-parse --short HEAD 2>/dev/null`.strip.presence || 'unknown'
  
  # Only send errors in staging and production
  config.enabled_environments = %w[staging production]
  
  # Better error grouping
  config.before_send = lambda do |event, hint|
    # Add user context if available
    if defined?(Current) && Current.user
      event.user = {
        id: Current.user.id,
        email: Current.user.email,
        username: Current.user.name
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

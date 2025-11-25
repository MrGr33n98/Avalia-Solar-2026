# frozen_string_literal: true

# Bullet configuration - TASK-020
# Helps detect N+1 queries and unused eager loading
# https://github.com/flyerhzm/bullet

if defined?(Bullet)
  Bullet.enable = true
  
  # Enable specific detectors
  Bullet.alert = false # Browser alert (annoying)
  Bullet.bullet_logger = true # Log to log/bullet.log
  Bullet.console = true # Console output
  Bullet.rails_logger = true # Rails log
  
  # Notifications
  Bullet.add_footer = true # Add footer to HTML pages
  
  # Optional: Raise errors (useful for tests)
  Bullet.raise = false # Set to true to raise errors
  
  # Detect N+1 queries
  Bullet.n_plus_one_query_enable = true
  
  # Detect unused eager loading
  Bullet.unused_eager_loading_enable = true
  
  # Detect missing counter cache
  Bullet.counter_cache_enable = true
  
  # Skip certain paths
  Bullet.skip_html_injection = proc do |request|
    request.path.start_with?('/admin') || # Skip ActiveAdmin
    request.path.start_with?('/rails/active_storage') || # Skip Active Storage
    request.path.start_with?('/assets') # Skip assets
  end
  
  # Whitelist specific queries (if needed after review)
  # Bullet.add_whitelist(
  #   type: :n_plus_one_query,
  #   class_name: 'Company',
  #   association: :reviews
  # )
  
  # Slack integration (optional)
  if ENV['BULLET_SLACK_WEBHOOK_URL'].present?
    Bullet.slack = {
      webhook_url: ENV['BULLET_SLACK_WEBHOOK_URL'],
      channel: '#tech-alerts',
      username: 'Bullet Bot'
    }
  end
  
  # Custom output
  Bullet.stacktrace_includes = ['app'] # Only show app files in stacktrace
  Bullet.stacktrace_excludes = ['vendor', 'lib/bullet'] # Exclude these
  
  Rails.logger.info '🔫 Bullet enabled: N+1 query detection active'
end

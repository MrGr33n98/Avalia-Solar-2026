# frozen_string_literal: true

# PostHog Rails Initializer
# Place this file in config/initializers/posthog.rb

# ============================================================================
# RAILS-SPECIFIC CONFIGURATION
# ============================================================================
# Configure Rails-specific options via PostHog::Rails.configure
# These settings control how PostHog integrates with Rails features.

PostHog::Rails.configure do |config|
  # Automatically capture exceptions (default: false)
  config.auto_capture_exceptions = true

  # Report exceptions that Rails rescues (e.g., with rescue_from) (default: false)
  config.report_rescued_exceptions = true

  # Automatically instrument ActiveJob background jobs (default: false)
  config.auto_instrument_active_job = true

  # Capture user context with exceptions (default: true)
  config.capture_user_context = true

  # Controller method name to get current user (default: :current_user)
  config.current_user_method = :current_user

  # Use posthog_distinct_id on the User model for automatic user association
  config.user_id_method = :posthog_distinct_id
end

# ============================================================================
# CORE POSTHOG CONFIGURATION
# ============================================================================
# Only initialize PostHog if the API key is available.
# This prevents failures during Docker build (assets:precompile) where
# environment variables are not yet available in the build context.

posthog_api_key = ENV.fetch('POSTHOG_API_KEY', nil)

if posthog_api_key.present?
  PostHog.init do |config|
    config.api_key    = posthog_api_key
    config.host       = ENV.fetch('POSTHOG_HOST', 'https://us.i.posthog.com')
    config.personal_api_key = ENV.fetch('POSTHOG_PERSONAL_API_KEY', nil)
    config.max_queue_size = 10_000
    config.feature_flags_polling_interval = 30
    config.feature_flag_request_timeout_seconds = 3
    config.test_mode  = true if Rails.env.test?
  end
else
  Rails.logger.warn '[PostHog] POSTHOG_API_KEY not set — PostHog analytics disabled.' if defined?(Rails)
end

# frozen_string_literal: true

# PostHog Rails Initializer
# Place this file in config/initializers/posthog.rb

# ============================================================================
# RAILS-SPECIFIC CONFIGURATION
# ============================================================================
# Configure Rails-specific options via PostHog::Rails.configure
# These settings control how PostHog integrates with Rails features.

begin
  PostHog::Rails.configure do |config|
    config.auto_capture_exceptions = false
    config.report_rescued_exceptions = false
    config.auto_instrument_active_job = false
    config.capture_user_context = false
  end
rescue StandardError => e
  Rails.logger.warn("[PostHog] Rails integration disabled: #{e.class}") if defined?(Rails)
end

# ============================================================================
# CORE POSTHOG CONFIGURATION
# ============================================================================
# Only initialize PostHog if the API key is available.
# This prevents failures during Docker build (assets:precompile) where
# environment variables are not yet available in the build context.

posthog_api_key = ENV.fetch('POSTHOG_API_KEY', nil)

if posthog_api_key.present?
  begin
    PostHog.init do |config|
      config.api_key    = posthog_api_key
      config.host       = ENV.fetch('POSTHOG_HOST', 'https://us.i.posthog.com')
      config.personal_api_key = ENV.fetch('POSTHOG_PERSONAL_API_KEY', nil)
      config.max_queue_size = 10_000
      config.feature_flags_polling_interval = 30
      config.feature_flag_request_timeout_seconds = 3
      config.test_mode  = true if Rails.env.test?
    end
  rescue StandardError => e
    Rails.logger.warn("[PostHog] Initialization disabled: #{e.class}") if defined?(Rails)
  end
else
  Rails.logger.warn '[PostHog] POSTHOG_API_KEY not set — PostHog analytics disabled.' if defined?(Rails)
end

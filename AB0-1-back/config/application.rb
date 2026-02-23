# Add this line near the top with other requires
require 'csv'

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

# Ensure custom middleware is loaded before referencing it in config.middleware.use
require_relative "../lib/idempotency_middleware"
require_relative "../lib/block_tokens_in_url_middleware"

module RailsBlogDemo
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
    config.assets.initialize_on_precompile = false

    # TASK-022: Autoload/eager_load lib for Zeitwerk (needed for custom middleware)
    config.autoload_paths << Rails.root.join('lib')
    config.eager_load_paths << Rails.root.join('lib')

    %w[services].each do |folder|
      config.autoload_paths << Rails.root.join("app/#{folder}")
      config.eager_load_paths << Rails.root.join("app/#{folder}")
    end

    # Enable Rack::Attack middleware for rate limiting (TASK-001)
    config.middleware.use Rack::Attack
    # Idempotency for critical endpoints
    config.middleware.use IdempotencyMiddleware
    # Security: Block tokens in URL query strings
    config.middleware.use BlockTokensInUrlMiddleware
  end
end

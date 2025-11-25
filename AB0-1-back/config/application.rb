# Add this line near the top with other requires
require 'csv'

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

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

    # Enable Rack::Attack middleware for rate limiting (TASK-001)
    config.middleware.use Rack::Attack
    # TASK-022: Autoload query optimization helpers
    config.autoload_paths << Rails.root.join('lib')
  end
end

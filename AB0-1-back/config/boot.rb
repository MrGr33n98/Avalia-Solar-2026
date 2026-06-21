ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.
require "logger"
require "bootsnap/setup" # Speed up boot time by caching expensive operations.

# Load .env early to check Redis configuration
require 'dotenv'
backend_root = File.expand_path('..', __dir__)
workspace_root = File.expand_path('..', backend_root)

Dotenv.load(
  File.join(backend_root, '.env.development'),
  File.join(backend_root, '.env'),
  File.join(workspace_root, '.env')
)

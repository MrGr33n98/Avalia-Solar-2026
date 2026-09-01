# Add this line near the top with other requires
require 'csv'
require 'find'

require_relative "boot"

require "rails/all"

# json-schema uses Dir[] globs that fail to expand on Windows in some environments,
# which prevents rswag from loading JSON::Schema::Draft4 during test boot.
if Gem.win_platform?
  begin
    require 'json-schema'

    if defined?(JSON::Schema) && !defined?(JSON::Schema::Draft4)
      json_schema_root = Gem.loaded_specs['json-schema']&.full_gem_path

      if json_schema_root.present?
        %w[attributes validators].each do |segment|
          Find.find(File.join(json_schema_root, 'lib', 'json-schema', segment)) do |path|
            require path if path.end_with?('.rb')
          end
        end
      end
    end
  rescue LoadError
    # Bundler will raise a clearer error later if json-schema is unavailable.
  end

  begin
    regexp_parser_root = Gem::Specification.find_by_name('regexp_parser').full_gem_path

    require File.join(regexp_parser_root, 'lib', 'regexp_parser', 'error.rb')

    Regexp.const_set(:Syntax, Module.new) unless Regexp.const_defined?(:Syntax, false)
    unless Regexp::Syntax.const_defined?(:SyntaxError, false)
      Regexp::Syntax.const_set(:SyntaxError, Class.new(Regexp::Parser::Error))
    end

    %w[token base any version_lookup].each do |dependency|
      require File.join(regexp_parser_root, 'lib', 'regexp_parser', 'syntax', "#{dependency}.rb")
    end

    Dir.children(File.join(regexp_parser_root, 'lib', 'regexp_parser', 'syntax', 'versions')).sort.each do |entry|
      next unless entry.end_with?('.rb')

      require File.join(regexp_parser_root, 'lib', 'regexp_parser', 'syntax', 'versions', entry)
    end

    Regexp::Syntax::CURRENT = Regexp::Syntax.for("ruby/#{RUBY_VERSION}") unless Regexp::Syntax.const_defined?(:CURRENT)
  rescue Gem::MissingSpecError, LoadError
    # Bundler will raise a clearer error later if regexp_parser is unavailable.
  end

end

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
    # REQ-006: Timezone configurado para Brasil (BRT = UTC-3).
    # Garante que .days.ago e Date.current usem fuso correto nas queries de analytics.
    # active_record.default_timezone = :utc preserva armazenamento em UTC — apenas o display/queries usam BRT.
    config.time_zone = 'Brasilia'
    config.active_record.default_timezone = :utc
    # config.eager_load_paths << Rails.root.join("extras")

    config.assets.initialize_on_precompile = false

    # TASK-022: Autoload/eager_load lib for Zeitwerk (needed for custom middleware)
    # Note: app/* dirs (services, etc.) are added automatically by Rails 7 — no explicit registration needed
    config.autoload_paths << Rails.root.join('lib')
    config.eager_load_paths << Rails.root.join('lib')
    Rails.autoloaders.main.ignore(Rails.root.join('app/admin'))

    # Enable Rack::Attack middleware for rate limiting (TASK-001)
    config.middleware.use Rack::Attack
    # Idempotency for critical endpoints
    config.middleware.use IdempotencyMiddleware
    # Security: Block tokens in URL query strings
    config.middleware.use BlockTokensInUrlMiddleware
  end
end

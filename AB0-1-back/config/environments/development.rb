require "active_support/core_ext/integer/time"

Rails.application.configure do
  ENV['REDIS_ENABLED'] = ENV.fetch('REDIS_ENABLED', 'false')
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true

    config.cache_store = :memory_store
    config.public_file_server.headers = {
      "Cache-Control" => "public, max-age=#{2.days.to_i}"
    }
  else
    config.action_controller.perform_caching = false
    config.cache_store = :null_store
  end

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Configure Active Storage URL generation
  Rails.application.routes.default_url_options = {
    host: "localhost",
    port: 3001,
    protocol: "http"
  }
  config.active_storage.default_url_options = {
    host: "localhost",
    port: 3001,
    protocol: "http"
  }

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true

  # Configure host for URL generation (needed for Active Storage URLs)
  config.hosts << "localhost"

  redis_enabled = ENV.fetch('REDIS_ENABLED', 'false') == 'true'
  redis_url = ENV['REDIS_URL']
  if redis_enabled && redis_url.present?
    begin
      require 'redis'
      Redis.new(url: redis_url, driver: :ruby, connect_timeout: 2, read_timeout: 1, write_timeout: 1).ping
      config.active_job.queue_adapter = :sidekiq
    rescue StandardError => e
      Rails.logger.warn "Redis indisponível em desenvolvimento (#{e.message}). Usando :async para ActiveJob"
      config.active_job.queue_adapter = :async
    end
  else
    config.active_job.queue_adapter = :async
  end

  # CORREÇÃO: Este bloco estava fora do escopo, agora está dentro.
  config.assets.configure do |env|
    env.cache = ActiveSupport::Cache::MemoryStore.new
  end
end

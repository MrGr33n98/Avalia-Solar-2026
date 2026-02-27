# config/initializers/database_monitoring.rb

require 'fileutils'

# Ensure log directory exists before creating loggers
log_dir = Rails.root.join('log')
FileUtils.mkdir_p(log_dir) unless Dir.exist?(log_dir)

# Enable slow query logging in production
if Rails.env.production?
  sql_log_path = log_dir.join('sql.log')
  ActiveRecord::Base.logger = Logger.new(sql_log_path)

  # Custom slow query detector
  ActiveSupport::Notifications.subscribe('sql.active_record') do |name, start, finish, id, payload|
    duration = ((finish - start) * 1000).round(2)
    
    # Log slow queries (>500ms)
    if duration > 500
      Rails.logger.warn({
        type: 'SLOW_QUERY',
        duration_ms: duration,
        sql: payload[:sql][0..200],
        connection_id: payload[:connection_id]
      }.to_json)
    end
  end
end

# New Relic instrumentation (if available)
if defined?(NewRelic)
  NewRelic::Agent.add_custom_attributes({
    database_adapter: ActiveRecord::Base.connection.adapter_name,
    sidekiq_enabled: defined?(Sidekiq),
    redis_url: ENV['REDIS_URL'].present?
  })
end

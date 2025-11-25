# frozen_string_literal: true

# Query optimization configuration - TASK-022
# Best practices for database queries

Rails.application.configure do
  # Enable query log tags (helps identify slow queries)
  config.active_record.query_log_tags_enabled = true
  config.active_record.query_log_tags = [
    :application,
    :controller,
    :action,
    :job
  ]

  # Warn about queries taking longer than threshold (development)
  if Rails.env.development?
    # Log queries taking longer than 100ms
    ActiveSupport::Notifications.subscribe('sql.active_record') do |_, start, finish, _, data|
      duration = (finish - start) * 1000
      if duration > 100 # milliseconds
        Rails.logger.warn "SLOW QUERY (#{duration.round(2)}ms): #{data[:sql]}"
      end
    end
  end

  # Production: Set statement timeout
  if Rails.env.production?
    config.after_initialize do
      ActiveRecord::Base.connection.execute('SET statement_timeout = 30000') # 30s
    rescue StandardError => e
      Rails.logger.error "Failed to set statement_timeout: #{e.message}"
    end
  end
end

Rails.logger.info '✅ Query optimization configured'

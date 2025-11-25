# frozen_string_literal: true

# Lograge configuration - TASK-008
# Structured logging for better log parsing and analysis
# https://github.com/roidrage/lograge

Rails.application.configure do
  # Enable lograge
  config.lograge.enabled = true
  
  # Log format - JSON is best for parsing by log aggregators
  config.lograge.formatter = Lograge::Formatters::Json.new
  
  # Custom options to add to every log line
  config.lograge.custom_options = lambda do |event|
    {
      # Request info
      time: Time.current.iso8601,
      host: event.payload[:host],
      remote_ip: event.payload[:remote_ip],
      ip: event.payload[:ip],
      x_forwarded_for: event.payload[:x_forwarded_for],
      
      # Request correlation
      request_id: event.payload[:request_id],
      
      # User tracking (if authenticated)
      user_id: event.payload[:user_id],
      user_email: event.payload[:user_email],
      
      # Performance
      db: event.payload[:db_runtime]&.round(2),
      view: event.payload[:view_runtime]&.round(2),
      
      # Request details
      params: event.payload[:params].except('controller', 'action', 'format', 'utf8'),
      
      # Exception info (if any)
      exception: event.payload[:exception]&.first,
      exception_message: event.payload[:exception]&.last,
      
      # Custom tags
      tags: event.payload[:tags] || [],
      
      # Environment
      env: Rails.env
    }.compact
  end
  
  # Custom payload for user tracking
  config.lograge.custom_payload do |controller|
    u = (controller.respond_to?(:current_user) ? controller.current_user : nil) || (controller.respond_to?(:current_admin_user) ? controller.current_admin_user : nil)
    {
      host: controller.request.host,
      remote_ip: controller.request.remote_ip,
      ip: controller.request.ip,
      x_forwarded_for: controller.request.headers['X-Forwarded-For'],
      user_id: u&.id,
      user_email: u&.email,
      request_id: controller.request.request_id
    }.compact
  rescue StandardError => e
    Rails.logger.error "Lograge custom_payload error: #{e.message}"
    {}
  end
  
  # What to log
  config.lograge.keep_original_rails_log = false
  config.lograge.logger = ActiveSupport::Logger.new(Rails.root.join('log', "#{Rails.env}.log"))
  
  # Log slow queries (optional - requires active_record_query_trace gem)
  # config.lograge.log_level = :info
  
  # Ignore certain paths (health checks, assets, etc)
  config.lograge.ignore_actions = [
    'HealthController#index',
    'Rails::HealthController#show'
  ]
  
  config.lograge.ignore_custom = lambda do |event|
    # Ignore asset requests
    event.payload[:path]&.start_with?('/assets') ||
    event.payload[:path]&.start_with?('/rails/active_storage') ||
    event.payload[:path] == '/health'
  end
  
  # SQL logging (optional)
  if ENV['LOG_SQL'] == 'true'
    ActiveSupport.on_load(:active_record) do
      module LogrageSQL
        def sql(event)
          return if event.payload[:name] == 'SCHEMA'
          
          payload = {
            name: event.payload[:name],
            sql: event.payload[:sql],
            duration: event.duration.round(2)
          }
          
          Rails.logger.debug "SQL: #{payload.to_json}"
        end
      end
      
      ActiveSupport::Notifications.subscribe('sql.active_record', LogrageSQL.new)
    end
  end
end

# Pretty console output in development
if Rails.env.development? && defined?(AmazingPrint)
  AmazingPrint.defaults = {
    indent: 2,
    index: false
  }
  
  AmazingPrint.pry! if defined?(Pry)
end

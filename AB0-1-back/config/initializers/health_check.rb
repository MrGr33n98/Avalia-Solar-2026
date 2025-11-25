# frozen_string_literal: true

# Health Check Initializer
# Tracks application start time for uptime calculations
Rails.application.config.after_initialize do
  # Store application start time for uptime calculations
  Rails.application.config.app_start_time = Time.current
  
  Rails.logger.info "Health Check initialized at #{Time.current}"
end

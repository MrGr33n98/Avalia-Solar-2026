# frozen_string_literal: true

ActiveSupport::Notifications.subscribe('dashboard.activity.fetch') do |name, start, finish, id, payload|
  duration = (finish - start) * 1000.0 # em milissegundos
  
  # Lograge style json
  log_data = {
    event: name,
    duration_ms: duration.round(2),
    activities_fetched: payload[:activities_count] || 0,
    limit_requested: payload[:limit],
    timestamp: Time.current.iso8601
  }

  Rails.logger.info("[TELEMETRY] #{log_data.to_json}")
end

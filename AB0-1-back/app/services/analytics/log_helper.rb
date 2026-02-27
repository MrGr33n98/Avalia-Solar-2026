# frozen_string_literal: true

module Analytics
  module LogHelper
    def self.json_log(level: 'INFO', component: nil, pipeline: nil, event_id: nil, duration_ms: nil, rows: nil, error_class: nil, error_message: nil)
      log_data = {
        timestamp: Time.current.iso8601,
        level: level,
        component: component,
        pipeline: pipeline,
        event_id: event_id,
        duration_ms: duration_ms,
        rows: rows,
        error_class: error_class,
        error_message: error_message
      }.compact
      puts log_data.to_json
    end
  end
end

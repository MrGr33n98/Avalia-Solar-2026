# frozen_string_literal: true

module Analytics
  module WorkerLogging
    def log_success(pipeline, start_ts, stop_ts, rows, duration_ms)
      Analytics::LogHelper.json_log(
        level: 'INFO',
        component: self.class.name,
        pipeline: pipeline,
        rows: rows,
        duration_ms: duration_ms
      )
    end

    def log_error(pipeline, exception, duration_ms: nil)
      Analytics::LogHelper.json_log(
        level: 'ERROR',
        component: self.class.name,
        pipeline: pipeline,
        duration_ms: duration_ms,
        error_class: exception.class.name,
        error_message: exception.message
      )
    end

    def log_run(pipeline, target, rows, duration_ms)
      Analytics::LogHelper.json_log(
        level: 'INFO',
        component: self.class.name,
        pipeline: pipeline,
        rows: rows,
        duration_ms: duration_ms,
        event_id: "target:#{target}"
      )
    end
  end
end

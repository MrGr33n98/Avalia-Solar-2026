# frozen_string_literal: true

module Analytics
  class PiiScrubberWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :maintenance, retry: 1

    def perform
      return unless postgresql?

      start_time = Time.current
      limit_date = 6.months.ago
      total_scrubbed = 0

      loop do
        sql = <<~SQL
          WITH doomed AS (
            SELECT id FROM platform_events
            WHERE occurred_at < $1
            AND context ?| array['ip','user_agent']
            LIMIT 5000
          )
          UPDATE platform_events
          SET context = context - 'ip' - 'user_agent'
          WHERE id IN (SELECT id FROM doomed)
          RETURNING 1;
        SQL

        scrubbed =
          ActiveRecord::Base.connection.exec_query(
            sql,
            'PiiScrub',
            [[nil, limit_date]]
          )

        break if scrubbed.rows.empty?

        total_scrubbed += scrubbed.rows.size
        sleep 0.1
      end

      dur = ((Time.current - start_time) * 1000).to_i
      log_run('PiiScrubber', 'ContextScrub', total_scrubbed, dur)
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end

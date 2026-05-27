# frozen_string_literal: true

module Analytics
  class RetentionWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :maintenance, retry: 1

    def perform
      return unless postgresql?
      
      start_time = Time.current
      # 1. Partitions +2 months
      if Rake::Task.task_defined?("g4:manage_partitions")
        Rake::Task["g4:manage_partitions"].invoke
      end

      # 2. Cleanup Dedup (Batch CTE)
      rows = cleanup_dedup_table(24.months.ago)
      
      # 3. Cleanup DLQ (Batch ctid)
      rows_dlq = cleanup_dlq_table(30.days.ago)
      
      dur = ((Time.current - start_time) * 1000).to_i
      log_run('Retention', 'DedupCleanup', rows, dur)
      log_run('Retention', 'DLQCleanup', rows_dlq, dur)
    end

    private

    def cleanup_dedup_table(limit_date)
      total_deleted = 0
      loop do
        sql = <<~SQL
          WITH doomed AS (SELECT ctid FROM analytics_event_dedup WHERE inserted_at < $1 LIMIT 5000)
          DELETE FROM analytics_event_dedup WHERE ctid IN (SELECT ctid FROM doomed) RETURNING 1;
        SQL
        deleted = ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array([sql, limit_date]))
        break if deleted.rows.empty?
        total_deleted += deleted.rows.size
        sleep 0.1
      end
      total_deleted
    end

    def cleanup_dlq_table(limit_date)
      total_deleted = 0

      loop do
        sql = <<~SQL
          WITH doomed AS (
            SELECT ctid FROM event_ingest_errors
            WHERE occurred_at < $1
            LIMIT 5000
          )
          DELETE FROM event_ingest_errors
          WHERE ctid IN (SELECT ctid FROM doomed)
          RETURNING 1;
        SQL

        deleted =
          ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([sql, limit_date])
          )

        break if deleted.rows.empty?

        total_deleted += deleted.rows.size
        sleep 0.1
      end

      total_deleted
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end

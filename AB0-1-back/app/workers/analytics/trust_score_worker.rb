# frozen_string_literal: true

module Analytics
  class TrustScoreWorker
    include Sidekiq::Job
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'trust_score'
    LOCK_ID = Zlib.crc32(PIPELINE)
    BATCH_SIZE = 500

    def perform
      return unless postgresql?

      connection = ActiveRecord::Base.connection
      raw_lock = connection.select_value(lock_sql('SELECT pg_try_advisory_lock(?)'))
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      started_at = Time.current
      processed = 0
      begin
        Company.active.find_in_batches(batch_size: BATCH_SIZE) do |companies|
          now = Time.current
          rows = companies.map do |company|
            result = TrustScore::Calculator.new(company).call
            {
              company_id: company.id,
              score: result[:score],
              components: result[:components],
              computed_at: now,
              created_at: now,
              updated_at: now
            }
          end
          CompanyTrustScore.upsert_all(rows, unique_by: :company_id) if rows.any?
          processed += rows.size
        end

        duration_ms = ((Time.current - started_at) * 1000).to_i
        Rails.logger.info "[TrustScoreWorker] Processed #{processed} companies in #{duration_ms}ms using #{TrustScore::Definition::VERSION}"
      ensure
        connection.exec_query(lock_sql('SELECT pg_advisory_unlock(?)'))
      end
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name.match?(/postgre/i)
    end

    private

    def lock_sql(statement)
      ActiveRecord::Base.sanitize_sql_array([statement, LOCK_ID])
    end
  end
end

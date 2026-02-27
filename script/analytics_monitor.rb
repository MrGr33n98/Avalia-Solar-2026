# frozen_string_literal: true

# Usage: bundle exec rails runner script/analytics_monitor.rb

def check_analytics_health
  results = ActiveRecord::Base.connection.exec_query(<<~SQL)
    SELECT pipeline_name, EXTRACT(EPOCH FROM (NOW() - last_processed_at)) AS lag_sec 
    FROM analytics_processing_state
  SQL

  results.each do |row|
    pipeline = row['pipeline_name']
    lag = row['lag_sec'].to_f

    if lag > 1800 # 30 minutes
      puts "[ALERT][SEV1] Pipeline #{pipeline} CRITICAL LAG: #{lag.round}s"
    elsif lag > 600 # 10 minutes
      puts "[ALERT][SEV2] Pipeline #{pipeline} HIGH LAG: #{lag.round}s"
    end
  end

  errors = ActiveRecord::Base.connection.select_value(<<~SQL)
    SELECT COUNT(*) FROM event_ingest_errors WHERE occurred_at > NOW() - interval '5 minutes'
  SQL

  if errors.to_i > 100
    puts "[ALERT][SEV1] HIGH INGESTION ERRORS: #{errors} in last 5m"
  elsif errors.to_i > 10
    puts "[ALERT][SEV2] INGESTION ERRORS DETECTED: #{errors} in last 5m"
  end
end

check_analytics_health if __FILE__ == $PROGRAM_NAME

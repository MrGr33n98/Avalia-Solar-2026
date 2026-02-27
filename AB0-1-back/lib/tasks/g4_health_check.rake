# frozen_string_literal: true

namespace :g4 do
  desc "Execute G4 Analytics production health gate"
  task health_check: :environment do
    conn = ActiveRecord::Base.connection
    
    unless conn.adapter_name =~ /postgre/i
      puts "Skipping G4 Health Check: Database is not PostgreSQL."
      next
    end

    failures = []
    warnings = []

    # 1. Index Check
    indices = %w[idx_platform_events_occurred_at_btree idx_platform_events_context_gin]
    missing_indices = indices.reject { |name| conn.index_exists?(:platform_events, nil, name: name) }
    
    if missing_indices.empty?
      puts "✔ Index OK"
    else
      failures << "Missing indices: #{missing_indices.join(', ')}"
      puts "✖ Index Failed"
    end

    # 2. Partition Check
    is_partitioned = conn.select_value("SELECT EXISTS(SELECT 1 FROM pg_partitioned_table WHERE partrelid = 'platform_events'::regclass)")
    partition_count = conn.select_value("SELECT count(*) FROM pg_inherits WHERE inhparent = 'platform_events'::regclass").to_i

    if is_partitioned && partition_count.positive?
      puts "✔ Partition OK (#{partition_count} partitions)"
    else
      failures << "Table not partitioned or zero partitions found."
      puts "✖ Partition Failed"
    end

    # 3. Pipeline Lag Check
    lag = conn.select_value(<<~SQL).to_f
      SELECT EXTRACT(EPOCH FROM (NOW() - last_processed_at)) 
      FROM analytics_processing_state 
      WHERE pipeline_name = 'main_aggregation'
    SQL

    if lag < 120
      puts "✔ Lag OK (#{lag.round}s)"
    else
      failures << "Pipeline lag too high: #{lag.round}s (Threshold: 120s)"
      puts "✖ Lag Failed"
    end

    # 4. Aggregation Freshness
    fresh = conn.select_value(<<~SQL)
      SELECT EXISTS(
        SELECT 1 FROM company_daily_stats 
        WHERE updated_at > NOW() - interval '5 minutes'
      )
    SQL

    if ActiveModel::Type::Boolean.new.cast(fresh)
      puts "✔ Aggregation OK"
    else
      failures << "Aggregation stale: no updates in last 5 minutes."
      puts "✖ Aggregation Failed"
    end

    # 5. Planner / EXPLAIN Check
    explain_plan = conn.execute(<<~SQL).map { |r| r.values.first }.join(" ")
      EXPLAIN SELECT COUNT(*) FROM platform_events 
      WHERE occurred_at >= NOW() - interval '1 minute' AND occurred_at < NOW()
    SQL

    if explain_plan.include?("Seq Scan")
      failures << "Planner performing Sequential Scan."
      puts "✖ Planner Failed"
    elsif explain_plan.include?("Index Scan") || explain_plan.include?("Bitmap Index Scan")
      puts "✔ Planner OK"
    else
      failures << "Planner check inconclusive."
      puts "✖ Planner Failed"
    end

    if failures.any?
      puts "
HEALTH CHECK FAILED:"
      failures.each { |f| puts "  - #{f}" }
      exit 1
    else
      puts "
HEALTH CHECK PASSED."
      exit 0
    end
  end
end

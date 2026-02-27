# frozen_string_literal: true

require 'securerandom'
require 'zlib'

class StressG4Analytics
  def self.run
    new.run
  end

  def initialize
    @eps           = (ENV['EPS'] || 20).to_i
    @duration      = (ENV['DURATION'] || 60).to_i
    @companies     = (ENV['COMPANIES'] || 50).to_i
    @users         = (ENV['USERS'] || 100).to_i
    @skew_ratio    = (ENV['SKEW_RATIO'] || 0.5).to_f
    @skew_seconds  = (ENV['SKEW_SECONDS'] || 120).to_i
    @event_types   = %w[profile_view cta_click whatsapp_click lead_created review_created page_view search]
    @total_events  = @eps * @duration
  end

  def run
    puts "[G4-STRESS] Starting G4 Analytics Stress Test"
    puts "[G4-STRESS] Config: EPS=#{@eps}, Duration=#{@duration}s, Events=#{@total_events}, SkewRatio=#{@skew_ratio}"

    unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i
      puts "[G4-STRESS] FAILED: PostgreSQL required."
      exit 1
    end

    check_partitions
    clear_data

    # Start background aggregation simulator
    aggregator_thread = start_aggregator_thread

    # Generate load
    start_time = Time.current
    events_inserted = 0

    @duration.times do |sec|
      batch = []
      @eps.times do
        batch << generate_event
      end
      
      insert_batch(batch)
      events_inserted += batch.size
      
      sleep 1 # maintain EPS pace
    end

    load_duration = Time.current - start_time
    puts "[G4-STRESS] Load completed. Inserted #{events_inserted} events in #{load_duration.round(2)}s."

    # Stop aggregator
    aggregator_thread.kill

    # Run Backfill
    puts "[G4-STRESS] Running final BackfillWorker..."
    Analytics::BackfillWorker.new.perform(Date.current.to_s)

    # Validate
    validate_integrity
    show_observability
  end

  private

  def check_partitions
    puts "[G4-PARTITIONS] Checking partitions..."
    if Rake::Task.task_defined?("g4:manage_partitions")
      Rake::Task["g4:manage_partitions"].invoke
    else
      # Fallback manual check
      ActiveRecord::Base.connection.execute("SELECT create_platform_events_partition(now())")
      ActiveRecord::Base.connection.execute("SELECT create_platform_events_partition(now() + interval '1 month')")
    end
    puts "[G4-PARTITIONS] OK."
  end

  def clear_data
    puts "[G4-STRESS] Clearing test data..."
    ActiveRecord::Base.connection.execute("TRUNCATE platform_events CASCADE")
    ActiveRecord::Base.connection.execute("TRUNCATE company_daily_stats CASCADE")
    ActiveRecord::Base.connection.execute("TRUNCATE category_daily_stats CASCADE")
    ActiveRecord::Base.connection.execute("TRUNCATE platform_daily_stats CASCADE")
    ActiveRecord::Base.connection.execute("UPDATE analytics_processing_state SET last_processed_at = NOW() - interval '1 hour' WHERE pipeline_name = 'main_aggregation'")
  end

  def generate_event
    is_skewed = rand < @skew_ratio
    occurred_at = is_skewed ? Time.current - rand(1..@skew_seconds).seconds : Time.current

    {
      event_id: SecureRandom.uuid,
      event_type: @event_types.sample,
      company_id: rand(1..@companies),
      user_id: rand(1..@users),
      occurred_at: occurred_at.iso8601
    }
  end

  def insert_batch(batch)
    values = batch.map do |e|
      "('#{e[:event_id]}', '#{e[:event_type]}', #{e[:company_id]}, #{e[:user_id]}, '#{e[:occurred_at]}'::timestamptz, '{}'::jsonb)"
    end.join(', ')

    sql = "INSERT INTO platform_events (event_id, event_type, company_id, user_id, occurred_at, payload) VALUES #{values}"
    ActiveRecord::Base.connection.execute(sql)
  end

  def start_aggregator_thread
    Thread.new do
      loop do
        begin
          Analytics::AggregationWorker.new.perform
        rescue => e
          puts "[G4-STRESS] Aggregator error: #{e.message}"
        end
        sleep 5 # Run every 5s during stress test
      end
    end
  end

  def validate_integrity
    puts "[G4-VALIDATION] Validating Data Integrity..."
    
    # 1. Company Stats
    sql_events = <<~SQL
      SELECT 
        COUNT(*) FILTER (WHERE event_type = 'profile_view') as views,
        COUNT(*) FILTER (WHERE event_type = 'cta_click') as ctas
      FROM platform_events 
      WHERE company_id IS NOT NULL AND occurred_at::date = CURRENT_DATE
    SQL
    
    sql_stats = <<~SQL
      SELECT 
        COALESCE(SUM(profile_views), 0) as views,
        COALESCE(SUM(cta_clicks), 0) as ctas
      FROM company_daily_stats 
      WHERE day = CURRENT_DATE
    SQL

    events_res = ActiveRecord::Base.connection.select_one(sql_events)
    stats_res = ActiveRecord::Base.connection.select_one(sql_stats)

    views_match = events_res['views'].to_i == stats_res['views'].to_i
    ctas_match = events_res['ctas'].to_i == stats_res['ctas'].to_i

    if views_match && ctas_match
      puts "[G4-VALIDATION] SUCCESS: 100% Data Integrity. (Views: #{events_res['views']}, CTAs: #{events_res['ctas']})"
    else
      puts "[G4-VALIDATION] FAILED: Data Mismatch!"
      puts "  Events -> Views: #{events_res['views']}, CTAs: #{events_res['ctas']}"
      puts "  Stats  -> Views: #{stats_res['views']}, CTAs: #{stats_res['ctas']}"
      exit 1
    end
  end

  def show_observability
    puts "
===================================================="
    puts "[G4-OBSERVABILITY] Postgres Native Metrics"
    puts "===================================================="
    
    lag_res = ActiveRecord::Base.connection.select_one("SELECT EXTRACT(EPOCH FROM (NOW() - last_processed_at)) as lag_seconds FROM analytics_processing_state WHERE pipeline_name = 'main_aggregation'")
    puts "Pipeline Lag: #{lag_res['lag_seconds'].to_f.round(2)} seconds"

    sizes = ActiveRecord::Base.connection.select_all("SELECT child.relname, pg_size_pretty(pg_total_relation_size(child.oid)) AS size FROM pg_inherits JOIN pg_class parent ON pg_inherits.inhparent = parent.oid JOIN pg_class child ON pg_inherits.inhrelid = child.oid WHERE parent.relname = 'platform_events'")
    puts "Partitions:"
    sizes.each { |r| puts "  - #{r['relname']}: #{r['size']}" }
    
    puts "====================================================
"
  end
end

StressG4Analytics.run if $PROGRAM_NAME == __FILE__

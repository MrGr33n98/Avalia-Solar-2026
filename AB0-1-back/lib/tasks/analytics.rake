# frozen_string_literal: true

namespace :analytics do
  desc "Cleanup old analytics events (executes cleanup_analytics_events SQL function)"
  task cleanup: :environment do
    puts "[Analytics] Starting cleanup..."
    
    result = ActiveRecord::Base.connection.execute(
      "SELECT * FROM cleanup_analytics_events()"
    ).first
    
    deleted_events = result['deleted_events']
    deleted_dedupe = result['deleted_dedupe']
    duration = result['duration_seconds'].to_f
    
    puts "[Analytics] Cleanup completed:"
    puts "  - Events deleted: #{deleted_events}"
    puts "  - Dedupe entries deleted: #{deleted_dedupe}"
    puts "  - Duration: #{duration.round(2)}s"
    
    # Alert if large cleanup (> 100k events deleted)
    if deleted_events > 100_000
      puts "  ⚠️  Large cleanup detected (#{deleted_events} events)"
      # TODO: Send Slack/email alert when notification system is integrated
    end
    
    # Log to Rails logger
    Rails.logger.info("[Analytics Cleanup] Deleted #{deleted_events} events, #{deleted_dedupe} dedupe entries in #{duration.round(2)}s")
  rescue StandardError => e
    puts "[Analytics] Cleanup failed: #{e.message}"
    Rails.logger.error("[Analytics Cleanup] Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise e
  end
  
  desc "Preview cleanup (dry-run showing what would be deleted)"
  task :cleanup_preview, [:days] => :environment do |_t, args|
    days = args[:days]&.to_i || 180
    
    puts "[Analytics] Preview of cleanup (#{days} days threshold):"
    puts ""
    
    # Preview regular events
    preview = AnalyticsEvent
      .where('tracked_at < ?', days.days.ago)
      .where.not(event_type: ['lead_submitted', 'lead_verified', 'purchase'])
      .group(:event_type)
      .count
      .sort_by { |_k, v| -v }
    
    if preview.any?
      puts "Regular events (180 days old):"
      preview.each do |event_type, count|
        puts "  - #{event_type}: #{count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} events"
      end
      puts "  SUBTOTAL: #{preview.values.sum.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} events"
      puts ""
    end
    
    # Preview old leads
    old_leads = AnalyticsEvent
      .where('tracked_at < ?', 2.years.ago)
      .where(event_type: ['lead_submitted', 'lead_verified', 'purchase'])
      .count
    
    if old_leads > 0
      puts "Old leads/conversions (2+ years):"
      puts "  - Total: #{old_leads.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} events"
      puts ""
    end
    
    # Preview dedupe
    old_dedupe = AnalyticsEventDedup
      .where('inserted_at < ?', 30.days.ago)
      .count
    
    if old_dedupe > 0
      puts "Dedupe entries (30+ days old):"
      puts "  - Total: #{old_dedupe.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} entries"
      puts ""
    end
    
    total_to_delete = preview.values.sum + old_leads
    puts "=" * 50
    puts "TOTAL TO DELETE: #{total_to_delete.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} analytics events"
    puts "TOTAL DEDUPE: #{old_dedupe.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} dedupe entries"
    puts "=" * 50
    puts ""
    puts "To execute cleanup, run: rake analytics:cleanup"
  rescue StandardError => e
    puts "[Analytics] Preview failed: #{e.message}"
    raise e
  end
  
  desc "Check analytics database size and growth"
  task check_size: :environment do
    result = ActiveRecord::Base.connection.execute(<<-SQL)
      SELECT 
        COUNT(*) as total_events,
        MIN(tracked_at) as oldest_event,
        MAX(tracked_at) as newest_event,
        pg_size_pretty(pg_total_relation_size('analytics_events')) as table_size,
        pg_size_pretty(pg_indexes_size('analytics_events')) as indexes_size
      FROM analytics_events;
    SQL
    
    row = result.first
    puts "[Analytics] Database Stats:"
    puts "  - Total events: #{row['total_events'].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
    puts "  - Oldest event: #{row['oldest_event']}"
    puts "  - Newest event: #{row['newest_event']}"
    puts "  - Table size: #{row['table_size']}"
    puts "  - Indexes size: #{row['indexes_size']}"
    
    # Dedupe stats
    dedupe_result = ActiveRecord::Base.connection.execute(<<-SQL)
      SELECT 
        COUNT(*) as total_dedupe,
        MIN(inserted_at) as oldest_dedupe,
        pg_size_pretty(pg_total_relation_size('analytics_event_dedup')) as dedupe_size
      FROM analytics_event_dedup;
    SQL
    
    dedupe_row = dedupe_result.first
    puts ""
    puts "[Analytics] Dedupe Stats:"
    puts "  - Total entries: #{dedupe_row['total_dedupe'].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
    puts "  - Oldest entry: #{dedupe_row['oldest_dedupe']}"
    puts "  - Table size: #{dedupe_row['dedupe_size']}"
  rescue StandardError => e
    puts "[Analytics] Size check failed: #{e.message}"
    raise e
  end
end

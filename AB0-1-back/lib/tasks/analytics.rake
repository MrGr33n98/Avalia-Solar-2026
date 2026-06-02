# frozen_string_literal: true

namespace :analytics do
  desc 'Sanitize historical analytics payloads (DRY_RUN=true by default)'
  task sanitize_historical_pii: :environment do
    dry_run = ENV.fetch('DRY_RUN', 'true') != 'false'
    puts "[Analytics] Historical PII sanitization (dry_run=#{dry_run})"

    tables = {
      'analytics_events' => 'metadata',
      'platform_events' => 'payload',
      'event_ingest_errors' => 'payload'
    }

    tables.each do |table, column|
      next unless ActiveRecord::Base.connection.table_exists?(table)

      rows = ActiveRecord::Base.connection.select_all("SELECT id, #{column} FROM #{table}")
      changed = 0
      malformed = 0
      rows.each do |row|
        raw = row[column]
        begin
          payload = raw.is_a?(String) ? JSON.parse(raw) : raw
        rescue JSON::ParserError
          malformed += 1
          next
        end
        next unless payload.is_a?(Hash)

        sanitized = Analytics::LgpdAnonymizer.new(payload).anonymize
        next if sanitized == payload.deep_stringify_keys

        changed += 1
        next if dry_run

        sql = "UPDATE #{table} SET #{column} = #{ActiveRecord::Base.connection.quote(sanitized.to_json)} WHERE id = #{ActiveRecord::Base.connection.quote(row['id'])}"
        ActiveRecord::Base.connection.execute(sql)
      end
      puts "  - #{table}.#{column}: #{changed} row(s) #{dry_run ? 'would change' : 'updated'}"
      puts "    skipped malformed JSON rows: #{malformed}" if malformed.positive?
    end

    puts dry_run ? '[Analytics] Preview complete. Run with DRY_RUN=false after review.' : '[Analytics] Sanitization complete.'
  end

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

  desc "Generate data quality report for last 7 days"
  task quality_report: :environment do
    require_relative '../../app/services/analytics/anomaly_detector'
    
    puts "=" * 80
    puts "📊 ANALYTICS DATA QUALITY REPORT"
    puts "Generated: #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    puts "Period: Last 7 days"
    puts "=" * 80
    puts ""
    
    # Run all quality checks
    detector = Analytics::AnomalyDetector.new(lookback_days: 7)
    results = detector.comprehensive_detection
    
    # Display summary
    puts "🎯 SUMMARY"
    puts "-" * 80
    puts "Total anomalies detected: #{results[:summary][:total_anomalies]}"
    puts "  - Critical: #{results[:summary][:critical_count]}"
    puts "  - Warning: #{results[:summary][:warning_count]}"
    puts "  - Info: #{results[:summary][:info_count]}"
    puts ""
    
    # Display spikes and drops
    if results[:spikes_and_drops].any?
      puts "⚠️  ANOMALIES (Spikes/Drops)"
      puts "-" * 80
      results[:spikes_and_drops].each do |anomaly|
        icon = case anomaly[:severity]
               when 'critical' then '🔴'
               when 'warning' then '🟡'
               else '🔵'
               end
        
        puts "#{icon} #{anomaly[:type].upcase}: #{anomaly[:event_type]}"
        puts "   Current: #{anomaly[:current_value]} | Baseline: #{anomaly[:baseline_mean]} ± #{anomaly[:baseline_stddev]}"
        puts "   Change: #{anomaly[:percentage_change]}% (#{anomaly[:severity]})"
        puts ""
      end
    else
      puts "✅ No anomalies detected (Spikes/Drops)"
      puts ""
    end
    
    # Display missing session IDs
    if results[:missing_session_ids].any?
      puts "⚠️  MISSING SESSION IDs"
      puts "-" * 80
      results[:missing_session_ids].each do |issue|
        icon = issue[:severity] == 'critical' ? '🔴' : '🟡'
        puts "#{icon} #{issue[:event_type]}: #{issue[:percentage]}% missing (#{issue[:missing_count]}/#{issue[:total_count]})"
      end
      puts ""
    else
      puts "✅ No missing session IDs detected"
      puts ""
    end
    
    # Display missing company IDs
    if results[:missing_company_ids].any?
      puts "⚠️  MISSING COMPANY IDs"
      puts "-" * 80
      results[:missing_company_ids].each do |issue|
        icon = issue[:severity] == 'critical' ? '🔴' : '🟡'
        puts "#{icon} #{issue[:event_type]}: #{issue[:percentage]}% missing (#{issue[:missing_count]}/#{issue[:total_count]})"
      end
      puts ""
    else
      puts "✅ No missing company IDs detected"
      puts ""
    end
    
    # Display duplicates
    if results[:duplicates].any?
      puts "⚠️  DUPLICATES DETECTED"
      puts "-" * 80
      results[:duplicates].each do |issue|
        icon = issue[:severity] == 'critical' ? '🔴' : '🟡'
        puts "#{icon} Duplicate rate: #{issue[:duplicate_rate]}% (#{issue[:duplicate_count]} duplicates)"
      end
      puts ""
    else
      puts "✅ No duplicates detected"
      puts ""
    end
    
    puts "=" * 80
    
    # Health status
    overall_health = if results[:summary][:critical_count] > 0
                       "🔴 CRITICAL - Immediate action required"
                     elsif results[:summary][:warning_count] > 0
                       "🟡 WARNING - Monitor closely"
                     else
                       "✅ HEALTHY - All metrics within acceptable ranges"
                     end
    
    puts "Overall Health: #{overall_health}"
    puts "=" * 80
    
    # TODO: Send to Slack when notification system is integrated
    # TODO: Store in database for historical tracking
    
  rescue StandardError => e
    puts "[Analytics Quality Report] Failed: #{e.message}"
    Rails.logger.error("[Analytics Quality Report] Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise e
  end

  desc "Run all quality checks and alert if issues found"
  task quality_check: :environment do
    require_relative '../../app/services/analytics/anomaly_detector'
    
    detector = Analytics::AnomalyDetector.new(lookback_days: 7)
    results = detector.comprehensive_detection
    
    # Alert only if critical issues found
    if results[:summary][:critical_count] > 0
      puts "🔴 CRITICAL ISSUES DETECTED - #{results[:summary][:critical_count]} anomalies"
      
      # List critical issues
      all_issues = (results[:spikes_and_drops] + 
                    results[:missing_session_ids] + 
                    results[:missing_company_ids] + 
                    results[:duplicates])
      
      critical_issues = all_issues.select { |i| i[:severity] == 'critical' }
      
      critical_issues.each do |issue|
        puts "  - #{issue[:type]}: #{issue[:event_type] || 'N/A'}"
      end
      
      # TODO: Send Slack alert
      puts ""
      puts "⚠️  Run 'rake analytics:quality_report' for full details"
      
      exit 1 # Exit with error code for CI/CD integration
    elsif results[:summary][:warning_count] > 0
      puts "🟡 WARNING - #{results[:summary][:warning_count]} issues require attention"
      puts "Run 'rake analytics:quality_report' for details"
    else
      puts "✅ All quality checks passed"
    end
  rescue StandardError => e
    puts "[Analytics Quality Check] Failed: #{e.message}"
    exit 1
  end

  desc 'Import engagement metrics from GA4'
  task import_ga4_metrics: :environment do
    puts '🔄 Importing GA4 engagement metrics...'
    
    companies_with_ga4 = Company.where.not(ga4_property_id: nil)
    
    if companies_with_ga4.empty?
      puts '⚠️  No companies with GA4 property configured'
      exit
    end

    success_count = 0
    error_count = 0

    companies_with_ga4.find_each do |company|
      print "Processing #{company.name} (#{company.ga4_property_id})... "
      
      metrics = Ga4Service.fetch_engagement_metrics(
        property_id: company.ga4_property_id,
        start_date: 30.days.ago.to_date,
        end_date: Date.current
      )

      if metrics
        company.update!(
          ga4_last_sync: Time.current,
          engagement_metrics: metrics
        )
        
        puts '✅ Success'
        success_count += 1
      else
        puts '❌ Failed'
        error_count += 1
      end
    rescue StandardError => e
      puts "❌ Error: #{e.message}"
      error_count += 1
    end

    puts "\n📊 Summary:"
    puts "   Success: #{success_count}"
    puts "   Errors: #{error_count}"
  end

  desc 'Backfill company_daily_stats from analytics_events'
  task backfill_daily_stats: :environment do
    puts '🔄 Backfilling company_daily_stats...'
    
    start_date = 90.days.ago.to_date
    end_date = Date.current

    (start_date..end_date).each do |date|
      print "Processing #{date}... "
      
      aggregated = AnalyticsEvent
        .where('DATE(tracked_at) = ?', date)
        .group(:company_id, :event_type)
        .count

      aggregated.each do |(company_id, event_type), count|
        stat = CompanyDailyStat.find_or_initialize_by(
          company_id: company_id,
          day: date
        )

        case event_type
        when 'profile_view', 'Company Profile Viewed'
          stat.profile_views = (stat.profile_views || 0) + count
        when 'cta_click', 'CTA Clicked'
          stat.cta_clicks = (stat.cta_clicks || 0) + count
        when 'whatsapp_click', 'WhatsApp CTA Clicked'
          stat.whatsapp_clicks = (stat.whatsapp_clicks || 0) + count
        when 'Email CTA Clicked'
          stat.email_clicks = (stat.email_clicks || 0) + count
        when 'Phone CTA Clicked'
          stat.phone_clicks = (stat.phone_clicks || 0) + count
        when 'Website CTA Clicked'
          stat.website_clicks = (stat.website_clicks || 0) + count
        when 'lead_created', 'Lead Form Submitted', 'Quote Request CTA Clicked'
          stat.leads = (stat.leads || 0) + count
        when 'review_created'
          stat.reviews = (stat.reviews || 0) + count
        end

        stat.save!
      end

      puts "✅ #{aggregated.size} events"
    end

    puts "\n✅ Backfill complete!"
  end

  desc 'Generate test analytics data'
  task generate_test_data: :environment do
    puts '🧪 Generating test analytics data...'
    
    company = Company.first
    unless company
      puts '❌ No companies found'
      exit
    end

    (30.days.ago.to_date..Date.current).each do |date|
      stat = CompanyDailyStat.find_or_create_by!(
        company_id: company.id,
        date: date
      )

      base_views = rand(100..500)
      stat.update!(
        profile_views: base_views,
        cta_clicks: (base_views * rand(0.15..0.25)).to_i,
        whatsapp_clicks: (base_views * rand(0.08..0.15)).to_i,
        email_clicks: (base_views * rand(0.03..0.06)).to_i,
        phone_clicks: (base_views * rand(0.02..0.04)).to_i,
        website_clicks: (base_views * rand(0.01..0.03)).to_i,
        leads: (base_views * rand(0.02..0.05)).to_i
      )
    end

    puts "✅ Generated 30 days of test data for #{company.name}"
  end
end

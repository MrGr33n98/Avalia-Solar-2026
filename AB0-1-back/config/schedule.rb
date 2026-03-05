# frozen_string_literal: true
# 
# Cron schedule configuration for Avalia Solar
# Use 'whenever' gem to manage crontab
# 
# Deploy: whenever --update-crontab
# Preview: whenever
# Clear: whenever --clear-crontab

# Set environment and output
set :output, 'log/cron.log'
set :environment, ENV.fetch('RAILS_ENV', 'production')

# Analytics cleanup - Weekly on Sundays at 3:00 AM BRT
# Deletes old analytics events and dedupe entries
every :sunday, at: '3:00 am' do
  rake 'analytics:cleanup'
end

# Analytics preview - Daily at 2:00 AM BRT
# Shows what would be cleaned without executing
every 1.day, at: '2:00 am' do
  rake 'analytics:cleanup_preview[180]'
end

# Analytics size check - Daily at 6:00 AM BRT
# Monitors database growth
every 1.day, at: '6:00 am' do
  rake 'analytics:check_size'
end

# Analytics quality report - Daily at 8:00 AM BRT
# Comprehensive data quality analysis
every 1.day, at: '8:00 am' do
  rake 'analytics:quality_report'
end

# Analytics quality check - Every 4 hours
# Quick health check with alerting
every 4.hours do
  rake 'analytics:quality_check'
end

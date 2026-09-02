# frozen_string_literal: true

namespace :sales do
  namespace :email do
    desc 'Run SES production readiness health diagnostics without revealing secrets'
    task doctor: :environment do
      puts "========================================"
      puts " AVALIA SOLAR CRM — EMAIL DOCTOR"
      puts "========================================"

      # AWS Region
      aws_region = ENV['AWS_REGION'] || ENV['AWS_DEFAULT_REGION']
      puts "AWS Region:           #{aws_region.present? ? "YES (#{aws_region})" : 'NO (Missing AWS_REGION)'}"

      # Credentials
      has_key = ENV['AWS_ACCESS_KEY_ID'].present?
      has_secret = ENV['AWS_SECRET_ACCESS_KEY'].present?
      puts "AWS Credentials:      #{has_key && has_secret ? 'YES (Access key & Secret present)' : 'NO (Missing AWS credentials)'}"

      # Sender Email
      sender = ENV['SALES_EMAIL_FROM'] || ENV['MAILER_SENDER']
      puts "Sender Email:         #{sender.present? ? "YES (#{sender})" : 'NO (Missing SALES_EMAIL_FROM)'}"

      # Webhook Secret
      webhook_secret = ENV['SALES_EMAIL_WEBHOOK_SECRET']
      puts "Webhook Secret:       #{webhook_secret.present? ? 'YES (Configured)' : 'NO (SALES_EMAIL_WEBHOOK_SECRET not set)'}"

      # Queue / Worker Adapter
      queue_adapter = Rails.application.config.active_job.queue_adapter
      puts "ActiveJob Adapter:    #{queue_adapter}"

      # Redis / Sidekiq Status
      redis_enabled = ENV.fetch('REDIS_ENABLED', 'true') == 'true'
      puts "Redis Enabled:        #{redis_enabled ? 'YES' : 'NO'}"

      # Email Message Stats
      total_sent = ::Sales::EmailMessage.count rescue 0
      total_events = ::Sales::EmailEvent.count rescue 0
      puts "DB Email Messages:    #{total_sent}"
      puts "DB Email Events:      #{total_events}"

      puts "========================================"
      if aws_region.present? && has_key && has_secret && sender.present?
        puts "RESULT: SES PRODUCTION READINESS OK"
      else
        puts "RESULT: SES CONFIGURATION INCOMPLETE"
      end
      puts "========================================"
    end
  end
end

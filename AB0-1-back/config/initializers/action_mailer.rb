# frozen_string_literal: true

# ActionMailer configuration - TASK-018
# Configure email delivery for async processing

Rails.application.configure do
  begin
    redis_enabled = ENV.fetch('REDIS_ENABLED', 'false') == 'true'
    redis_url = ENV['REDIS_URL']
    if Rails.env.production?
      config.active_job.queue_adapter = :sidekiq
    else
      if redis_enabled && redis_url.present?
        require 'redis'
        pong = Redis.new(url: redis_url, driver: :ruby, connect_timeout: 2, read_timeout: 1, write_timeout: 1).ping rescue nil
        config.active_job.queue_adapter = pong == 'PONG' ? :sidekiq : :async
      else
        config.active_job.queue_adapter = :async
      end
    end
  rescue StandardError => e
    Rails.logger.warn "ActiveJob adapter fallback devido a Redis indisponível (#{e.message})"
    config.active_job.queue_adapter = :async
  end
  
  # ActionMailer delivery method
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  
  # Default URL options (used in email templates)
  config.action_mailer.default_url_options = {
    host: ENV.fetch('APP_HOST', 'localhost:3000'),
    protocol: Rails.env.production? ? 'https' : 'http'
  }
  
  # SMTP settings
  config.action_mailer.smtp_settings = {
    address: ENV.fetch('SMTP_ADDRESS', 'localhost'),
    port: ENV.fetch('SMTP_PORT', 587).to_i,
    domain: ENV.fetch('SMTP_DOMAIN', 'localhost'),
    user_name: ENV['SMTP_USERNAME'],
    password: ENV['SMTP_PASSWORD'],
    authentication: ENV.fetch('SMTP_AUTHENTICATION', 'plain'),
    enable_starttls_auto: ENV.fetch('SMTP_ENABLE_STARTTLS_AUTO', 'true') == 'true',
    open_timeout: 5,
    read_timeout: 5
  }
  
  # Development settings
  if Rails.env.development?
    # Log emails instead of sending (optional)
    # config.action_mailer.delivery_method = :letter_opener
    
    # Show full error messages
    config.action_mailer.raise_delivery_errors = true
    
    # Preview emails at /rails/mailers
    config.action_mailer.show_previews = true
    config.action_mailer.preview_path = Rails.root.join('test', 'mailers', 'previews')
  end
  
  # Test settings
  if Rails.env.test?
    config.action_mailer.delivery_method = :test
    config.action_mailer.perform_deliveries = true
  end
  
  # Production settings
  if Rails.env.production?
    # Ensure emails are sent asynchronously
    config.action_mailer.deliver_later_queue_name = 'mailers'
    
    # Use ActionMailer's inline job adapter for immediate delivery in jobs
    # This prevents double-queueing since our jobs already handle async
    config.action_mailer.delivery_job = 'ActionMailer::MailDeliveryJob'
    
    # Error handling
    config.action_mailer.raise_delivery_errors = false # Don't raise in production
    
    # Asset host for images in emails
    if ENV['ASSET_HOST'].present?
      config.action_mailer.asset_host = ENV['ASSET_HOST']
    end
  end
end

# Email interceptor for development/staging (prevent accidental sends)
if Rails.env.development? || Rails.env.staging?
  require 'mail'
  
  class EmailInterceptor
    def self.delivering_email(message)
      # Only allow emails to safe domains in non-production
      safe_domains = ENV.fetch('SAFE_EMAIL_DOMAINS', 'example.com,test.com').split(',')
      
      unless message.to.any? { |email| safe_domains.any? { |domain| email.ends_with?(domain) } }
        Rails.logger.warn "🚫 [EmailInterceptor] Blocked email to: #{message.to.join(', ')}"
        message.perform_deliveries = false
      end
    end
  end
  
  ActionMailer::Base.register_interceptor(EmailInterceptor) if ENV['ENABLE_EMAIL_INTERCEPTOR'] == 'true'
end

Rails.logger.info "✅ ActionMailer configured (#{Rails.env}, delivery: #{Rails.application.config.action_mailer.delivery_method})"

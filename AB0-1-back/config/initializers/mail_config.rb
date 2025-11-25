# frozen_string_literal: true

# Email configuration - TASK-018
# Configure Action Mailer

Rails.application.configure do
  # Default URL options for mailer
  config.action_mailer.default_url_options = {
    host: ENV.fetch('APP_HOST', 'localhost:3000'),
    protocol: Rails.env.production? ? 'https' : 'http'
  }

  # Delivery method configuration
  if Rails.env.production?
    smtp_username = ENV['SMTP_USERNAME']
    smtp_password = ENV['SMTP_PASSWORD']

    if smtp_username.present? && smtp_password.present?
      # Production: Use SMTP (e.g., SendGrid, Mailgun, AWS SES)
      config.action_mailer.delivery_method = :smtp
      config.action_mailer.smtp_settings = {
        address: ENV.fetch('SMTP_ADDRESS', 'smtp.sendgrid.net'),
        port: ENV.fetch('SMTP_PORT', 587).to_i,
        domain: ENV.fetch('SMTP_DOMAIN', 'ab0-1.com'),
        user_name: smtp_username,
        password: smtp_password,
        authentication: :plain,
        enable_starttls_auto: true
      }

      # Raise errors if email fails
      config.action_mailer.raise_delivery_errors = true
    else
      Rails.logger.warn '⚠️  SMTP credentials not configured. Email delivery disabled.'
      config.action_mailer.delivery_method = :test
      config.action_mailer.perform_deliveries = false
    end
    
  elsif Rails.env.development?
    # Development: Log emails to console (or use letter_opener)
    config.action_mailer.delivery_method = :test
    
    # Alternative: Use letter_opener to preview emails in browser
    # gem 'letter_opener', group: :development
    # config.action_mailer.delivery_method = :letter_opener
    # config.action_mailer.perform_deliveries = true
    
  elsif Rails.env.test?
    # Test: Use test adapter
    config.action_mailer.delivery_method = :test
    config.action_mailer.perform_deliveries = false
  end

  # Asset host for emails (for images, CSS, etc)
  config.action_mailer.asset_host = ENV.fetch(
    'MAILER_ASSET_HOST',
    "#{config.action_mailer.default_url_options[:protocol]}://#{config.action_mailer.default_url_options[:host]}"
  )

  # Perform deliveries in background (already configured with ActiveJob)
  config.action_mailer.deliver_later_queue_name = :mailers

  # Preview path
  config.action_mailer.preview_path = Rails.root.join('spec/mailers/previews')
  
  Rails.logger.info "✅ Email configured: #{config.action_mailer.delivery_method}"
end

# SMTP Provider Options:
#
# SendGrid:
# SMTP_ADDRESS=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USERNAME=apikey
# SMTP_PASSWORD=your_sendgrid_api_key
#
# Mailgun:
# SMTP_ADDRESS=smtp.mailgun.org
# SMTP_PORT=587
# SMTP_USERNAME=postmaster@your-domain.mailgun.org
# SMTP_PASSWORD=your_mailgun_password
#
# AWS SES:
# SMTP_ADDRESS=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USERNAME=your_ses_username
# SMTP_PASSWORD=your_ses_password
#
# Gmail (not recommended for production):
# SMTP_ADDRESS=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your_gmail@gmail.com
# SMTP_PASSWORD=your_app_password

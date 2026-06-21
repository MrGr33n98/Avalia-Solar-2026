# frozen_string_literal: true

# ActionMailer configuration - TASK-018
# Consolidates Brevo SMTP/API settings, ActiveJob adapter, and secure interceptors.

require Rails.root.join('lib/brevo_api_delivery').to_s

Rails.application.configure do
  # 1. ActiveJob Adapter (Sidekiq for prod, fallback for dev/test)
  begin
    redis_enabled = ENV.fetch('REDIS_ENABLED', 'true') == 'true'
    if Rails.env.production?
      config.active_job.queue_adapter = :sidekiq
    else
      config.active_job.queue_adapter = (redis_enabled ? :sidekiq : :async)
    end
  rescue StandardError => e
    Rails.logger.warn "⚠️  ActiveJob adapter fallback: #{e.message}"
    config.active_job.queue_adapter = :async
  end

  # 2. Main ActionMailer Settings
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :smtp

  # 3. URL and Asset Host Options
  app_host = ENV.fetch('APP_HOST', 'localhost:3000')
  protocol = Rails.env.production? ? 'https' : 'http'
  
  config.action_mailer.default_url_options = { host: app_host, protocol: protocol }
  config.action_mailer.asset_host = ENV.fetch('MAILER_ASSET_HOST', "#{protocol}://#{app_host}")

  # 4. Transactional E-mail Configuration (Brevo SMTP or API)
  smtp_username = ENV['BREVO_SMTP_USER'] || ENV['SMTP_USERNAME']
  smtp_password = ENV['BREVO_SMTP_PASS'] || ENV['SMTP_PASSWORD']
  brevo_api_key = ENV['BREVO_API_KEY']
  smtp_authentication = ENV.fetch('SMTP_AUTHENTICATION', 'login').to_s.downcase.to_sym
  smtp_starttls = ActiveModel::Type::Boolean.new.cast(ENV.fetch('SMTP_ENABLE_STARTTLS_AUTO', 'true'))

  if smtp_username.present? && smtp_password.present?
    config.action_mailer.smtp_settings = {
      address: ENV.fetch('SMTP_ADDRESS', 'smtp-relay.brevo.com'),
      port: ENV.fetch('SMTP_PORT', 587).to_i,
      domain: ENV.fetch('SMTP_DOMAIN', 'avaliasolar.com.br'),
      user_name: smtp_username,
      password: smtp_password,
      authentication: smtp_authentication,
      enable_starttls_auto: smtp_starttls,
      open_timeout: 10,
      read_timeout: 10
    }
  elsif brevo_api_key.present?
    ActionMailer::Base.add_delivery_method(
      :brevo_api,
      BrevoApiDelivery,
      api_key: brevo_api_key,
      endpoint: ENV.fetch('BREVO_TRANSACTIONAL_EMAIL_URL', BrevoApiDelivery::DEFAULT_ENDPOINT),
      open_timeout: 10,
      read_timeout: 10
    )
    config.action_mailer.delivery_method = :brevo_api
  elsif Rails.env.production?
    Rails.logger.error 'E-mail credentials missing in production — configure SMTP_USERNAME/SMTP_PASSWORD, BREVO_SMTP_USER/BREVO_SMTP_PASS, or BREVO_API_KEY'
  else
    Rails.logger.warn '⚠️  E-mail credentials missing — using test delivery method' unless Rails.env.test?
    config.action_mailer.delivery_method = :test
  end

  ActionMailer::Base.delivery_method = config.action_mailer.delivery_method
  ActionMailer::Base.smtp_settings = config.action_mailer.smtp_settings if config.action_mailer.smtp_settings.present?

  # 5. Environment Specifics
  if Rails.env.production?
    config.action_mailer.deliver_later_queue_name = 'mailers'
    config.action_mailer.delivery_job = 'ActionMailer::MailDeliveryJob'
  end

  if Rails.env.development?
    config.action_mailer.show_previews = true
    config.action_mailer.preview_path = Rails.root.join('spec/mailers/previews')
  end
end

# 6. Interceptor for Non-Production (Prevent Leakage)
if !Rails.env.production? && ENV['ENABLE_EMAIL_INTERCEPTOR'] == 'true'
  require 'mail'
  class EmailInterceptor
    def self.delivering_email(message)
      safe_domains = ENV.fetch('SAFE_EMAIL_DOMAINS', 'example.com,test.com').split(',')
      unless message.to.any? { |email| safe_domains.any? { |d| email.ends_with?(d) } }
        Rails.logger.warn "[EmailInterceptor] Blocked email outside safe domains"
        message.perform_deliveries = false
      end
    end
  end
  ActionMailer::Base.register_interceptor(EmailInterceptor)
end

Rails.logger.info "✅ ActionMailer integrated configuration loaded (#{Rails.env})"

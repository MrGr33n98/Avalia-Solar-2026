# frozen_string_literal: true

# Base mailer - TASK-018
class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM_EMAIL', 'noreply@ab0-1.com')
  layout 'mailer'

  # Helper methods
  def self.default_url_options
    {
      host: ENV.fetch('APP_HOST', 'localhost:3000'),
      protocol: Rails.env.production? ? 'https' : 'http'
    }
  end

  private

  # Track email delivery status
  after_action :log_email_sent
  after_action :track_email_metrics

  def log_email_sent
    Rails.logger.info "[Mailer] Sent: #{message.subject} to #{message.to.join(', ')}"
  end

  def track_email_metrics
    return unless defined?(Yabeda)
    
    # Track email sent metrics
    Yabeda.mailers.emails_sent.increment(
      { mailer: self.class.name, action: action_name },
      by: 1
    )
  rescue StandardError => e
    Rails.logger.error "[Mailer] Failed to track metrics: #{e.message}"
  end

  # Add retry metadata to email headers
  def add_retry_headers(attempt: 1, max_attempts: 5)
    headers['X-Retry-Attempt'] = attempt.to_s
    headers['X-Max-Attempts'] = max_attempts.to_s
  end

  # Check if email should be sent based on user preferences
  def user_accepts_emails?(user, email_type)
    return true unless user.respond_to?(:email_preferences)
    
    user.email_preferences.fetch(email_type, true)
  end
end

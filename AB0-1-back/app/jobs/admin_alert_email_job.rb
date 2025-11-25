# frozen_string_literal: true

# Send admin alerts - TASK-018
class AdminAlertEmailJob < ApplicationJob
  queue_as :critical # High priority queue
  
  # Admin alerts should be sent quickly, few retries
  retry_on StandardError, wait: 10.seconds, attempts: 3

  def perform(admin_email, alert_type, details)
    NotificationMailer.admin_alert(admin_email, alert_type, details).deliver_now
    
    Rails.logger.info "✅ Admin alert sent: #{alert_type}"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send admin alert: #{e.message}"
    # Don't raise - admin alerts shouldn't block other jobs
    Sentry.capture_exception(e) if defined?(Sentry)
  end
end

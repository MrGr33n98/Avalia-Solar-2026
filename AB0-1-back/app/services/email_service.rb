# frozen_string_literal: true

# Service to handle email sending - TASK-018
# Centralizes email logic and provides consistent interface
class EmailService
  class << self
    # User emails
    def send_welcome_email(user, delay: 0.seconds)
      WelcomeEmailJob.set(wait: delay).perform_later(user.id)
      log_email_queued('welcome', user.email)
    end

    def send_password_reset(user, token, delay: 0.seconds)
      PasswordResetEmailJob.set(wait: delay).perform_later(user.id, token)
      log_email_queued('password_reset', user.email)
    end

    def send_email_confirmation(user, token, delay: 0.seconds)
      EmailConfirmationJob.set(wait: delay).perform_later(user.id, token)
      log_email_queued('email_confirmation', user.email)
    end

    def send_account_updated(user, changes, delay: 0.seconds)
      AccountUpdatedEmailJob.set(wait: delay).perform_later(user.id, changes)
      log_email_queued('account_updated', user.email)
    end

    # Company emails
    def send_new_review_notification(company, review, delay: 0.seconds)
      CompanyNewReviewNotificationJob.set(wait: delay).perform_later(company.id, review.id)
      log_email_queued('new_review', company.email)
    end

    def send_monthly_digest(company, delay: 0.seconds)
      CompanyMonthlyDigestJob.set(wait: delay).perform_later(company.id)
      log_email_queued('monthly_digest', company.email)
    end

    # Admin emails
    def send_admin_alert(admin_email, alert_type, details)
      # Admin alerts are sent immediately (critical queue)
      AdminAlertEmailJob.perform_later(admin_email, alert_type, details)
      log_email_queued('admin_alert', admin_email, urgent: true)
    end

    # Generic notification
    def send_notification(recipient_email, subject, message, delay: 0.seconds)
      NotificationEmailJob.set(wait: delay).perform_later(recipient_email, subject, message)
      log_email_queued('notification', recipient_email)
    end

    # Bulk operations
    def send_bulk_emails(recipients, email_type, data = {})
      Rails.logger.info "[EmailService] Queueing #{recipients.count} #{email_type} emails"
      
      recipients.each_with_index do |recipient, index|
        # Stagger emails to avoid overwhelming the mail server
        delay = (index * 2).seconds
        
        case email_type
        when :welcome
          send_welcome_email(recipient, delay: delay)
        when :monthly_digest
          send_monthly_digest(recipient, delay: delay)
        else
          Rails.logger.warn "[EmailService] Unknown bulk email type: #{email_type}"
        end
      end

      Rails.logger.info "[EmailService] ✅ Queued #{recipients.count} emails"
    end

    # Check email delivery status (requires ActionMailer logging)
    def delivery_stats(period: 24.hours)
      # This is a placeholder - implement based on your logging strategy
      Rails.logger.info "[EmailService] Email stats for last #{period}:"
      
      # Example metrics you could track:
      # - Total emails sent
      # - Failed emails
      # - Emails by type
      # - Average delivery time
      
      { period: period, note: 'Implement based on monitoring solution' }
    end

    private

    def log_email_queued(email_type, recipient, urgent: false)
      priority = urgent ? '🔴' : '📧'
      Rails.logger.info "#{priority} [EmailService] Queued #{email_type} to #{recipient}"
      
      # Track metrics
      track_email_metric(email_type, 'queued')
    end

    def track_email_metric(email_type, status)
      return unless defined?(Yabeda)
      
      Yabeda.emails.queued.increment(
        { type: email_type, status: status },
        by: 1
      )
    rescue StandardError => e
      Rails.logger.error "[EmailService] Failed to track metric: #{e.message}"
    end
  end
end

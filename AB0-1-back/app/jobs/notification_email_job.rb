# frozen_string_literal: true

# Send notification via email - TASK-019
class NotificationEmailJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(notification_id)
    notification = Notification.find(notification_id)
    user = notification.user

    NotificationMailer.system_notification(
      user,
      notification.notification_type,
      notification.message || notification.title
    ).deliver_now

    Rails.logger.info "✅ Notification email sent: #{notification.id} to #{user.email}"
  end
end

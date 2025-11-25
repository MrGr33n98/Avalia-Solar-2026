# frozen_string_literal: true

# Create and deliver notification - TASK-019
class CreateNotificationJob < ApplicationJob
  queue_as :default
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  def perform(user_id, notification_type, title, options = {})
    user = User.find(user_id)

    notification = Notification.create!(
      user: user,
      notification_type: notification_type,
      title: title,
      message: options[:message],
      data: options[:data],
      notifiable: options[:notifiable],
      delivery_channels: options[:delivery_channels] || ['in_app']
    )

    notification.deliver!

    Rails.logger.info "✅ Notification created and delivered: #{notification.id}"
    notification
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.warn "User #{user_id} not found, skipping notification"
  end
end

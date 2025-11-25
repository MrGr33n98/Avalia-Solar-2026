# frozen_string_literal: true

# Notifiable concern - TASK-019
# Include in User model: include Notifiable
module Notifiable
  extend ActiveSupport::Concern

  included do
    has_many :notifications, dependent: :destroy
  end

  # Get unread notifications
  def unread_notifications
    notifications.unread.recent
  end

  # Get unread count
  def unread_notifications_count
    notifications.unread.count
  end

  # Mark all as read
  def mark_all_notifications_as_read
    Notification.mark_all_as_read(self)
  end

  # Check if has unread notifications
  def has_unread_notifications?
    unread_notifications_count > 0
  end
end

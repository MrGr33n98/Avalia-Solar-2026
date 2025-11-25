# frozen_string_literal: true

# Notification model - TASK-019
class Notification < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true

  # Validations
  validates :notification_type, presence: true
  validates :title, presence: true
  validates :delivery_channels, presence: true

  # Scopes
  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
  scope :unsent, -> { where(sent_at: nil) }
  scope :by_type, ->(type) { where(notification_type: type) }

  # Types
  TYPES = %w[
    new_review
    review_response
    new_follower
    new_comment
    review_helpful
    company_response
    account_update
    security_alert
    system_message
  ].freeze

  validates :notification_type, inclusion: { in: TYPES }

  # Instance methods
  def read!
    update(read_at: Time.current) if read_at.nil?
  end

  def unread!
    update(read_at: nil)
  end

  def read?
    read_at.present?
  end

  def unread?
    !read?
  end

  def mark_as_sent!
    update(sent_at: Time.current) if sent_at.nil?
  end

  def sent?
    sent_at.present?
  end

  # Deliver notification
  def deliver!
    return if sent?

    delivery_channels.each do |channel|
      case channel
      when 'in_app'
        # Already created in database
        Rails.logger.info "In-app notification #{id} ready"
      when 'email'
        NotificationEmailJob.perform_later(id)
      when 'push'
        PushNotificationJob.perform_later(id) if defined?(PushNotificationJob)
      end
    end

    mark_as_sent!
  end

  # Class methods
  def self.create_and_deliver!(attributes)
    notification = create!(attributes)
    notification.deliver!
    notification
  end

  def self.mark_all_as_read(user)
    where(user: user).unread.update_all(read_at: Time.current)
  end
end

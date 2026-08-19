# frozen_string_literal: true

# Notification model - Expanded for Review Client Notifications Central
class Notification < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true
  belongs_to :company, optional: true
  belongs_to :conversation, optional: true
  belongs_to :review, optional: true

  # Validations
  validates :notification_type, presence: true
  validates :title, presence: true

  # Scopes
  scope :active, -> { where(archived_at: nil) }
  scope :archived, -> { where.not(archived_at: nil) }
  scope :unread, -> { active.where(read_at: nil) }
  scope :read, -> { active.where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
  scope :unsent, -> { where(sent_at: nil) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :by_category, ->(cat) { where(category: cat) }

  # Categories
  CATEGORIES = %w[quotes reviews messages companies system community].freeze

  # Event Types
  TYPES = %w[
    quote_received
    quote_updated
    quote_info_requested
    quote_expiring
    quote_accepted
    quote_rejected
    quote_condition_changed
    review_published
    review_approved
    review_rejected
    review_replied
    review_helpful
    review_featured
    new_message
    new_conversation
    message_attachment
    favorite_company_updated
    favorite_company_product
    favorite_company_verified
    security_login
    security_password_changed
    security_alert
    system_update
    new_review
    new_lead
    status_update
    reply_received
    review_response
    company_response
    account_update
    publication_reacted
    publication_commented
    comment_replied
    creator_followed
    company_followed
    user_mentioned
    system_message
  ].freeze

  validates :notification_type, inclusion: { in: TYPES }

  # Callbacks
  before_validation :assign_category_from_type

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

  def archive!
    update(archived_at: Time.current) if archived_at.nil?
  end

  def unarchive!
    update(archived_at: nil)
  end

  def archived?
    archived_at.present?
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

    channels = delivery_channels || ['in_app']
    channels.each do |channel|
      case channel
      when 'in_app'
        Rails.logger.info "In-app notification #{id} ready"
      when 'email'
        NotificationEmailJob.perform_later(id) if defined?(NotificationEmailJob)
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

  private

  def assign_category_from_type
    return if category.present? && category != 'system'

    self.category = case notification_type.to_s
                    when /^quote_/ then 'quotes'
                    when /^review_/ then 'reviews'
                    when /^new_message/, /^new_conversation/, /^message_/ then 'messages'
                    when /^favorite_company_/ then 'companies'
                    else 'system'
                    end
  end
end

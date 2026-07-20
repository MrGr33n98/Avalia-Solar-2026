# frozen_string_literal: true

class NotificationPreference < ApplicationRecord
  belongs_to :user

  validates :event_type, presence: true, uniqueness: { scope: :user_id }
  validates :frequency, inclusion: { in: %w[immediately daily_digest weekly_digest] }

  EVENT_TYPES = %w[
    quote_received
    company_replied
    review_published
    new_message
    favorite_company_updated
    security_alert
  ].freeze

  def self.default_for_user(user)
    EVENT_TYPES.map do |type|
      find_or_create_by!(user: user, event_type: type) do |pref|
        pref.in_app_enabled = true
        pref.email_enabled = true
        pref.push_enabled = true
        pref.whatsapp_enabled = false
        pref.frequency = 'immediately'
      end
    end
  end
end

module Sales
  class EmailEvent < ApplicationRecord
    self.table_name = 'sales_email_events'

    belongs_to :company

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id

    EVENT_TYPES = %w[queued sent provider_accepted delivered open open_signal provider_open_signal click
                     provider_click_signal replied bounce complaint reject delivery_delay unsubscribed failed].freeze
    SOURCES = %w[sales_crm aws_ses_sns aws_ses_api avalia_pixel avalia_link inbound_email unsubscribe legacy].freeze
    SIGNAL_CLASSES = %w[human_likely proxy bot scanner unknown].freeze

    validates :event_type, inclusion: { in: EVENT_TYPES }
    validates :source, inclusion: { in: SOURCES }
    validates :signal_class, inclusion: { in: SIGNAL_CLASSES }
    validates :occurred_at, presence: true

    after_create_commit :broadcast_timeline_change

    private

    def broadcast_timeline_change
      return unless timeline_sequence.present?
      return if source == 'aws_ses_sns' && %w[provider_open_signal provider_click_signal].include?(event_type)

      ::Sales::Timeline::Broadcaster.call(self)
    rescue StandardError => e
      Rails.logger.warn({ event: 'sales_timeline_broadcast_failed', email_event_id: id,
                          error_class: e.class.name }.to_json)
    end
  end
end

module Sales
  class EmailEvent < ApplicationRecord
    self.table_name = 'sales_email_events'

    belongs_to :company

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id

    EVENT_TYPES = %w[queued sent delivered open click replied bounce complaint reject delivery_delay failed].freeze

    validates :event_type, inclusion: { in: EVENT_TYPES }
    validates :occurred_at, presence: true
  end
end

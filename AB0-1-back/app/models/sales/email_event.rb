module Sales
  class EmailEvent < ApplicationRecord
    self.table_name = 'sales_email_events'

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id

    EVENT_TYPES = %w[sent delivered open click bounce complaint reject].freeze

    validates :event_type, inclusion: { in: EVENT_TYPES }
    validates :occurred_at, presence: true
  end
end

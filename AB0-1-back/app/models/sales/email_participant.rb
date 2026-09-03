# frozen_string_literal: true

module Sales
  class EmailParticipant < ApplicationRecord
    self.table_name = 'sales_email_participants'

    belongs_to :company

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true

    validates :email, presence: true
    validates :participant_type, presence: true, inclusion: { in: %w[from to cc bcc reply_to] }
  end
end

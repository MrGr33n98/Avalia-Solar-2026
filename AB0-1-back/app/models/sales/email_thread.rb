# frozen_string_literal: true

module Sales
  class EmailThread < ApplicationRecord
    self.table_name = 'sales_email_threads'

    belongs_to :company
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true

    has_many :messages, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_thread_id, dependent: :destroy

    scope :recent, -> { order(last_message_at: :desc) }
  end
end

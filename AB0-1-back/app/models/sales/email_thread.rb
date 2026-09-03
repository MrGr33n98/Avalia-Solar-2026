# frozen_string_literal: true

module Sales
  class EmailThread < ApplicationRecord
    self.table_name = 'sales_email_threads'

    has_many :messages, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_thread_id, dependent: :destroy

    scope :recent, -> { order(last_message_at: :desc) }
  end
end

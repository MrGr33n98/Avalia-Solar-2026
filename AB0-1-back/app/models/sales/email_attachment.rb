# frozen_string_literal: true

module Sales
  class EmailAttachment < ApplicationRecord
    self.table_name = 'sales_email_attachments'

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id
    has_one_attached :file

    validates :file_name, :content_type, presence: true
  end
end

# frozen_string_literal: true

module Sales
  class EmailAttachment < ApplicationRecord
    self.table_name = 'sales_email_attachments'

    belongs_to :company

    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id
    has_one_attached :file

    MAX_SIZE = 10.megabytes
    ALLOWED_TYPES = %w[application/pdf image/png image/jpeg text/plain application/vnd.openxmlformats-officedocument.spreadsheetml.sheet].freeze

    validates :file_name, :content_type, presence: true
    validate :file_is_safe

    private

    def file_is_safe
      return unless file.attached?

      errors.add(:file, 'deve ter no máximo 10MB') if file.blob.byte_size > MAX_SIZE
      errors.add(:file, 'possui tipo não permitido') unless ALLOWED_TYPES.include?(file.blob.content_type)
    end
  end
end

# frozen_string_literal: true

module Sales
  class EmailLink < ApplicationRecord
    self.table_name = 'sales_email_links'

    belongs_to :email_message, class_name: 'Sales::EmailMessage'

    validates :token, :original_url, presence: true
    validates :original_url, format: { with: %r{\Ahttps?://}i }
    validates :token, uniqueness: true
  end
end

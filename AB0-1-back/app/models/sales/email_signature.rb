# frozen_string_literal: true

module Sales
  class EmailSignature < ApplicationRecord
    self.table_name = 'sales_email_signatures'

    belongs_to :user
    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id, optional: true

    validates :name, :body_html, presence: true
  end
end

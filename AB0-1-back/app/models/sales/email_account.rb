# frozen_string_literal: true

module Sales
  class EmailAccount < ApplicationRecord
    self.table_name = 'sales_email_accounts'

    belongs_to :company

    belongs_to :user
    has_many :email_messages, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_account_id, dependent: :nullify
    has_many :email_signatures, class_name: 'Sales::EmailSignature', foreign_key: :sales_email_account_id, dependent: :destroy

    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :provider, presence: true, inclusion: { in: %w[ses google microsoft] }

    scope :active, -> { where(sync_status: %w[idle syncing]) }
  end
end

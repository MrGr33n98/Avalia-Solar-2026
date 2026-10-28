# frozen_string_literal: true

module Sales
  class EmailThread < ApplicationRecord
    self.table_name = 'sales_email_threads'

    STATUSES = %w[open pending resolved archived].freeze

    belongs_to :company
    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id, optional: true
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :assigned_user, class_name: 'User', foreign_key: :assigned_user_id, optional: true

    has_many :messages, -> { order(created_at: :asc) }, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_thread_id, dependent: :destroy

    scope :recent, -> { order(last_message_at: :desc) }
    scope :for_mailbox, ->(mailbox_id) { where(sales_email_account_id: mailbox_id) }
    scope :with_status, ->(status) { where(status: status) if status.present? && STATUSES.include?(status.to_s) }

    def unread_messages_count
      messages.where(direction: 'inbound', read_at: nil).count rescue 0
    end

    def latest_message
      messages.last
    end
  end
end

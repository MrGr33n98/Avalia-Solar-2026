# frozen_string_literal: true

module Sales
  class CampaignRecipient < ApplicationRecord
    self.table_name = 'sales_campaign_recipients'

    belongs_to :company
    belongs_to :campaign, class_name: 'Sales::Campaign', foreign_key: :sales_campaign_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :email_message, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_message_id, optional: true

    STATUSES = %w[pending queued sent delivered failed bounced unsubscribed].freeze

    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :status, inclusion: { in: STATUSES }

    scope :pending, -> { where(status: 'pending') }
    scope :failed_or_pending, -> { where(status: %w[pending failed]) }
    scope :sent, -> { where(status: %w[sent delivered opened clicked]) }

    def mark_sent!(message)
      update!(
        status: 'sent',
        sales_email_message_id: message.id,
        sent_at: Time.current,
        error_message: nil
      )
      campaign.update_progress_counters!
    end

    def mark_failed!(reason)
      update!(
        status: 'failed',
        error_message: reason.to_s
      )
      campaign.update_progress_counters!
    end
  end
end

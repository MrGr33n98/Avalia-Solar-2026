# frozen_string_literal: true

module Sales
  class EmailMessage < ApplicationRecord
    self.table_name = 'sales_email_messages'

    belongs_to :company

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :sender_user, class_name: 'User', foreign_key: :sender_user_id, optional: true

    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id, optional: true
    belongs_to :email_thread, class_name: 'Sales::EmailThread', foreign_key: :sales_email_thread_id, optional: true
    belongs_to :campaign, class_name: 'Sales::Campaign', foreign_key: :sales_campaign_id, optional: true
    belongs_to :campaign_recipient, class_name: 'Sales::CampaignRecipient', foreign_key: :sales_campaign_recipient_id, optional: true

    has_many :participants, class_name: 'Sales::EmailParticipant', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :attachments, class_name: 'Sales::EmailAttachment', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :events, class_name: 'Sales::EmailEvent', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :links, class_name: 'Sales::EmailLink', foreign_key: :email_message_id, dependent: :destroy

    STATUSES = %w[draft queued sent delivered bounced failed].freeze

    validates :status, inclusion: { in: STATUSES }
    validates :from_email, presence: true
    validates :to_email, presence: true
    validates :subject, presence: true
    validates :sales_campaign_recipient_id, uniqueness: true, allow_nil: true

    scope :queued, -> { where(status: 'queued') }
    scope :sent, -> { where(status: 'sent') }
    scope :delivered, -> { where(status: 'delivered') }

    before_create :ensure_tracking_token

    def register_event!(event_type:, provider_event_id: nil, url: nil, user_agent: nil, occurred_at: Time.current, payload: {})
      return if provider_event_id.present? && events.exists?(provider_event_id: provider_event_id)

      events.create!(
        company_id: company_id,
        event_type: event_type,
        provider_event_id: provider_event_id,
        url: url,
        user_agent: user_agent,
        occurred_at: occurred_at,
        payload: payload
      )

      case event_type.to_s
      when 'delivered'
        update!(status: 'delivered', delivered_at: occurred_at)
      when 'bounce'
        update!(status: 'bounced', bounced_at: occurred_at)
      when 'open'
        increment!(:open_count)
        update!(first_opened_at: first_opened_at || occurred_at, last_opened_at: occurred_at)
      when 'click'
        increment!(:click_count)
        update!(first_clicked_at: first_clicked_at || occurred_at, last_clicked_at: occurred_at)
      end
    end

    private

    def ensure_tracking_token
      self.tracking_token ||= SecureRandom.hex(16)
    end
  end
end

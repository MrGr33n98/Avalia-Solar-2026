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
    belongs_to :sequence_enrollment_step, class_name: 'Sales::EmailSequenceEnrollmentStep',
               foreign_key: :sales_email_sequence_enrollment_step_id, optional: true

    has_many :participants, class_name: 'Sales::EmailParticipant', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :attachments, class_name: 'Sales::EmailAttachment', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :events, class_name: 'Sales::EmailEvent', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :links, class_name: 'Sales::EmailLink', foreign_key: :email_message_id, dependent: :destroy

    STATUSES = %w[draft queued sending sent delivered bounced failed].freeze

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
      return events.find_by!(provider_event_id: provider_event_id) if provider_event_id.present? &&
                                                                      events.exists?(provider_event_id: provider_event_id)

      self.class.transaction do
        event = events.create!(
          company_id: company_id,
          event_type: event_type,
          provider_event_id: provider_event_id,
          url: url,
          user_agent: user_agent,
          occurred_at: occurred_at,
          payload: payload
        )
        apply_event!(event_type.to_s, occurred_at)
        event
      end
    rescue ActiveRecord::RecordNotUnique
      raise unless provider_event_id.present?

      events.find_by!(provider_event_id: provider_event_id)
    end

    private

    def apply_event!(event_type, occurred_at)
      case event_type
      when 'delivered'
        update!(status: 'delivered', delivered_at: occurred_at) unless status == 'bounced'
      when 'bounce'
        update!(status: 'bounced', bounced_at: occurred_at)
      when 'open'
        increment!(:open_count)
        update!(first_opened_at: first_opened_at || occurred_at, last_opened_at: occurred_at)
      when 'click'
        increment!(:click_count)
        update!(first_clicked_at: first_clicked_at || occurred_at, last_clicked_at: occurred_at)
      end

      sync_campaign_recipient!(event_type, occurred_at)
      record_timeline_event!(event_type, occurred_at)
    end

    def sync_campaign_recipient!(event_type, occurred_at)
      recipient = campaign_recipient
      return unless recipient

      updates = recipient_updates_for(event_type, recipient.status, occurred_at)
      return unless updates

      recipient.update!(updates)
      campaign.update_progress_counters!
    end

    def recipient_updates_for(event_type, recipient_status, occurred_at)
      case event_type
      when 'delivered'
        { status: 'delivered', delivered_at: occurred_at } unless %w[bounced unsubscribed].include?(recipient_status)
      when 'open'
        { status: 'opened', opened_at: occurred_at } unless %w[clicked bounced unsubscribed].include?(recipient_status)
      when 'click'
        { status: 'clicked', clicked_at: occurred_at } unless %w[bounced unsubscribed].include?(recipient_status)
      when 'bounce'
        { status: 'bounced', bounced_at: occurred_at } unless recipient_status == 'unsubscribed'
      when 'complaint'
        { status: 'unsubscribed', unsubscribed_at: occurred_at }
      end
    end

    def record_timeline_event!(event_type, occurred_at)
      return unless %w[delivered bounce complaint].include?(event_type)
      return unless sales_account_id.present? && sender_user_id.present?

      ::Sales::Activity.create!(
        sales_account_id: sales_account_id,
        sales_contact_id: sales_contact_id,
        sales_opportunity_id: sales_opportunity_id,
        actor_id: sender_user_id,
        activity_type: "email_#{event_type}",
        direction: 'outbound',
        subject: "E-mail #{event_type}: #{subject}",
        occurred_at: occurred_at,
        metadata: { email_message_id: id }
      )
    end

    def ensure_tracking_token
      self.tracking_token ||= SecureRandom.hex(16)
    end
  end
end

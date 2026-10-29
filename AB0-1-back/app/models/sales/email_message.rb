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
    belongs_to :campaign_recipient, class_name: 'Sales::CampaignRecipient', foreign_key: :sales_campaign_recipient_id,
                                    optional: true
    belongs_to :sequence_enrollment_step, class_name: 'Sales::EmailSequenceEnrollmentStep',
                                          foreign_key: :sales_email_sequence_enrollment_step_id, optional: true
    belongs_to :parent_email_message, class_name: 'Sales::EmailMessage', foreign_key: :parent_email_message_id, optional: true
    belongs_to :reply_mailbox, class_name: 'Sales::EmailAccount', foreign_key: :reply_mailbox_id, optional: true

    has_many :replies, class_name: 'Sales::EmailMessage', foreign_key: :parent_email_message_id, dependent: :nullify

    has_many :participants, class_name: 'Sales::EmailParticipant', foreign_key: :sales_email_message_id,
                            dependent: :destroy
    has_many :attachments, class_name: 'Sales::EmailAttachment', foreign_key: :sales_email_message_id,
                           dependent: :destroy
    has_many :events, class_name: 'Sales::EmailEvent', foreign_key: :sales_email_message_id, dependent: :destroy
    has_many :links, class_name: 'Sales::EmailLink', foreign_key: :email_message_id, dependent: :destroy

    STATUSES = %w[draft queued sending sent delivered bounced failed received].freeze
    DIRECTIONS = %w[inbound outbound].freeze

    validates :status, inclusion: { in: STATUSES }
    validates :from_email, presence: true
    validates :to_email, presence: true
    validates :subject, presence: true
    validates :sales_campaign_recipient_id, uniqueness: true, allow_nil: true

    scope :queued, -> { where(status: 'queued') }
    scope :sent, -> { where(status: 'sent') }
    scope :delivered, -> { where(status: 'delivered') }
    scope :inbound, -> { where(direction: 'inbound') }
    scope :outbound, -> { where(direction: 'outbound') }
    scope :human_replies, -> { inbound.where(inbound_classification: 'human_reply') }

    before_create :ensure_tracking_token

    def register_event!(event_type:, **event_attributes)
      event_attributes = normalize_event_attributes(event_attributes)
      existing = existing_event(event_attributes)
      return existing if existing

      self.class.transaction do
        create_event_with_timeline_sequence!(event_attributes.merge(event_type: event_type))
      end
    rescue ActiveRecord::RecordNotUnique
      raise unless event_attributes[:provider_event_id].present? || event_attributes[:dedupe_key].present?

      existing_event(event_attributes)
    end

    def normalize_event_attributes(attributes)
      attributes[:source] ||= attributes[:provider_event_id].present? ? 'aws_ses_sns' : 'legacy'
      attributes[:occurred_at] ||= Time.current
      attributes
    end

    private

    def create_event_with_timeline_sequence!(event_attributes)
      opportunity = timeline_opportunity
      return create_locked_event!(event_attributes) unless opportunity

      opportunity.with_lock do
        lock!
        sequence = opportunity.sales_timeline_sequence.to_i + 1
        opportunity.update!(sales_timeline_sequence: sequence)
        create_locked_event!(event_attributes.merge(timeline_sequence: sequence))
      end
    end

    def timeline_opportunity
      if sales_opportunity_id
        return ::Sales::Opportunity.joins(:account).find_by(id: sales_opportunity_id,
                                                            sales_accounts: { company_id: company_id })
      end
      return unless sales_account_id

      account = ::Sales::Account.find_by(id: sales_account_id, company_id: company_id)
      return unless account

      opportunities = account.opportunities.limit(2).to_a
      opportunities.one? ? opportunities.first : nil
    end

    def create_locked_event!(event_attributes)
      event = events.create!(event_attributes.merge(company_id: company_id, received_at: Time.current))
      apply_event!(event)
      event
    end

    def existing_event(attributes)
      if attributes[:provider_event_id].present?
        event = events.find_by(provider_event_id: attributes[:provider_event_id])
        return event if event
      end
      return unless attributes[:dedupe_key].present?

      events.find_by(company_id: company_id, dedupe_key: attributes[:dedupe_key])
    end

    def apply_event!(event)
      handler = {
        'delivered' => :apply_delivered!, 'provider_accepted' => :apply_sent!, 'sent' => :apply_sent!,
        'delivery_delay' => :apply_delayed!, 'bounce' => :apply_bounced!, 'reject' => :apply_rejected!,
        'failed' => :apply_failed!, 'open_signal' => :apply_open_signal_event!, 'click' => :apply_click_event!,
        'replied' => :apply_reply!
      }[event.event_type]
      send(handler, event) if handler
      sync_campaign_recipient!(event.event_type, event.occurred_at) if sync_campaign_event?(event)
    end

    def apply_delivered!(event)
      apply_delivery_event!('delivered', event.occurred_at)
    end

    def apply_sent!(event)
      apply_delivery_event!('sent', event.occurred_at)
    end

    def apply_delayed!(event)
      apply_delivery_event!('delayed', event.occurred_at)
    end

    def apply_bounced!(event)
      apply_delivery_event!('bounced', event.occurred_at)
    end

    def apply_rejected!(event)
      apply_delivery_event!('rejected', event.occurred_at)
    end

    def apply_failed!(event)
      apply_delivery_event!('failed', event.occurred_at)
    end

    def apply_open_signal_event!(event)
      apply_open_signal!(event.occurred_at, event.signal_class) if event.source == 'avalia_pixel'
    end

    def apply_click_event!(event)
      apply_click_signal!(event.occurred_at, event.signal_class, event.payload, event.id) if event.source == 'avalia_link'
    end

    def apply_reply!(event)
      update!(engagement_status: 'replied', replied_at: replied_at || event.occurred_at)
    end

    def sync_campaign_event?(event)
      source = event.source
      type = event.event_type
      signal_class = event.signal_class
      return true if source == 'aws_ses_sns' && type.in?(%w[delivered delivery_delay bounce complaint reject])
      return true if source == 'avalia_link' && type == 'click' && signal_class.in?(%w[human_likely unknown])
      return true if source == 'avalia_pixel' && type == 'open_signal' && signal_class.in?(%w[human_likely proxy unknown])

      source.in?(%w[inbound_email unsubscribe]) && type.in?(%w[replied unsubscribed])
    end

    def apply_delivery_event!(state, occurred_at)
      current = delivery_status.presence || status
      return unless delivery_transition_allowed?(current, state)

      updates = { delivery_status: state, status: legacy_delivery_status(state) }
      timestamp_column = { 'delivered' => :delivered_at, 'delayed' => :delayed_at,
                           'rejected' => :rejected_at, 'bounced' => :bounced_at }[state]
      updates[timestamp_column] = occurred_at if timestamp_column
      update!(updates.compact)
    end

    def legacy_delivery_status(state)
      return 'failed' if state == 'rejected'
      return state if STATUSES.include?(state)

      nil
    end

    def delivery_transition_allowed?(current, state)
      forbidden = {
        'delivered' => %w[bounced rejected],
        'bounced' => %w[rejected],
        'rejected' => %w[delivered bounced],
        'delayed' => %w[delivered bounced rejected failed],
        'sent' => %w[delivered delayed bounced rejected],
        'failed' => %w[sent delayed delivered bounced rejected]
      }
      !Array(forbidden[state]).include?(current)
    end

    def apply_open_signal!(occurred_at, signal_class)
      increment!(:raw_open_signals)
      increment!(:open_count)
      metric = { 'human_likely' => :human_likely_open_signals, 'proxy' => :proxy_open_signals,
                 'bot' => :bot_open_signals, 'scanner' => :scanner_open_signals }[signal_class]
      increment!(metric) if metric
      increment!(:unique_open_signals) if signal_class.in?(%w[human_likely proxy unknown]) && unique_open_signals.zero?
      update!(engagement_status: 'open_signal') if engagement_status == 'none'
      update!(first_opened_at: first_opened_at || occurred_at, last_opened_at: occurred_at)
    end

    def apply_click_signal!(occurred_at, signal_class, payload, current_event_id = nil)
      increment!(:raw_clicks)
      increment!(:click_count)
      record_click_classification(signal_class)
      link_id = payload['email_link_id'].to_s
      unique_click = unique_click?(link_id, signal_class, current_event_id)
      increment!(:unique_clicks) if unique_click
      update!(engagement_status: 'clicked') if unique_click && engagement_status != 'replied'
      update!(first_clicked_at: first_clicked_at || occurred_at, last_clicked_at: occurred_at)
    end

    def record_click_classification(signal_class)
      increment!(:bot_clicks) if signal_class == 'bot'
      increment!(:scanner_clicks) if signal_class == 'scanner'
    end

    def unique_click?(link_id, signal_class, current_event_id = nil)
      eligible = signal_class.in?(%w[human_likely proxy unknown])
      return false unless eligible

      query = events.where(source: 'avalia_link', event_type: 'click', signal_class: %w[human_likely proxy unknown])
                    .where("payload ->> 'email_link_id' = ?", link_id)
      query = query.where.not(id: current_event_id) if current_event_id.present?
      !query.exists?
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
      if %w[bounced unsubscribed].include?(recipient_status) && %w[delivered delivery_delay click].include?(event_type)
        return
      end
      return if recipient_status == 'clicked' && event_type == 'open_signal'

      {
        'delivered' => { status: 'delivered', delivered_at: occurred_at },
        'delivery_delay' => { status: 'delayed', delayed_at: occurred_at },
        'open_signal' => { status: 'opened', opened_at: occurred_at },
        'click' => { status: 'clicked', clicked_at: occurred_at },
        'bounce' => { status: 'bounced', bounced_at: occurred_at },
        'complaint' => { status: 'unsubscribed', unsubscribed_at: occurred_at },
        'unsubscribed' => { status: 'unsubscribed', unsubscribed_at: occurred_at }
      }[event_type]
    end

    def ensure_tracking_token
      self.tracking_token ||= SecureRandom.hex(16)
    end
  end
end

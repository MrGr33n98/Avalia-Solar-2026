# frozen_string_literal: true

module Sales
  class Campaign < ApplicationRecord
    self.table_name = 'sales_campaigns'

    belongs_to :company
    belongs_to :user, class_name: 'User', foreign_key: :user_id, optional: true
    belongs_to :email_template, class_name: 'Sales::EmailTemplate', foreign_key: :email_template_id, optional: true

    has_many :recipients, class_name: 'Sales::CampaignRecipient', foreign_key: :sales_campaign_id, dependent: :destroy
    has_many :email_messages, class_name: 'Sales::EmailMessage', foreign_key: :sales_campaign_id, dependent: :nullify
    has_many :daily_metrics, class_name: 'Sales::CampaignDailyMetric', foreign_key: :sales_campaign_id, dependent: :destroy

    STATUSES = %w[draft scheduled dispatching paused completed cancelled].freeze
    CAMPAIGN_TYPES = %w[email_broadcast sequence drip event_triggered].freeze

    validates :name, presence: true
    validates :campaign_key, presence: true, uniqueness: { scope: :company_id }
    validates :status, inclusion: { in: STATUSES }
    validates :campaign_type, inclusion: { in: CAMPAIGN_TYPES }

    scope :active_campaigns, -> { where(active: true) }
    scope :by_status, ->(st) { where(status: st) }
    scope :due_for_scheduled_dispatch, -> { where(status: 'scheduled').where('scheduled_at <= ?', Time.current) }

    before_validation :ensure_campaign_key

    def can_dispatch?
      %w[draft scheduled paused].include?(status)
    end

    def can_pause?
      status == 'dispatching'
    end

    def can_resume?
      status == 'paused'
    end

    def update_progress_counters!
      counts = recipients.group(:status).count
      sent = counts['sent'].to_i + counts['delivered'].to_i + counts['opened'].to_i + counts['clicked'].to_i
      deliv = counts['delivered'].to_i + counts['opened'].to_i + counts['clicked'].to_i
      opened = counts['opened'].to_i + counts['clicked'].to_i
      clicked = counts['clicked'].to_i
      bounced = counts['bounced'].to_i
      unsub = counts['unsubscribed'].to_i
      processed = sent + bounced + unsub + counts['failed'].to_i

      update_columns(
        processed_recipients: processed,
        sent_count: sent,
        delivered_count: deliv,
        opened_count: opened,
        clicked_count: clicked,
        bounced_count: bounced,
        unsubscribed_count: unsub
      )

      if total_recipients > 0 && processed >= total_recipients && status == 'dispatching'
        update!(status: 'completed', completed_at: Time.current)
      end
    end

    private

    def ensure_campaign_key
      self.campaign_key ||= name.to_s.parameterize.presence || "cmp-#{SecureRandom.hex(6)}"
    end
  end
end
